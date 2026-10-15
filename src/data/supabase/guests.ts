import type { SupabaseClient } from '@supabase/supabase-js'
import { emitDataChange } from '../events'
import type { GuestRepository } from '../repository'
import { friendlyError, isUuid, notFoundError, RepositoryError, unwrap } from './errors'
import { guestFromRow, guestPatchToRow, guestToInsertRow } from './mappers'
import type { GuestRow } from './rows'

export function createGuestRepository(client: SupabaseClient): GuestRepository {
  return {
    async list() {
      const rows = unwrap(
        await client.from('guests').select('*').order('created_at', { ascending: true }),
      )
      return (rows as GuestRow[]).map(guestFromRow)
    },

    async get(id) {
      if (!isUuid(id)) return null
      const row = unwrap(await client.from('guests').select('*').eq('id', id).maybeSingle())
      return row ? guestFromRow(row as GuestRow) : null
    },

    async create(input) {
      if (!input.name.trim()) throw new RepositoryError('A guest needs a name.')
      const row = unwrap(
        await client.from('guests').insert(guestToInsertRow(input)).select().single(),
      )
      emitDataChange()
      return guestFromRow(row as GuestRow)
    },

    async update(id, patch) {
      if (!isUuid(id)) throw notFoundError('guest')
      const { data, error } = await client
        .from('guests')
        .update(guestPatchToRow(patch))
        .eq('id', id)
        .select()
        .maybeSingle()
      if (error) throw friendlyError(error)
      if (!data) throw notFoundError('guest')
      emitDataChange()
      return guestFromRow(data as GuestRow)
    },

    async remove(id) {
      if (!isUuid(id)) return
      unwrap(await client.from('guests').delete().eq('id', id))
      emitDataChange()
    },
  }
}
