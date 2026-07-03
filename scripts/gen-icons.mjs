// Regenerate PWA icons from scripts/icon.svg:  node scripts/gen-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('./icon.svg', import.meta.url))
const CREAM = '#FAF9F6'

// plain sizes
await sharp(svg).resize(512, 512).png().toFile('public/icon-512.png')
await sharp(svg).resize(192, 192).png().toFile('public/icon-192.png')

// maskable: same art inside the ~80% safe zone, cream bleed to the edges
await sharp(svg)
  .resize(400, 400)
  .extend({ top: 56, bottom: 56, left: 56, right: 56, background: CREAM })
  .png()
  .toFile('public/icon-maskable-512.png')

// iOS home-screen icon (iOS applies its own corner mask)
await sharp(svg)
  .resize(164, 164)
  .extend({ top: 8, bottom: 8, left: 8, right: 8, background: CREAM })
  .png()
  .toFile('public/apple-touch-icon.png')

console.log('icons written to public/')
