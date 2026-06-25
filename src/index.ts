import { createServer } from "./websocket/server";
import { moveMouse } from "./mouse/move";
import { clickButton } from "./mouse/click";
import { scroll } from "./mouse/scroll";
import { AgentEvent } from "./types/events";

const PORT = Number(process.env.PORT ?? 3000);

async function handleEvent(event: AgentEvent): Promise<void> {
  switch (event.type) {
    case "mouse.move":
      console.log(`[dispatch] mouse.move dx=${event.dx} dy=${event.dy}`);
      await moveMouse(event.dx, event.dy);
      break;

    case "mouse.click":
      console.log(`[dispatch] mouse.click button=${event.button}`);
      await clickButton(event.button);
      break;

    case "mouse.scroll":
      console.log(`[dispatch] mouse.scroll delta=${event.delta}`);
      await scroll(event.delta);
      break;
  }
}

createServer(PORT, handleEvent);
