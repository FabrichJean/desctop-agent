export interface MouseMoveEvent {
  type: "mouse.move";
  dx: number;
  dy: number;
}

export interface MouseClickEvent {
  type: "mouse.click";
  button: "left" | "right";
}

export interface MouseScrollEvent {
  type: "mouse.scroll";
  delta: number;
}

export interface KeyboardTypeEvent {
  type: "keyboard.type";
  key: string; // single char ("a", "A", " ") or special name ("Backspace")
}

export interface MousePositionEvent {
  type: "mouse.position";
  x: number; // absolute screen x in logical pixels
  y: number; // absolute screen y in logical pixels
}

export type AgentEvent =
  | MouseMoveEvent
  | MouseClickEvent
  | MouseScrollEvent
  | KeyboardTypeEvent
  | MousePositionEvent;

export function parseEvent(raw: unknown): AgentEvent {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Event must be a JSON object");
  }

  const obj = raw as Record<string, unknown>;

  switch (obj["type"]) {
    case "mouse.move": {
      const dx = Number(obj["dx"]);
      const dy = Number(obj["dy"]);
      if (isNaN(dx) || isNaN(dy)) throw new Error("mouse.move requires numeric dx and dy");
      return { type: "mouse.move", dx, dy };
    }
    case "mouse.click": {
      const button = obj["button"];
      if (button !== "left" && button !== "right") throw new Error("mouse.click button must be 'left' or 'right'");
      return { type: "mouse.click", button };
    }
    case "mouse.scroll": {
      const delta = Number(obj["delta"]);
      if (isNaN(delta)) throw new Error("mouse.scroll requires numeric delta");
      return { type: "mouse.scroll", delta };
    }
    case "keyboard.type": {
      const key = obj["key"];
      if (typeof key !== "string" || key.length === 0) throw new Error("keyboard.type requires a non-empty string key");
      return { type: "keyboard.type", key };
    }
    case "mouse.position": {
      const x = Number(obj["x"]);
      const y = Number(obj["y"]);
      if (isNaN(x) || isNaN(y)) throw new Error("mouse.position requires numeric x and y");
      return { type: "mouse.position", x, y };
    }
    default:
      throw new Error(`Unknown event type: ${String(obj["type"])}`);
  }
}
