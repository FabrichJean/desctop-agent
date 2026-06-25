import { mouse, Point } from "@nut-tree-fork/nut-js";

export async function moveMouse(dx: number, dy: number): Promise<void> {
  const current = await mouse.getPosition();
  const target = new Point(current.x + dx, current.y + dy);
  await mouse.setPosition(target);
}

export async function moveMouseAbsolute(x: number, y: number): Promise<void> {
  await mouse.setPosition(new Point(x, y));
}
