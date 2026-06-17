// Generate simple placeholder character PNGs
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { deflateSync } from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CHAR_DIR = resolve(__dirname, '../assets/characters/default')

const expressions = ['normal', 'happy', 'sad', 'sleep', 'think', 'surprise']

// Colors for each expression
const colors = {
  normal: { body: '#6B8EC4', accent: '#8FB5E8' },
  happy: { body: '#8FC48B', accent: '#B5E8A8' },
  sad: { body: '#8B8BC4', accent: '#A8A8E8' },
  sleep: { body: '#A0A0B0', accent: '#C0C0D0' },
  think: { body: '#C4B06B', accent: '#E8D08B' },
  surprise: { body: '#C48BC4', accent: '#E8A8E8' }
}

function generatePNG(width, height, bodyColor, accentColor, expression) {
  // Minimal PNG: 1-pixel signature then we draw with raw pixel data
  // For placeholder, we'll create a simple shape PNG
  const HEADER = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A // PNG signature
  ])

  // IHDR chunk
  const bitDepth = 8
  const colorType = 6 // RGBA
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = bitDepth
  ihdrData[9] = colorType
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace

  const ihdr = createChunk('IHDR', ihdrData)

  // IDAT chunk - raw pixel data
  const rawData = []
  const cx = width / 2
  const cy = height * 0.55 // center slightly above middle
  const rx = width * 0.35 // head radius x
  const ry = height * 0.3 // head radius y

  // Parse hex colors
  const bodyRGB = hexToRGB(bodyColor)
  const accentRGB = hexToRGB(accentColor)

  for (let y = 0; y < height; y++) {
    rawData.push(0) // filter byte (none)
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      const dist = dx * dx + dy * dy

      // Body (head + body ellipse)
      const bodyDX = (x - cx) / (rx * 1.1)
      const bodyDY = (y - cy * 1.15) / (ry * 1.3)
      const bodyDist = bodyDX * bodyDX + bodyDY * bodyDY

      let r = 0, g = 0, b = 0, a = 0

      if (bodyDist < 1) {
        // Body (round character shape)
        const t = bodyDist
        r = Math.round(bodyRGB.r * (1 - t * 0.3) + accentRGB.r * t * 0.3)
        g = Math.round(bodyRGB.g * (1 - t * 0.3) + accentRGB.g * t * 0.3)
        b = Math.round(bodyRGB.b * (1 - t * 0.3) + accentRGB.b * t * 0.3)
        a = 255

        // Eyes
        const eyeY = cy - ry * 0.2
        const eyeSpacing = rx * 0.25
        const eyeRX = rx * 0.08
        const eyeRY = ry * 0.1

        for (const eyeX of [cx - eyeSpacing, cx + eyeSpacing]) {
          const edx = (x - eyeX) / eyeRX
          const edy = (y - eyeY) / eyeRY
          if (edx * edx + edy * edy < 1) {
            if (expression === 'sleep') {
              // Closed eyes: horizontal line
              if (Math.abs(y - eyeY) < 2 && Math.abs(x - eyeX) < eyeRX * 0.8) {
                r = 40; g = 30; b = 40; a = 255
              }
            } else {
              // Open eyes
              r = 40; g = 30; b = 40; a = 255
              // Eye highlight
              if (edx * edx + edy * edy < 0.3) {
                r = 255; g = 255; b = 255; a = 200
              }
            }
          }
        }

        // Mouth
        const mouthY = cy + ry * 0.2
        if (Math.abs(y - mouthY) < 2 && Math.abs(x - cx) < rx * 0.15) {
          if (expression === 'happy' || expression === 'surprise') {
            r = 60; g = 40; b = 50; a = 255
          } else if (expression === 'sad') {
            r = 60; g = 40; b = 50; a = 255
          } else if (expression === 'sleep') {
            // No mouth when sleeping
          } else {
            r = 60; g = 40; b = 50; a = 200
          }
        }

        // Blush on happy
        if (expression === 'happy') {
          for (const blushX of [cx - rx * 0.35, cx + rx * 0.35]) {
            const bdx = (x - blushX) / (rx * 0.12)
            const bdy = (y - (cy + ry * 0.05)) / (ry * 0.08)
            if (bdx * bdx + bdy * bdy < 1) {
              r = Math.round(r * 0.7 + 255 * 0.3)
              g = Math.round(g * 0.7 + 150 * 0.3)
              b = Math.round(b * 0.7 + 150 * 0.3)
            }
          }
        }
      }

      rawData.push(r, g, b, a)
    }
  }

  // Compress with zlib
  const compressed = deflateSync(Buffer.from(rawData))
  const idat = createChunk('IDAT', compressed)

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0))

  const png = Buffer.concat([HEADER, ihdr, idat, iend])
  return png
}

function createChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBuffer, data])
  const crc = crc32(crcData)
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc, 0)
  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

function hexToRGB(hex) {
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  }
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// Generate all expression PNGs
mkdirSync(CHAR_DIR, { recursive: true })

for (const expr of expressions) {
  const color = colors[expr]
  const png = generatePNG(200, 300, color.body, color.accent, expr)
  writeFileSync(resolve(CHAR_DIR, `${expr}.png`), png)
  console.log(`Generated: ${expr}.png (${png.length} bytes)`)
}

// Generate meta.json
const meta = {
  name: '默认角色',
  themeHue: 210,
  themeSaturation: 40,
  hasSeparableEars: false,
  hasSeparableTail: false,
  eyeOffsetX: 0,
  eyeOffsetY: 0,
  originX: 0.5,
  originY: 1.0
}
writeFileSync(resolve(CHAR_DIR, 'meta.json'), JSON.stringify(meta, null, 2))
console.log('Generated: meta.json')
