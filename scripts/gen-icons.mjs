// Generate the placeholder app icons the Tauri bundle needs (no binary art in
// the repo). Ink tile, paper ring, stamp dot — the COMO mark in rough form.
// Replace with real brand art later via `npm run tauri icon <1024px-png>`.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "src-tauri/icons");

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

const INK = [0x14, 0x14, 0x14];
const PAPER = [0xf3, 0xec, 0xdf];
const STAMP = [0x9c, 0x3b, 0x1e];

function pixel(x, y) {
  // rounded-square mask so the icon has transparent corners
  const r = 0.22;
  const dx = Math.max(Math.abs(x - 0.5) - (0.5 - r), 0);
  const dy = Math.max(Math.abs(y - 0.5) - (0.5 - r), 0);
  if (Math.hypot(dx, dy) > r) return [0, 0, 0, 0];

  const cx = x - 0.48;
  const cy = y - 0.48;
  const distance = Math.hypot(cx, cy);
  const angle = Math.atan2(cy, cx); // 0 = right; cut the mouth of the C
  const inMouth = angle > -0.9 && angle < 0.9;
  if (distance > 0.21 && distance < 0.33 && !inMouth) return [...PAPER, 255];

  const dot = Math.hypot(x - 0.74, y - 0.74);
  if (dot < 0.09) return [...STAMP, 255];

  return [...INK, 255];
}

function png(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (1 + size * 4);
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixel((x + 0.5) / size, (y + 0.5) / size);
      const at = rowStart + 1 + x * 4;
      raw[at] = r;
      raw[at + 1] = g;
      raw[at + 2] = b;
      raw[at + 3] = a;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const [name, size] of [
  ["32x32.png", 32],
  ["128x128.png", 128],
  ["128x128@2x.png", 256],
  ["icon.png", 512],
]) {
  writeFileSync(join(OUT, name), png(size));
  console.log(`[icons] ${name}`);
}