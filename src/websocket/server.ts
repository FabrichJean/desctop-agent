import { createServer as createHttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { readFileSync } from "fs";
import { join } from "path";
import { networkInterfaces } from "os";
import { parseEvent, AgentEvent } from "../types/events";
import { getLatestFrame, startCaptureLoop, onNewFrame } from "../screen/capture";

export type EventHandler = (event: AgentEvent) => Promise<void>;

function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

export function createServer(port: number, onEvent: EventHandler): void {
  const htmlPath = join(process.cwd(), "src", "web", "touchpad.html");
  let html: string;
  try {
    html = readFileSync(htmlPath, "utf8");
  } catch {
    html = `<h1 style="font-family:monospace;padding:2rem">touchpad.html introuvable : ${htmlPath}</h1>`;
  }

  const httpServer = createHttpServer(async (req, res) => {
    const url = req.url ?? "/";

    // ── Screen snapshot (returns pre-captured frame immediately) ──
    if (url.startsWith("/snapshot")) {
      // Wait up to 2 s for the first frame after server start
      let frame = getLatestFrame();
      if (!frame) {
        for (let i = 0; i < 20 && !frame; i++) {
          await new Promise((r) => setTimeout(r, 100));
          frame = getLatestFrame();
        }
      }
      if (!frame) { res.writeHead(503); res.end(); return; }
      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store, max-age=0",
        "Content-Length": String(frame.length),
      });
      res.end(frame);
      return;
    }

    // ── Logical screen dimensions (for coordinate mapping) ──
    if (url === "/screen-info") {
      try {
        const { screen } = await import("@nut-tree-fork/nut-js");
        const [w, h] = await Promise.all([screen.width(), screen.height()]);
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
        res.end(JSON.stringify({ width: w, height: h }));
      } catch {
        res.writeHead(500); res.end("{}");
      }
      return;
    }

    // ── Default: serve the web app ──────────────────────────
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });

  const wss = new WebSocketServer({ server: httpServer });

  // ── Frame push: broadcast each new frame to all streaming clients ──
  const streaming = new Set<WebSocket>();
  onNewFrame((frame) => {
    for (const client of streaming) {
      if (client.readyState === WebSocket.OPEN) client.send(frame);
    }
  });

  wss.on("connection", (ws: WebSocket, req) => {
    const ip = req.socket.remoteAddress ?? "unknown";
    console.log(`[ws] Client connecté : ${ip}`);

    ws.on("message", async (data) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      const obj = parsed as Record<string, unknown>;

      // ── Stream control ──────────────────────────────────────
      if (obj["type"] === "stream.start") {
        streaming.add(ws);
        const f = getLatestFrame();
        if (f && ws.readyState === WebSocket.OPEN) ws.send(f);
        return;
      }
      if (obj["type"] === "stream.stop") {
        streaming.delete(ws);
        return;
      }

      // ── Input events ────────────────────────────────────────
      let event: AgentEvent;
      try {
        event = parseEvent(parsed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Parse error";
        ws.send(JSON.stringify({ error: msg }));
        return;
      }

      try {
        await onEvent(event);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Handler error";
        console.error(`[ws] Erreur handler :`, msg);
        ws.send(JSON.stringify({ error: msg }));
      }
    });

    ws.on("close", () => {
      streaming.delete(ws);
      console.log(`[ws] Client déconnecté : ${ip}`);
    });
  });

  httpServer.listen(port, "0.0.0.0", () => {
    const ip = getLocalIP();
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║       Desktop Agent — prêt            ║`);
    console.log(`╠══════════════════════════════════════╣`);
    console.log(`║  Local   : http://localhost:${port}      ║`);
    console.log(`║  Réseau  : http://${ip}:${port}  ║`);
    console.log(`╚══════════════════════════════════════╝`);
    console.log(`\nOuvre sur ton smartphone :\n  http://${ip}:${port}\n`);
    startCaptureLoop().catch(() => {});
  });
}
