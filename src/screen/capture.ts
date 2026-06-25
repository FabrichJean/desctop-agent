import { execFile } from "child_process";
import { readFile } from "fs/promises";
import { platform, tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

const execFileP = promisify(execFile);
const FRAME = join(tmpdir(), `dsk_${process.pid}.jpg`);
let capturing = false;

// ── Single capture ───────────────────────────────────────────
async function captureJpeg(): Promise<Buffer | null> {
  if (capturing) return null;
  capturing = true;
  try {
    const os = platform();
    if (os === "darwin") {
      await execFileP("screencapture", ["-x", "-C", "-t", "jpg", FRAME]);
    } else if (os === "win32") {
      const ps =
        "Add-Type -AssemblyName System.Windows.Forms,System.Drawing;" +
        "$s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds;" +
        "$b=New-Object System.Drawing.Bitmap($s.Width,$s.Height);" +
        "$g=[System.Drawing.Graphics]::FromImage($b);" +
        "$g.CopyFromScreen(0,0,0,0,$s.Size);" +
        `$b.Save('${FRAME.replace(/\\/g, "\\\\")}');`;
      await execFileP("powershell", ["-NoProfile", "-Command", ps]);
    } else {
      try { await execFileP("scrot", ["-o", FRAME]); }
      catch { await execFileP("import", ["-window", "root", FRAME]); }
    }
    return await readFile(FRAME);
  } catch {
    return null;
  } finally {
    capturing = false;
  }
}

// ── Background loop ──────────────────────────────────────────
let latestFrame: Buffer | null = null;
type FrameCallback = (frame: Buffer) => void;
let frameCallback: FrameCallback | null = null;

export function getLatestFrame(): Buffer | null {
  return latestFrame;
}

export function onNewFrame(cb: FrameCallback): void {
  frameCallback = cb;
}

export async function startCaptureLoop(): Promise<void> {
  for (;;) {
    const frame = await captureJpeg();
    if (frame) {
      latestFrame = frame;
      frameCallback?.(frame);
    }
  }
}
