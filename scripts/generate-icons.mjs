import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer with filter byte per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelStart = rowStart + 1 + x * 4;
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
      rawData[pixelStart + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    // CRC32 of type + data
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  // Simple CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) | 0;
  }

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Drawing function for Tenant Ledger Icon
// Stylized notebook/ledger card with gold rupee symbol and ledger rows on ink background
function drawLedgerIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background rounded rect
  const pad = 0.08;
  const radius = 0.22;
  
  // Outer canvas color (transparent or deep ink)
  let r = 27, g = 30, b = 35, a = 255; // #1b1e23

  // Inside card: warm paper #fbf9f4
  const cx1 = 0.16, cx2 = 0.84;
  const cy1 = 0.14, cy2 = 0.86;
  const cardRad = 0.08;

  const inCard = nx >= cx1 && nx <= cx2 && ny >= cy1 && ny <= cy2;
  
  if (inCard) {
    // Card base
    r = 251; g = 249; b = 244; // #fbf9f4

    // Header band at top of ledger card: Brass Gold #b45309
    if (ny >= cy1 && ny <= cy1 + 0.16) {
      r = 180; g = 83; b = 9; // #b45309
      // Inner subtle sheen
      if (ny < cy1 + 0.04) {
        r = 217; g = 119; b = 6;
      }
    }

    // Ledger vertical dividing line (red/rule): x ~ 0.38
    if (Math.abs(nx - 0.38) < 0.01 && ny > cy1 + 0.16 && ny < cy2 - 0.04) {
      r = 220; g = 180; b = 180;
    }

    // Ledger horizontal faint lines
    const lineY = [0.42, 0.52, 0.62, 0.72];
    for (const ly of lineY) {
      if (Math.abs(ny - ly) < 0.008 && nx > cx1 + 0.04 && nx < cx2 - 0.04) {
        r = 225; g = 220; b = 210;
      }
    }

    // Stylized Rupee symbol or bars in header
    // Draw centered gold emblem / symbol in header or top
    // Mini checkmark / ledger pill in bottom right: Teal #0d9488
    if (nx >= 0.55 && nx <= 0.78 && ny >= 0.68 && ny <= 0.76) {
      r = 13; g = 148; b = 136; // Teal badge
    }
    // Bar in middle
    if (nx >= 0.44 && nx <= 0.72 && ny >= 0.48 && ny <= 0.54) {
      r = 74; g = 85; b = 104; // Slate entry
    }
    if (nx >= 0.44 && nx <= 0.65 && ny >= 0.58 && ny <= 0.64) {
      r = 217; g = 119; b = 6; // Brass entry
    }
  }

  // Border of card
  const distLeft = Math.abs(nx - cx1);
  const distRight = Math.abs(nx - cx2);
  const distTop = Math.abs(ny - cy1);
  const distBottom = Math.abs(ny - cy2);

  if (inCard && (distLeft < 0.015 || distRight < 0.015 || distTop < 0.015 || distBottom < 0.015)) {
    r = 210; g = 195; b = 180;
  }

  // Corner rounding for app icon
  const cx = 0.5, cy = 0.5;
  const dx = Math.max(0, Math.abs(nx - cx) - (0.5 - radius));
  const dy = Math.max(0, Math.abs(ny - cy) - (0.5 - radius));
  if (dx * dx + dy * dy > radius * radius) {
    a = 0; // Transparent corners if needed
  }

  return [r, g, b, a];
}

const p192 = createPNG(192, 192, drawLedgerIcon);
fs.writeFileSync('./public/icon-192.png', p192);

const p512 = createPNG(512, 512, drawLedgerIcon);
fs.writeFileSync('./public/icon-512.png', p512);

// Also apple-touch-icon
fs.writeFileSync('./public/apple-touch-icon.png', p192);

console.log('PNG icons created successfully!');
