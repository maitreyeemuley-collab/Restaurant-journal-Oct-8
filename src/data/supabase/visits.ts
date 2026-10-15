import type { SupabaseClient } from '@supabase/supabase-js'
import { emitDataChange } from '../events'
import type { VisitRepository } from '../repository'
import { isUuid, RepositoryError, unwrap } from './errors'
import { visitFromRow } from './mappers'
import type { VisitRow } from './rows'

export function createVisitRepository(client: SupabaseClient): VisitRepository {
  return {
    async listAll() {
      const rows = unwrap(
        await client.from('visits').select('*').order('visited_at', { ascending: false }),
      )
      return (rows as VisitRow[]).map(visitFromRow)
    },

    async listForPlace(placeId) {
      if (!isUuid(placeId)) return []
      const rows = unwrap(
        await client
          .from('visits')
          .select('*')
          .eq('place_id', placeId)
          .order('visited_at', { ascending: false }),
      )
      return (rows as VisitRow[]).map(visitFromRow)
    },

    async logVisit(input) {
      if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
        throw new RepositoryError('Pick a rating from 1 to 5.')
      }
      // One database function does the insert AND flips the place to "visited" atomically.
      const row = unwrap(
        await client.rpc('log_visit', {
          p_place_id: input.placeId,
          p_rating: input.rating,
          p_occasion: input.occasion ?? null,
          p_photo_urls: input.photoUrls ?? [],
          p_visited_at: input.visitedAt ?? null,
        }),
      )
      emitDataChange()
      return visitFromRow(row as VisitRow)
    },
  }
}
