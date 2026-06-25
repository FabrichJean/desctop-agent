import { spawn, ChildProcess } from "child_process";
import { platform } from "os";

type ChunkCb = (chunk: Buffer) => void;
let proc: ChildProcess | null = null;
let chunkCb: ChunkCb | null = null;
let currentDevice = "0";

export function onAudioChunk(cb: ChunkCb): void {
  chunkCb = cb;
}

// ── List available audio input devices ──────────────────────
const SYSTEM_AUDIO_KEYWORDS = ["blackhole", "loopback", "soundflower", "multi-output", "stereo mix", "what u hear"];

export function listAudioDevices(): Promise<Array<{ index: string; name: string; isSystem: boolean }>> {
  return new Promise((resolve) => {
    const os = platform();
    if (os !== "darwin") { resolve([]); return; }

    const p = spawn("ffmpeg", ["-f", "avfoundation", "-list_devices", "true", "-i", ""]);
    let out = "";
    p.stderr!.on("data", (d: Buffer) => { out += d.toString(); });
    p.on("close", () => {
      const devices: Array<{ index: string; name: string; isSystem: boolean }> = [];
      let inAudio = false;
      for (const line of out.split("\n")) {
        if (line.includes("AVFoundation audio devices")) { inAudio = true; continue; }
        if (inAudio) {
          const m = line.match(/\[(\d+)\]\s+([^\[].+)$/);
          if (m) {
            const name = m[2].trim();
            const isSystem = SYSTEM_AUDIO_KEYWORDS.some(kw => name.toLowerCase().includes(kw));
            devices.push({ index: m[1], name, isSystem });
          }
        }
      }
      resolve(devices);
    });
    setTimeout(() => { p.kill(); resolve([]); }, 4000);
  });
}

// ── Capture ──────────────────────────────────────────────────
export function startAudioCapture(deviceIndex = "0"): void {
  if (proc && currentDevice === deviceIndex) return;
  stopAudioCapture();
  currentDevice = deviceIndex;

  const os = platform();
  let inputArgs: string[];
  if (os === "darwin") {
    inputArgs = ["-f", "avfoundation", "-i", `none:${deviceIndex}`];
  } else if (os === "win32") {
    inputArgs = ["-f", "dshow", "-i", "audio=default"];
  } else {
    inputArgs = ["-f", "pulse", "-i", "default"];
  }

  try {
    proc = spawn("ffmpeg", [
      "-loglevel", "error",
      ...inputArgs,
      "-ar", "44100", "-ac", "1", "-f", "s16le", "-",
    ]);
    proc.stdout!.on("data", (chunk: Buffer) => chunkCb?.(chunk));
    proc.stderr!.on("data", (d: Buffer) => console.error("[audio]", d.toString().trim()));
    proc.on("error", (err) => { console.error("[audio] spawn failed:", err.message); proc = null; });
    proc.on("exit",  (code) => { if (code !== 0 && code !== null) console.error("[audio] exited:", code); proc = null; });
  } catch (err) {
    console.error("[audio] cannot start:", err);
    proc = null;
  }
}

export function stopAudioCapture(): void {
  if (proc) { proc.kill("SIGKILL"); proc = null; }
}
