import { createServer as createHttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { readFileSync } from "fs";
import { join } from "path";
import { networkInterfaces } from "os";
import { parseEvent, AgentEvent } from "../types/events";

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

  const httpServer = createHttpServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });

  const wss = new WebSocketServer({ server: httpServer });

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
        ws.send(JSON.stringify({ ok: true, type: event.type }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Handler error";
        console.error(`[ws] Erreur handler :`, msg);
        ws.send(JSON.stringify({ error: msg }));
      }
    });

    ws.on("close", () => {
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
  });
}
