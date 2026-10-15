import type { SupabaseClient } from '@supabase/supabase-js'
import { emitDataChange } from '../events'
import type { PlaceRepository } from '../repository'
import { friendlyError, isUuid, notFoundError, RepositoryError, unwrap } from './errors'
import { placeFromRow, placePatchToRow, placeToInsertRow } from './mappers'
import type { PlaceRow } from './rows'

export function createPlaceRepository(client: SupabaseClient): PlaceRepository {
  return {
    async list() {
      const rows = unwrap(
        await client.from('places').select('*').order('created_at', { ascending: false }),
      )
      return (rows as PlaceRow[]).map(placeFromRow)
    },

    async get(id) {
      if (!isUuid(id)) return null
      const row = unwrap(await client.from('places').select('*').eq('id', id).maybeSingle())
      return row ? placeFromRow(row as PlaceRow) : null
    },

    async create(input) {
      if (!input.name.trim()) throw new RepositoryError('A place needs a name.')

      // Saving the same Discover place twice returns the one that's already saved.
      if (input.catalogId) {
        const existing = unwrap(
          await client.from('places').select('*').eq('catalog_id', input.catalogId).maybeSingle(),
        )
        if (existing) return placeFromRow(existing as PlaceRow)
      }

      const { data, error } = await client
        .from('places')
        .insert(placeToInsertRow(input))
        .select()
        .single()
      if (error) {
        // Two taps at once: the unique (owner, catalog) constraint rejected the second one.
        if (error.code === '23505' && input.catalogId) {
          const winner = unwrap(
            await client.from('places').select('*').eq('catalog_id', input.catalogId).single(),
          )
          return placeFromRow(winner as PlaceRow)
        }
        throw friendlyError(error)
      }
      emitDataChange()
      return placeFromRow(data as PlaceRow)
    },

    async update(id, patch) {
      if (!isUuid(id)) throw notFoundError('place')
      const { data, error } = await client
        .from('places')
        .update(placePatchToRow(patch))
        .eq('id', id)
        .select()
        .maybeSingle()
      if (error) throw friendlyError(error)
      if (!data) throw notFoundError('place')
      emitDataChange()
      return placeFromRow(data as PlaceRow)
    },

    async remove(id) {
      if (!isUuid(id)) return
      // Visits and list entries go with it (ON DELETE CASCADE in the migration).
      unwrap(await client.from('places').delete().eq('id', id))
      emitDataChange()
    },
  }
}
