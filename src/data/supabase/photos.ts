import type { SupabaseClient } from '@supabase/supabase-js'
import { resizeImage } from '../imageResize'
import type { PhotoStore } from '../repository'
import { friendlyError, RepositoryError } from './errors'

const BUCKET = 'photos'

/**
 * Uploads a resized JPEG to the public `photos` bucket under the signed-in user's own
 * folder (the storage policy only allows `{user_id}/...`) and returns its public URL.
 */
export function createPhotoStore(client: SupabaseClient): PhotoStore {
  return {
    async upload(file) {
      const blob = await resizeImage(file)
      const { data } = await client.auth.getSession()
      const userId = data.session?.user.id
      if (!userId) throw new RepositoryError('Please sign in to add photos.')

      const path = `${userId}/${crypto.randomUUID()}.jpg`
      const { error } = await client.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
      if (error) throw friendlyError(error)

      return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    },
  }
}
