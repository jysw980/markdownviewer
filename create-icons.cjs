// Creates minimal placeholder icons for Tauri dev builds.
// Run: node create-icons.cjs
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const iconsDir = path.join(__dirname, "src-tauri", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

const W = 32, H = 32;

// ---- Build a valid 32x32 RGBA PNG ----

// Raw pixel data: filter byte (0) + W*4 bytes per row
const rawRows = [];
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W * 4);
  row[0] = 0; // filter: None
  for (let x = 0; x < W; x++) {
    const off = 1 + x * 4;
    row[off + 0] = 0x1e; // R
    row[off + 1] = 0x2d; // G
    row[off + 2] = 0x3c; // B
    row[off + 3] = 0xff; // A
  }
  rawRows.push(row);
}
const rawData = Buffer.concat(rawRows);

// Compress with zlib
const compressed = zlib.deflateSync(rawData);

// CRC32 helper
function crc32(buf) {
  return zlib.crc32(buf);
}

function chunk(type, data) {
  const typeData = Buffer.concat([Buffer.from(type), data]);
  const crc = crc32(typeData);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeInt32BE(crc, 0);
  return Buffer.concat([lenBuf, typeData, crcBuf]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);     // width
ihdr.writeUInt32BE(H, 4);     // height
ihdr.writeUInt8(8, 8);        // bit depth
ihdr.writeUInt8(6, 9);        // color type: RGBA
ihdr.writeUInt8(0, 10);       // compression
ihdr.writeUInt8(0, 11);       // filter
ihdr.writeUInt8(0, 12);       // interlace

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // signature
  chunk("IHDR", ihdr),
  chunk("IDAT", compressed),
  chunk("IEND", Buffer.alloc(0)),
]);

// ---- Wrap PNG in ICO ----
const pngSize = png.length;
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);    // reserved
icoHeader.writeUInt16LE(1, 2);    // type: ICO
icoHeader.writeUInt16LE(1, 4);    // count: 1

const icoEntry = Buffer.alloc(16);
icoEntry.writeUInt8(W, 0);        // width (0 = 256 if W==256)
icoEntry.writeUInt8(H, 1);        // height
icoEntry.writeUInt8(0, 2);        // palette
icoEntry.writeUInt8(0, 3);        // reserved
icoEntry.writeUInt16LE(1, 4);     // color planes
icoEntry.writeUInt16LE(32, 6);    // bpp
icoEntry.writeUInt32LE(pngSize, 8); // image size
icoEntry.writeUInt32LE(22, 12);   // offset (6 header + 16 entry)

const ico = Buffer.concat([icoHeader, icoEntry, png]);

fs.writeFileSync(path.join(iconsDir, "icon.ico"), ico);
fs.writeFileSync(path.join(iconsDir, "32x32.png"), png);
fs.writeFileSync(path.join(iconsDir, "128x128.png"), png);
fs.writeFileSync(path.join(iconsDir, "128x128@2x.png"), png);
fs.writeFileSync(path.join(iconsDir, "icon.icns"), png);

console.log("Done. Placeholder icons created in src-tauri/icons/");
console.log("icon.ico: " + ico.length + " bytes (PNG-based)");
console.log("32x32.png: " + png.length + " bytes (valid PNG)");
