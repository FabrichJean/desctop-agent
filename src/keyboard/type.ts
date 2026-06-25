import { keyboard, Key } from "@nut-tree-fork/nut-js";

const SPECIAL_KEYS: Record<string, Key> = {
  Backspace: Key.Backspace,
  Enter:     Key.Return,
  Tab:       Key.Tab,
  Escape:    Key.Escape,
};

export async function typeKey(key: string): Promise<void> {
  const special = SPECIAL_KEYS[key];
  if (special !== undefined) {
    await keyboard.pressKey(special);
    await keyboard.releaseKey(special);
  } else {
    await keyboard.type(key);
  }
}
