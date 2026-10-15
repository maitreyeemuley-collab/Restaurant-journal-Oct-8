const MAX_DIMENSION = 1024
const JPEG_QUALITY = 0.8

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("We couldn't read that photo."))
    reader.readAsDataURL(blob)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("We couldn't open that photo."))
    image.src = src
  })
}

/**
 * Shrinks a photo to at most 1024px on its long side and re-encodes it as JPEG, so uploads
 * are small and fast on a phone connection. Shared by the local and Supabase photo stores.
 */
export async function resizeImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')

  const image = await loadImage(await blobToDataUrl(file))
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const context = canvas.getContext('2d')
  if (!context) return file
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("We couldn't prepare that photo."))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}
