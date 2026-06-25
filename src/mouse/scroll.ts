import { mouse } from "@nut-tree-fork/nut-js";

export async function scroll(delta: number): Promise<void> {
  if (delta > 0) await mouse.scrollDown(Math.abs(delta));
  else if (delta < 0) await mouse.scrollUp(Math.abs(delta));
}
