import type { SupabaseClient } from '@supabase/supabase-js'
import { emitDataChange } from '../events'
import type { ListRepository } from '../repository'
import { friendlyError, isUuid, notFoundError, RepositoryError, unwrap } from './errors'
import {
  listFromRow,
  listItemFromRow,
  listPatchToRow,
  listToInsertRow,
  publicListFromJson,
} from './mappers'
import type { ListItemRow, ListRow, PublicListJson } from './rows'

export function createListRepository(client: SupabaseClient): ListRepository {
  const sortedItems = async (listId: string): Promise<ListItemRow[]> =>
    unwrap(
      await client.from('list_items').select('*').eq('list_id', listId).order('position'),
    ) as ListItemRow[]

  return {
    async list() {
      const rows = unwrap(
        await client.from('lists').select('*').order('updated_at', { ascending: false }),
      )
      return (rows as ListRow[]).map(listFromRow)
    },

    async get(id) {
      if (!isUuid(id)) return null
      const row = unwrap(await client.from('lists').select('*').eq('id', id).maybeSingle())
      return row ? listFromRow(row as ListRow) : null
    },

    async create(input) {
      if (!input.title.trim()) throw new RepositoryError('A list needs a title.')
      const row = unwrap(
        await client.from('lists').insert(listToInsertRow(input)).select().single(),
      )
      emitDataChange()
      return listFromRow(row as ListRow)
    },

    async update(id, patch) {
      if (!isUuid(id)) throw notFoundError('list')
      const { data, error } = await client
        .from('lists')
        .update(listPatchToRow(patch))
        .eq('id', id)
        .select()
        .maybeSingle()
      if (error) throw friendlyError(error)
      if (!data) throw notFoundError('list')
      emitDataChange()
      return listFromRow(data as ListRow)
    },

    async remove(id) {
      if (!isUuid(id)) return
      unwrap(await client.from('lists').delete().eq('id', id))
      emitDataChange()
    },

    async listItems(listId) {
      if (!isUuid(listId)) return []
      return (await sortedItems(listId)).map(listItemFromRow)
    },

    async listAllItems() {
      const rows = unwrap(await client.from('list_items').select('*'))
      return (rows as ListItemRow[]).map(listItemFromRow)
    },

    async addPlace(listId, placeId) {
      if (!isUuid(listId)) throw notFoundError('list')
      if (!isUuid(placeId)) throw notFoundError('place')
      const items = await sortedItems(listId)
      if (items.some((item) => item.place_id === placeId)) return
      const position = items.length === 0 ? 0 : Math.max(...items.map((i) => i.position)) + 1
      unwrap(
        await client.from('list_items').insert({ list_id: listId, place_id: placeId, position }),
      )
      // Touch the list so "recently updated" ordering stays right.
      unwrap(
        await client
          .from('lists')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', listId),
      )
      emitDataChange()
    },

    async removePlace(listId, placeId) {
      if (!isUuid(listId) || !isUuid(placeId)) return
      unwrap(await client.from('list_items').delete().eq('list_id', listId).eq('place_id', placeId))
      // Close the gap so positions stay 0..n-1.
      const remaining = await sortedItems(listId)
      const moved = remaining
        .map((item, index) => ({ list_id: item.list_id, place_id: item.place_id, position: index }))
        .filter((row, index) => remaining[index]?.position !== row.position)
      if (moved.length > 0) {
        unwrap(await client.from('list_items').upsert(moved, { onConflict: 'list_id,place_id' }))
      }
      emitDataChange()
    },

    async getPublic(id) {
      // Works signed out: the database function only returns the public fields of public lists.
      if (!isUuid(id)) return null
      const json = unwrap(await client.rpc('get_public_list', { p_list_id: id }))
      return json ? publicListFromJson(json as PublicListJson) : null
    },
  }
}
