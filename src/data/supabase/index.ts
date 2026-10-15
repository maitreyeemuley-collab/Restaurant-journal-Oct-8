import type { SupabaseClient } from '@supabase/supabase-js'
import type { Repositories } from '../repository'
import { createCatalogRepository } from './catalog'
import { createGuestRepository } from './guests'
import { createListRepository } from './lists'
import { createPhotoStore } from './photos'
import { createPlaceRepository } from './places'
import { createVisitRepository } from './visits'

/**
 * Supabase-backed implementation of every repository interface in `../repository.ts`.
 * Ownership comes from the signed-in session (owner_id defaults to auth.uid()) and
 * row-level security, so nothing here passes a user id around.
 * There is deliberately no `resetDemoData`: that button disappears with a real back end.
 */
export function createSupabaseRepositories(client: SupabaseClient): Repositories {
  return {
    places: createPlaceRepository(client),
    catalog: createCatalogRepository(client),
    visits: createVisitRepository(client),
    lists: createListRepository(client),
    guests: createGuestRepository(client),
    photos: createPhotoStore(client),
  }
}
