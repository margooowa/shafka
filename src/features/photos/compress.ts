import type { ProcessedPhoto } from '../../data/db'

// Photo pipeline per PLAN §4.1: one decode, two JPEG outputs —
// full ~700px (item card) + thumb ~240px (storefront grid).
const FULL_MAX = 700
const THUMB_MAX = 240
const FULL_QUALITY = 0.72
const THUMB_QUALITY = 0.7

type Decoded = ImageBitmap | HTMLImageElement

// createImageBitmap applies EXIF orientation ('from-image' is the spec default,
// stated explicitly for older Chrome); <img> fallback for browsers without it.
async function decode(file: File): Promise<Decoded> {
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
