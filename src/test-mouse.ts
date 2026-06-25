import { mouse, Point } from "@nut-tree-fork/nut-js";
import { moveMouse, moveMouseAbsolute } from "./mouse/move";
import { leftClick, rightClick } from "./mouse/click";
import { scroll } from "./mouse/scroll";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(): Promise<void> {
  console.log("=== test-mouse ===");
  console.log("Starting in 2 seconds… move your cursor away from critical areas.");
  await sleep(2000);

  const start = await mouse.getPosition();
  console.log(`Current position: (${start.x}, ${start.y})`);

  console.log("Moving +100, +100...");
  await moveMouse(100, 100);
  await sleep(500);

  console.log("Moving -100, -100 (back)...");
  await moveMouse(-100, -100);
  await sleep(500);

  console.log("Moving to absolute (200, 200)...");
  await moveMouseAbsolute(200, 200);
  await sleep(500);

  console.log("Left click...");
  await leftClick();
  await sleep(500);

  console.log("Scroll down 3...");
  await scroll(3);
  await sleep(500);

  const end = await mouse.getPosition();
  console.log(`Final position: (${end.x}, ${end.y})`);
  console.log("=== Done! ===");
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
