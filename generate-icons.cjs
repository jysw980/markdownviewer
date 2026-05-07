const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const iconsDir = path.join(__dirname, "src-tauri", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

function createPNG(width, height, r, g, b) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const off = y * (width * 3 + 1) + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }
  const compressed = zlib.deflateSync(raw);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type, "ascii");
    const crcData = Buffer.concat([typeB, data]);
    let crc = 0xffffffff;
    for (let i = 0; i < crcData.length; i++) {
      crc ^= crcData[i];
      for (let j = 0; j < 8; j++)
        crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc);
    return Buffer.concat([len, typeB, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  // 10-12 stay 0 (compression, filter, interlace)

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG sig
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Dark gray icon matching app theme
const png32 = createPNG(32, 32, 0x1e, 0x1e, 0x1e);
fs.writeFileSync(path.join(iconsDir, "32x32.png"), png32);

const png128 = createPNG(128, 128, 0x1e, 0x1e, 0x1e);
fs.writeFileSync(path.join(iconsDir, "128x128.png"), png128);

const png256 = createPNG(256, 256, 0x1e, 0x1e, 0x1e);
fs.writeFileSync(path.join(iconsDir, "128x128@2x.png"), png256);

// ICO wrapping the 32x32 PNG
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: ICO
header.writeUInt16LE(1, 4); // 1 image

const entry = Buffer.alloc(16);
entry.writeUInt8(32, 0);
entry.writeUInt8(32, 1);
entry.writeUInt8(0, 2);
entry.writeUInt8(0, 3);
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(png32.length, 8);
entry.writeUInt32LE(22, 12); // offset = 6 + 16

fs.writeFileSync(
  path.join(iconsDir, "icon.ico"),
  Buffer.concat([header, entry, png32])
);

// ICNS (minimal placeholder to avoid macOS build errors)
fs.writeFileSync(path.join(iconsDir, "icon.icns"), png128);

console.log("Icons generated in " + iconsDir);
