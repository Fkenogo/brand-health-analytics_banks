import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve('public');
const pngSpecs = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
];

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mix = (a, b, t) => a + (b - a) * t;

const roundedRectAlpha = (x, y, size, radius) => {
  const left = radius;
  const right = size - radius;
  const top = radius;
  const bottom = size - radius;

  const dx = x < left ? left - x : x > right ? x - right : 0;
  const dy = y < top ? top - y : y > bottom ? y - bottom : 0;
  const distance = Math.hypot(dx, dy);
  if (distance <= radius - 1) return 1;
  return clamp(radius - distance);
};

const pointLineDistance = (px, py, ax, ay, bx, by) => {
  const abx = bx - ax;
  const aby = by - ay;
  const abLengthSq = (abx * abx) + (aby * aby) || 1;
  const t = clamp((((px - ax) * abx) + ((py - ay) * aby)) / abLengthSq);
  const cx = ax + (abx * t);
  const cy = ay + (aby * t);
  return Math.hypot(px - cx, py - cy);
};

const createIconBuffer = (size) => {
  const data = Buffer.alloc(size * size * 4);
  const centerX = size * 0.43;
  const centerY = size * 0.42;
  const radius = size * 0.22;
  const stroke = Math.max(2, size * 0.1);
  const handleStroke = Math.max(2, size * 0.09);
  const handleStartX = size * 0.59;
  const handleStartY = size * 0.58;
  const handleEndX = size * 0.8;
  const handleEndY = size * 0.79;
  const boxRadius = size * 0.22;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const alpha = roundedRectAlpha(px, py, size, boxRadius);
      if (alpha <= 0) continue;

      const gradientT = clamp((px + py) / (size * 2));
      let r = mix(15, 30, gradientT);
      let g = mix(23, 64, gradientT);
      let b = mix(42, 175, gradientT);
      let a = 255 * alpha;

      const ringDistance = Math.abs(Math.hypot(px - centerX, py - centerY) - radius);
      const ringAlpha = clamp((stroke * 0.5 + 1 - ringDistance));
      if (ringAlpha > 0) {
        const lensT = clamp(((px - (centerX - radius)) + (py - (centerY - radius))) / (radius * 4));
        r = mix(r, mix(103, 56, lensT), ringAlpha);
        g = mix(g, mix(232, 189, lensT), ringAlpha);
        b = mix(b, mix(249, 248, lensT), ringAlpha);
      }

      const handleDistance = pointLineDistance(px, py, handleStartX, handleStartY, handleEndX, handleEndY);
      const handleAlpha = clamp((handleStroke * 0.5 + 1 - handleDistance));
      if (handleAlpha > 0) {
        r = mix(r, 241, handleAlpha);
        g = mix(g, 245, handleAlpha);
        b = mix(b, 249, handleAlpha);
      }

      const highlightDistance = Math.abs(Math.hypot(px - (centerX + radius * 0.08), py - (centerY - radius * 0.08)) - radius * 0.68);
      const highlightAlpha = px < centerX + radius * 0.2 && py < centerY ? clamp((size * 0.018 + 1 - highlightDistance)) * 0.75 : 0;
      if (highlightAlpha > 0) {
        r = mix(r, 255, highlightAlpha);
        g = mix(g, 255, highlightAlpha);
        b = mix(b, 255, highlightAlpha);
      }

      const offset = (y * size + x) * 4;
      data[offset] = Math.round(r);
      data[offset + 1] = Math.round(g);
      data[offset + 2] = Math.round(b);
      data[offset + 3] = Math.round(a);
    }
  }

  return data;
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
};

const encodePng = (size, rgba) => {
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + (size * 4));
    row[0] = 0;
    rgba.copy(row, 1, y * size * 4, (y + 1) * size * 4);
    rows.push(row);
  }

  const header = Buffer.from('89504e470d0a1a0a', 'hex');
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    header,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

await fs.mkdir(publicDir, { recursive: true });

for (const spec of pngSpecs) {
  const png = encodePng(spec.size, createIconBuffer(spec.size));
  await fs.writeFile(path.join(publicDir, spec.file), png);
}

const png32 = await fs.readFile(path.join(publicDir, 'favicon-32x32.png'));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);

const directory = Buffer.alloc(16);
directory.writeUInt8(32, 0);
directory.writeUInt8(32, 1);
directory.writeUInt8(0, 2);
directory.writeUInt8(0, 3);
directory.writeUInt16LE(1, 4);
directory.writeUInt16LE(32, 6);
directory.writeUInt32LE(png32.length, 8);
directory.writeUInt32LE(22, 12);

await fs.writeFile(path.join(publicDir, 'favicon.ico'), Buffer.concat([header, directory, png32]));
