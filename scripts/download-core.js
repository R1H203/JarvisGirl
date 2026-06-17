#!/usr/bin/env node
/**
 * Download Cubism core files (Live2D SDK) for pixi-live2d-display.
 *
 * Downloads:
 *   - Cubism 2.1 Core: live2d.min.js
 *   - Cubism 4 Core:   live2dcubismcore.js
 *
 * These are placed in desktop/public/core/ and served as static assets.
 */
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CORE_DIR = resolve(__dirname, '../public/core')
const OVERWRITE = true

const ASSETS = [
  {
    url: 'https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js',
    filename: 'live2d.min.js'
  }
]

const CUBISM4_ZIP_URL =
  'https://cubism.live2d.com/sdk-web/bin/CubismSdkForWeb-4-r.7.zip'
const CUBISM4_CORE_FILE = 'live2dcubismcore.js'

async function downloadFile(url, destPath) {
  if (!OVERWRITE && existsSync(destPath)) {
    console.log(`  SKIP ${destPath} (exists)`)
    return true
  }

  console.log(`  DOWNLOAD ${url}`)
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`  FAILED (${response.status}) ${url}`)
      return false
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    mkdirSync(dirname(destPath), { recursive: true })
    createWriteStream(destPath).write(buffer)
    console.log(`  OK ${destPath} (${buffer.length} bytes)`)
    return true
  } catch (e) {
    console.warn(`  ERROR: ${e.message}`)
    return false
  }
}

async function downloadZipAndExtract(zipUrl, entryFile, outputPath) {
  if (!OVERWRITE && existsSync(outputPath)) {
    console.log(`  SKIP ${outputPath} (exists)`)
    return true
  }

  console.log(`  DOWNLOAD ZIP ${zipUrl}`)
  try {
    const response = await fetch(zipUrl)
    if (!response.ok) {
      console.warn(`  FAILED (${response.status}) ${zipUrl}`)
      return false
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(buffer)
    const file = zip.file(entryFile)
    if (!file) {
      console.warn(`  ENTRY NOT FOUND IN ZIP: ${entryFile}`)
      return false
    }

    const content = Buffer.from(await file.async('arraybuffer'))
    mkdirSync(dirname(outputPath), { recursive: true })
    createWriteStream(outputPath).write(content)
    console.log(`  OK ${outputPath} (${content.length} bytes)`)
    return true
  } catch (e) {
    console.warn(`  ERROR: ${e.message}`)
    return false
  }
}

async function main() {
  console.log('=== Downloading Cubism Core Files ===\n')
  mkdirSync(CORE_DIR, { recursive: true })

  for (const asset of ASSETS) {
    const dest = resolve(CORE_DIR, asset.filename)
    await downloadFile(asset.url, dest)
  }

  await downloadZipAndExtract(
    CUBISM4_ZIP_URL,
    'CubismSdkForWeb-4-r.7/Core/live2dcubismcore.js',
    resolve(CORE_DIR, CUBISM4_CORE_FILE)
  )

  await downloadFile(
    'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.d.ts',
    resolve(CORE_DIR, 'live2dcubismcore.d.ts')
  )

  console.log('\n=== Done ===')
  const { readdir } = await import('fs/promises')
  const files = await readdir(CORE_DIR)
  if (files.length === 0) {
    console.log(
      'No core files downloaded. For manual setup, download from:\n' +
        '  https://www.live2d.com/download/cubism-sdk/download-web/\n' +
        'and place live2d.min.js + live2dcubismcore.js in public/core/'
    )
  } else {
    console.log(`Files in ${CORE_DIR}:`, files.join(', '))
  }
}

main().catch((e) => {
  console.error('Setup failed:', e.message)
  process.exit(1)
})
