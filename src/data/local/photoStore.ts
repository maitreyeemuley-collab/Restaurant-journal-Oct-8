import { blobToDataUrl, resizeImage } from '../imageResize'
import type { PhotoStore } from '../repository'

/**
 * Local demo photo store: shrinks the photo and keeps it as a JPEG data URL inside
 * localStorage. The Supabase build uses data/supabase/photos.ts instead.
 */
export function createLocalPhotoStore(): PhotoStore {
  return {
    async upload(file) {
      return blobToDataUrl(await resizeImage(file))
    },
  }
}
