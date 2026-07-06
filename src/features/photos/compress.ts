import { removeBackground } from '@imgly/background-removal'
import type { ProcessedPhoto } from '../../data/db'

// Photo pipeline per PLAN §4.1: one decode, two JPEG outputs —
// full ~1600px (item card, looks sharp on desktop) + thumb ~320px (grid).
// Raised from 700px/q0.72 which looked soft on PC; ~250–450 KB per photo now.
const FULL_MAX = 1600
const THUMB_MAX = 320
const FULL_QUALITY = 0.85
const THUMB_QUALITY = 0.72

type Decoded = ImageBitmap | HTMLImageElement | HTMLCanvasElement

// createImageBitmap applies EXIF orientation ('from-image' is the spec default,
// stated explicitly for older Chrome); <img> fallback for browsers without it.
async function decode(file: Blob): Promise<Decoded> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('image decode failed'))
      }
      img.src = url
    })
  }
}

function sourceSize(src: Decoded): { w: number; h: number } {
  return src instanceof HTMLImageElement ? { w: src.naturalWidth, h: src.naturalHeight } : { w: src.width, h: src.height }
}

function drawScaled(src: Decoded, maxSide: number): { canvas: HTMLCanvasElement; width: number; height: number } {
  const { w, h } = sourceSize(src)
  const scale = Math.min(1, maxSide / Math.max(w, h))
  const width = Math.max(1, Math.round(w * scale))
  const height = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(src, 0, 0, width, height)
  return { canvas, width, height }
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('jpeg encode failed'))), 'image/jpeg', quality)
  })
}

/** Rebuild a thumbnail from a stored full-size JPEG (used by backup import) */
export async function thumbFor(full: Blob): Promise<Blob> {
  const src = await decode(full)
  try {
    return await toJpeg(drawScaled(src, THUMB_MAX).canvas, THUMB_QUALITY)
  } finally {
    if ('close' in src) src.close()
  }
}

/**
 * Rotate a stored full-size JPEG 90° clockwise and regenerate full + thumb.
 * Works on the compressed ~700px copy (the original is long gone by now);
 * one extra encode per turn, negligible at catalog quality.
 */
export async function rotatePhoto(full: Blob): Promise<ProcessedPhoto> {
  const src = await decode(full)
  try {
    const { w, h } = sourceSize(src)
    const rotated = document.createElement('canvas')
    rotated.width = h
    rotated.height = w
    const ctx = rotated.getContext('2d')!
    ctx.translate(h, 0)
    ctx.rotate(Math.PI / 2)
    ctx.drawImage(src, 0, 0)
    // rotated is already within FULL_MAX; drawScaled just re-encodes the full copy
    const fullOut = drawScaled(rotated, FULL_MAX)
    const thumbOut = drawScaled(rotated, THUMB_MAX)
    const [fullBlob, thumbBlob] = await Promise.all([
      toJpeg(fullOut.canvas, FULL_QUALITY),
      toJpeg(thumbOut.canvas, THUMB_QUALITY),
    ])
    return { full: fullBlob, thumb: thumbBlob, width: fullOut.width, height: fullOut.height }
  } finally {
    if ('close' in src) src.close()
  }
}

/**
 * Crop a region out of a full-size JPEG and produce a fresh full+thumb pair.
 * `box` is fractional (x,y = top-left, w,h = size, all 0..1) — used by AI
 * recognition to give each detected item its own photo from one screenshot.
 *
 * The storefront grid deliberately shows tiles as object-cover squares (see
 * reference/shafka.jsx), so a tall/narrow AI box (e.g. pants, a dress) would
 * get its ends chopped off to fill the square. Padding the box to a square
 * here — once, at the source — means every downstream view (grid tile,
 * detail card) gets a photo that already matches its shape; no content is
 * ever cropped a second time.
 */
export async function cropPhoto(
  full: Blob,
  box: { x: number; y: number; w: number; h: number },
): Promise<ProcessedPhoto> {
  const src = await decode(full)
  try {
    const { w: iw, h: ih } = sourceSize(src)
    const bx = Math.max(0, Math.min(1, box.x))
    const by = Math.max(0, Math.min(1, box.y))
    const bw = Math.max(0.02, Math.min(1 - bx, box.w))
    const bh = Math.max(0.02, Math.min(1 - by, box.h))
    // Pixel-space box, padded ~10% and expanded to a square around its centre.
    // Not clamped to the screenshot's own bounds: a tall/narrow item (pants, a
    // dress) can be taller than the screenshot is wide, so the square is
    // padded with white beyond the source edges instead of shrinking to fit —
    // otherwise the item's ends get silently cropped out of the stored photo.
    const cx = (bx + bw / 2) * iw
    const cy = (by + bh / 2) * ih
    const side = Math.max(bw * iw, bh * ih) * 1.1
    const sx = Math.round(cx - side / 2)
    const sy = Math.round(cy - side / 2)
    const sw = Math.max(1, Math.round(side))
    const sh = sw
    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, sw, sh)
    ctx.drawImage(src, -sx, -sy)
    const fullOut = drawScaled(canvas, FULL_MAX)
    const thumbOut = drawScaled(canvas, THUMB_MAX)
    const [fullBlob, thumbBlob] = await Promise.all([
      toJpeg(fullOut.canvas, FULL_QUALITY),
      toJpeg(thumbOut.canvas, THUMB_QUALITY),
    ])
    return { full: fullBlob, thumb: thumbBlob, width: fullOut.width, height: fullOut.height }
  } finally {
    if ('close' in src) src.close()
  }
}

/**
 * Cut the garment out of an AI-cropped photo and re-composite it onto plain
 * white, then re-encode full+thumb. Only meant for AI recognition: a scanned
 * shop screenshot can have any studio backdrop (black, colored, patterned),
 * which the crop above faithfully preserves — this is the step that actually
 * normalizes it. Runs entirely on-device (no photo data leaves the browser);
 * the segmentation model itself is fetched from a CDN on first use.
 */
export async function whitenBackground(photo: ProcessedPhoto): Promise<ProcessedPhoto> {
  const cutout = await removeBackground(photo.full)
  const src = await decode(cutout)
  try {
    const { w, h } = sourceSize(src)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(src, 0, 0)
    const fullOut = drawScaled(canvas, FULL_MAX)
    const thumbOut = drawScaled(canvas, THUMB_MAX)
    const [fullBlob, thumbBlob] = await Promise.all([
      toJpeg(fullOut.canvas, FULL_QUALITY),
      toJpeg(thumbOut.canvas, THUMB_QUALITY),
    ])
    return { full: fullBlob, thumb: thumbBlob, width: fullOut.width, height: fullOut.height }
  } finally {
    if ('close' in src) src.close()
  }
}

export async function processPhotoFile(file: File): Promise<ProcessedPhoto> {
  const src = await decode(file)
  try {
    const full = drawScaled(src, FULL_MAX)
    const thumb = drawScaled(src, THUMB_MAX)
    const [fullBlob, thumbBlob] = await Promise.all([toJpeg(full.canvas, FULL_QUALITY), toJpeg(thumb.canvas, THUMB_QUALITY)])
    return { full: fullBlob, thumb: thumbBlob, width: full.width, height: full.height }
  } finally {
    if ('close' in src) src.close()
  }
}
