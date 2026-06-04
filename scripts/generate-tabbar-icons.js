const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 创建 PNG 文件
function createPNG(color, size = 48) {
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // IDAT chunk (image data)
  const rawData = Buffer.alloc(width * height * 3 + height);
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 3 + 1)] = 0; // filter type (none)
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  const table = [];
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  
  for (let i = 0; i < buffer.length; i++) {
    crc = table[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  
  return Buffer.from([(crc >>> 24) & 0xff, (crc >>> 16) & 0xff, (crc >>> 8) & 0xff, crc & 0xff]);
}

// 颜色配置
const colors = {
  home: { inactive: '#B8E6D5', active: '#4ECDC4' },
  checkin: { inactive: '#FFB5B5', active: '#FF6B6B' },
  profile: { inactive: '#FFD4C8', active: '#FFB6A8' }
};

// 生成图标文件
const icons = [
  { name: 'home', color: colors.home.inactive },
  { name: 'home-active', color: colors.home.active },
  { name: 'checkin', color: colors.checkin.inactive },
  { name: 'checkin-active', color: colors.checkin.active },
  { name: 'profile', color: colors.profile.inactive },
  { name: 'profile-active', color: colors.profile.active }
];

const imagesDir = path.join(__dirname, '..', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

icons.forEach(icon => {
  const png = createPNG(icon.color);
  const filePath = path.join(imagesDir, `${icon.name}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`✅ Generated: ${icon.name}.png (${icon.color})`);
});

console.log('\n🎉 All tabbar icons generated successfully!');
