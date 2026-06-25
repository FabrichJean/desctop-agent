import { mouse, Point } from "@nut-tree-fork/nut-js";

export async function setMousePosition(x: number, y: number): Promise<void> {
  await mouse.setPosition(new Point(x, y));
}
