import { WebSocketServer, WebSocket } from "ws";
import { parseEvent, AgentEvent } from "../types/events";

export type EventHandler = (event: AgentEvent) => Promise<void>;

export function createServer(port: number, onEvent: EventHandler): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on("listening", () => {
    console.log(`[ws] Server listening on ws://localhost:${port}`);
  });

  wss.on("connection", (ws: WebSocket, req) => {
    const ip = req.socket.remoteAddress ?? "unknown";
    console.log(`[ws] Client connected: ${ip}`);

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
        console.error(`[ws] Handler error:`, msg);
        ws.send(JSON.stringify({ error: msg }));
      }
    });

    ws.on("close", () => {
      console.log(`[ws] Client disconnected: ${ip}`);
    });
  });

  return wss;
}
