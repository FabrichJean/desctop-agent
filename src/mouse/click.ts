import { mouse, Button } from "@nut-tree-fork/nut-js";

export async function leftClick(): Promise<void> {
  await mouse.click(Button.LEFT);
}

export async function rightClick(): Promise<void> {
  await mouse.click(Button.RIGHT);
}

export async function clickButton(button: "left" | "right"): Promise<void> {
  await mouse.click(button === "left" ? Button.LEFT : Button.RIGHT);
}
