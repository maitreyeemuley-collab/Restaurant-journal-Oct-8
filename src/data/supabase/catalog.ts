import type { SupabaseClient } from '@supabase/supabase-js'
import type { CatalogRepository } from '../repository'
import { unwrap } from './errors'
import { catalogFromRow } from './mappers'
import type { CatalogRow } from './rows'

export function createCatalogRepository(client: SupabaseClient): CatalogRepository {
  return {
    async list() {
      const rows = unwrap(
        await client.from('catalog_places').select('*').order('created_at', { ascending: false }),
      )
      return (rows as CatalogRow[]).map(catalogFromRow)
    },
  }
}
