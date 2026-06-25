import { createServer } from "./websocket/server";
import { moveMouse } from "./mouse/move";
import { clickButton } from "./mouse/click";
import { scroll } from "./mouse/scroll";
import { setMousePosition } from "./mouse/position";
import { typeKey } from "./keyboard/type";
import { AgentEvent } from "./types/events";

const PORT = Number(process.env.PORT ?? 3000);

async function handleEvent(event: AgentEvent): Promise<void> {
  switch (event.type) {
    case "mouse.move":
      await moveMouse(event.dx, event.dy);
      break;

    case "mouse.click":
      console.log(`[dispatch] mouse.click button=${event.button}`);
      await clickButton(event.button);
      break;

    case "mouse.scroll":
      await scroll(event.delta);
      break;

    case "keyboard.type":
      console.log(`[dispatch] keyboard.type key=${JSON.stringify(event.key)}`);
      await typeKey(event.key);
      break;

    case "mouse.position":
      await setMousePosition(event.x, event.y);
      break;
  }
}

createServer(PORT, handleEvent);
