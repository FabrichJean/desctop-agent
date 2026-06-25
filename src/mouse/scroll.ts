import { mouse } from "@nut-tree-fork/nut-js";

export async function scroll(delta: number): Promise<void> {
  // positive delta = scroll down, negative = scroll up
  await mouse.scrollDown(Math.abs(delta));
}
