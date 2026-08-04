const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const MBTI = require('../data/mbti.js');

const OUT_DIR = path.join(__dirname, '..', 'images', 'stars');
const SIZE = 400;

// 5x7 bitmap font for A-Z, 0-9 and a few symbols
const FONT5X7 = {
  'A': [0x7E,0x09,0x09,0x09,0x7E],
  'B': [0x7F,0x49,0x49,0x49,0x36],
  'C': [0x3E,0x41,0x41,0x41,0x22],
  'D': [0x7F,0x41,0x41,0x22,0x1C],
  'E': [0x7F,0x49,0x49,0x49,0x41],
  'F': [0x7F,0x09,0x09,0x09,0x01],
  'G': [0x3E,0x41,0x49,0x49,0x7A],
  'H': [0x7F,0x08,0x08,0x08,0x7F],
  'I': [0x00,0x41,0x7F,0x41,0x00],
  'J': [0x20,0x40,0x41,0x3F,0x01],
  'K': [0x7F,0x08,0x14,0x22,0x41],
  'L': [0x7F,0x40,0x40,0x40,0x40],
  'M': [0x7F,0x02,0x0C,0x02,0x7F],
  'N': [0x7F,0x04,0x08,0x10,0x7F],
  'O': [0x3E,0x41,0x41,0x41,0x3E],
  'P': [0x7F,0x09,0x09,0x09,0x06],
  'Q': [0x3E,0x41,0x51,0x21,0x5E],
  'R': [0x7F,0x09,0x19,0x29,0x46],
  'S': [0x46,0x49,0x49,0x49,0x31],
  'T': [0x01,0x01,0x7F,0x01,0x01],
  'U': [0x3F,0x40,0x40,0x40,0x3F],
  'V': [0x1F,0x20,0x40,0x20,0x1F],
  'W': [0x3F,0x40,0x38,0x40,0x3F],
  'X': [0x63,0x14,0x08,0x14,0x63],
  'Y': [0x07,0x08,0x70,0x08,0x07],
  'Z': [0x61,0x51,0x49,0x45,0x43],
  '0': [0x3E,0x51,0x49,0x45,0x3E],
  '1': [0x00,0x42,0x7F,0x40,0x00],
  '2': [0x42,0x61,0x51,0x49,0x46],
  '3': [0x21,0x41,0x45,0x4B,0x31],
  '4': [0x18,0x14,0x12,0x7F,0x10],
  '5': [0x27,0x45,0x45,0x45,0x39],
  '6': [0x3C,0x4A,0x49,0x49,0x30],
  '7': [0x01,0x71,0x09,0x05,0x03],
  '8': [0x36,0x49,0x49,0x49,0x36],
  '9': [0x06,0x49,0x49,0x29,0x1E],
  '?': [0x06,0x01,0x51,0x09,0x06],
  ' ': [0x00,0x00,0x00,0x00,0x00],
};

function parseHexColor(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
}

function fillRect(buf, width, x, y, w, h, [r, g, b]) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const idx = (yy * width + xx) * 4;
      buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b; buf[idx + 3] = 255;
    }
  }
}

function drawChar(buf, width, ch, cx, cy, scale, color) {
  const rows = FONT5X7[ch] || FONT5X7['?'];
  for (let col = 0; col < 5; col++) {
    const colByte = rows[col];
    for (let row = 0; row < 7; row++) {
      if ((colByte >> row) & 1) {
        fillRect(buf, width, cx + col * scale, cy + row * scale, scale, scale, color);
      }
    }
  }
}

function drawText(buf, width, text, cy, scale, color) {
  const totalW = text.length * 5 * scale + (text.length - 1) * scale;
  let cx = (width - totalW) / 2;
  for (const ch of text) {
    drawChar(buf, width, ch, Math.round(cx), cy, scale, color);
    cx += 6 * scale;
  }
}

function generate(type, gender, index) {
  // Color palette by MBTI family + gender tint
  const families = {
    'NT': ['#2a4d8a', '#4a6fa5'], // analysts - blue
    'NF': ['#6b2d6b', '#8f4f8f'], // diplomats - purple
    'SJ': ['#2d6b4a', '#4f8f6a'], // sentinels - green
    'SP': ['#8f6a2f', '#b58d4a'], // explorers - gold
  };
  const family = type.slice(1, 3);
  const [maleBase, femaleBase] = families[family] || families['NT'];
  const baseHex = gender === 'male' ? maleBase : femaleBase;
  const [br, bg, bb] = parseHexColor(baseHex);

  const buf = Buffer.alloc(SIZE * SIZE * 4);
  // Gradient-ish background
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const t = (x + y) / (2 * SIZE);
      const r = Math.min(255, Math.round(br + t * 40));
      const g = Math.min(255, Math.round(bg + t * 40));
      const b = Math.min(255, Math.round(bb + t * 40));
      const idx = (y * SIZE + x) * 4;
      buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b; buf[idx + 3] = 255;
    }
  }

  // Border
  fillRect(buf, SIZE, 0, 0, SIZE, 8, [255, 255, 255]);
  fillRect(buf, SIZE, 0, SIZE - 8, SIZE, 8, [255, 255, 255]);
  fillRect(buf, SIZE, 0, 0, 8, SIZE, [255, 255, 255]);
  fillRect(buf, SIZE, SIZE - 8, 0, 8, SIZE, [255, 255, 255]);

  // Type code
  drawText(buf, SIZE, type, 140, 7, [255, 255, 255]);
  // Gender symbol
  const symbol = gender === 'male' ? 'M' : 'F';
  drawText(buf, SIZE, symbol, 230, 5, [255, 255, 255]);

  const raw = { data: buf, width: SIZE, height: SIZE };
  const encoded = jpeg.encode(raw, 90);
  const filename = path.join(OUT_DIR, `${type.toLowerCase()}-${gender}.jpg`);
  fs.writeFileSync(filename, encoded.data);
  console.log('Generated', filename);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const types = Object.keys(MBTI);
let count = 0;
for (const type of types) {
  for (const gender of ['male', 'female']) {
    generate(type, gender, count++);
  }
}
console.log(`Done: ${count} placeholder images.`);
