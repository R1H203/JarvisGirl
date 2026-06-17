#!/usr/bin/env node
// Generate minimal Tauri icons (PNG + ICO)
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const ICONS_DIR = path.resolve(__dirname, '../src-tauri/icons')
fs.mkdirSync(ICONS_DIR, { recursive: true })

function createMinimalPNG(size, r, g, b) {
  // Create a simple colored square PNG
  const width = size, height = size
  const rawData = []

  for (let y = 0; y < height; y++) {
    rawData.push(0) // filter
    for (let x = 0; x < width; x++) {
      const cx = width / 2, cy = height / 2
      const dx = (x - cx) / cx, dy = (y - cy) / cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 0.85) {
        // Circle with gradient
        const t = Math.min(1, dist / 0.85)
        rawData.push(
          Math.min(255, Math.round(r * (1 - t * 0.3))),
          Math.min(255, Math.round(g * (1 - t * 0.3))),
          Math.min(255, Math.round(b * (1 - t * 0.3))),
          255
        )
      } else if (dist < 0.95) {
        // Anti-aliased edge
        rawData.push(
          Math.round(r * 0.7),
          Math.round(g * 0.7),
          Math.round(b * 0.7),
          Math.round(255 * (1 - (dist - 0.85) / 0.1))
        )
      } else {
        rawData.push(0, 0, 0, 0) // transparent
      }
    }
  }

  // PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = createChunk('IHDR', (() => {
    const buf = Buffer.alloc(13)
    buf.writeUInt32BE(width, 0)
    buf.writeUInt32BE(height, 4)
    buf[8] = 8  // bit depth
    buf[9] = 6  // RGBA
    return buf
  })())

  const compressed = zlib.deflateSync(Buffer.from(rawData))
  const idat = createChunk('IDAT', compressed)
  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function createChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeB = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeB, data])
  const crc = crc32(crcData)
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc, 0)
  return Buffer.concat([len, typeB, data, crcB])
}

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0)
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

function createICO(pngData) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)      // reserved
  header.writeUInt16LE(1, 2)      // ICO
  header.writeUInt16LE(1, 4)      // 1 image

  const entry = Buffer.alloc(16)
  entry.writeUInt8(0, 0)          // width (0=256)
  entry.writeUInt8(0, 1)          // height
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)       // planes
  entry.writeUInt16LE(32, 6)      // bpp
  entry.writeUInt32LE(pngData.length, 8)  // size
  entry.writeUInt32LE(22, 12)     // offset
  return Buffer.concat([header, entry, pngData])
}

// Generate icons (theme color: pinkish 210° hue -> 100,130,180)
const colors = [
  { size: 32, r: 107, g: 142, b: 196 },
  { size: 128, r: 107, g: 142, b: 196 },
  { size: 256, r: 107, g: 142, b: 196 },
]

for (const { size, r, g, b } of colors) {
  const png = createMinimalPNG(size, r, g, b)
  const name = size <= 32 ? `32x32` : size <= 128 ? `128x128` : `128x128@2x`
  fs.writeFileSync(path.join(ICONS_DIR, `${name}.png`), png)
  console.log(`Generated: ${name}.png`)
}

// Generate icon.ico (using 256x256 PNG)
const bigPng = createMinimalPNG(256, colors[2].r, colors[2].g, colors[2].b)
fs.writeFileSync(path.join(ICONS_DIR, 'icon.ico'), createICO(bigPng))
console.log('Generated: icon.ico')

console.log('All icons created!')
