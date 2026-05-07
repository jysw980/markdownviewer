// Generates minimal valid PNG icon files for Tauri.
// Run: node scripts/generate-icons.js

const { writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");
const zlib = require("zlib");

function createPNG(width, height) {
  // Minimal valid PNG: 8-bit RGB
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(
      zlib.crc32(Buffer.concat([type, data])) >>> 0,
      0,
    );
    return Buffer.concat([len, type, data, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); // width
  ihdr.writeUInt32BE(height, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT: row data (filter byte + RGB pixels)
  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0; // filter: none
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = 0x33; // R
    row[2 + x * 3] = 0x6b; // G
    row[3 + x * 3] = 0xb8; // B — blue-ish gray
  }

  const raw = Buffer.alloc(height * row.length);
  for (let y = 0; y < height; y++) {
    row.copy(raw, y * row.length);
  }

  return Buffer.concat([
    header,
    chunk(Buffer.from("IHDR"), ihdr),
    chunk(Buffer.from("IDAT"), zlib.deflateSync(raw)),
    chunk(Buffer.from("IEND"), Buffer.alloc(0)),
  ]);
}

const iconsDir = join(__dirname, "..", "src-tauri", "icons");
mkdirSync(iconsDir, { recursive: true });

writeFileSync(join(iconsDir, "32x32.png"), createPNG(32, 32));
writeFileSync(join(iconsDir, "128x128.png"), createPNG(128, 128));
writeFileSync(join(iconsDir, "128x128@2x.png"), createPNG(256, 256));

// For ICO, use a minimal valid ICO wrapping a 32x32 BMP
function createICO() {
  // 32x32 24-bit BMP data
  const bmpWidth = 32;
  const bmpHeight = 64; // double height for ICO (contains AND mask)
  const pixelDataSize = 32 * 32 * 3; // 24-bit = 3 bytes per pixel
  const rowSize = Math.ceil((32 * 24) / 32) * 4; // BMP row stride (4-byte aligned)
  const pixelDataStride = 32 * 3;
  const fileSize = 40 + pixelDataStride * 32 + 32 * 4; // header + pixels + AND mask

  // BITMAPINFOHEADER
  const bmpHeader = Buffer.alloc(40);
  bmpHeader.writeUInt32LE(40, 0); // header size
  bmpHeader.writeInt32LE(32, 4); // width
  bmpHeader.writeInt32LE(64, 8); // height (double for ICO)
  bmpHeader.writeUInt16LE(1, 12); // planes
  bmpHeader.writeUInt16LE(24, 14); // bpp
  bmpHeader.writeUInt32LE(0, 16); // compression

  // Pixel data (bottom-up)
  const pixels = Buffer.alloc(pixelDataStride * 32);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const offset = y * pixelDataStride + x * 3;
      pixels[offset] = 0x33; // B
      pixels[offset + 1] = 0x6b; // G
      pixels[offset + 2] = 0xb8; // R
    }
  }

  // AND mask
  const andMask = Buffer.alloc(32 * 4); // all zeros = fully opaque

  const imageData = Buffer.concat([bmpHeader, pixels, andMask]);
  const imageSize = imageData.length;
  const fileOffset = 6 + 16; // ICO header + 1 directory entry

  // ICO header
  const ico = Buffer.alloc(fileOffset + imageSize);
  ico.writeUInt16LE(0, 0); // reserved
  ico.writeUInt16LE(1, 2); // type: ICO
  ico.writeUInt16LE(1, 4); // count: 1

  // Directory entry
  ico[6] = 32; // width
  ico[7] = 32; // height
  ico[8] = 0; // palette
  ico[9] = 0; // reserved
  ico.writeUInt16LE(1, 10); // planes
  ico.writeUInt16LE(24, 12); // bpp
  ico.writeUInt32LE(imageSize, 14); // size
  ico.writeUInt32LE(fileOffset, 18); // offset

  imageData.copy(ico, fileOffset);
  return ico;
}

writeFileSync(join(iconsDir, "icon.ico"), createICO());
writeFileSync(join(iconsDir, "icon.icns"), createPNG(128, 128)); // Placeholder

console.log("Icons generated in src-tauri/icons/");
