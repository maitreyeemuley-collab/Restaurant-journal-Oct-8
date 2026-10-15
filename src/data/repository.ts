/**
 * Repository interfaces: the ONLY thing screens know about data.
 *
 * Every method is async on purpose so a network-backed (Supabase) implementation has the same
 * call shape as the localStorage one. To go live, implement these interfaces in
 * `src/data/supabase/` and select them in `RepositoryProvider.tsx`.
 */
import type {
  CatalogPlace,
  Guest,
  GuestPatch,
  Id,
  ListItem,
  ListPatch,
  NewGuestInput,
  NewListInput,
  NewPlaceInput,
  NewVisitInput,
  Place,
  PlaceList,
  PlacePatch,
  PublicList,
  Visit,
} from './types'

export interface PlaceRepository {
  list(): Promise<Place[]>
  get(id: Id): Promise<Place | null>
  /** Always creates the place as `want_to_try`. Saving the same `catalogId` twice returns the existing place. */
  create(input: NewPlaceInput): Promise<Place>
  update(id: Id, patch: PlacePatch): Promise<Place>
  /** Also removes the place's visits and list entries (database: ON DELETE CASCADE). */
  remove(id: Id): Promise<void>
}

export interface CatalogRepository {
  list(): Promise<CatalogPlace[]>
}

export interface VisitRepository {
  listAll(): Promise<Visit[]>
  listForPlace(placeId: Id): Promise<Visit[]>
  /**
   * Records a visit, moves the place to `visited` and adds the visit's occasion to the place.
   * Database: do this in one transaction (RPC / function).
   */
  logVisit(input: NewVisitInput): Promise<Visit>
}

export interface ListRepository {
  list(): Promise<PlaceList[]>
  get(id: Id): Promise<PlaceList | null>
  create(input: NewListInput): Promise<PlaceList>
  update(id: Id, patch: ListPatch): Promise<PlaceList>
  remove(id: Id): Promise<void>
  /** Items of one list, ordered by position. */
  listItems(listId: Id): Promise<ListItem[]>
  /** Items of every list (used for counts and "already in a list" hints). */
  listAllItems(): Promise<ListItem[]>
  /** Idempotent. */
  addPlace(listId: Id, placeId: Id): Promise<void>
  removePlace(listId: Id, placeId: Id): Promise<void>
  /**
   * Read-only view for the shareable page. Must work with NO signed-in user.
   * Returns null when the list doesn't exist or isn't public.
   * Database: a public view / RPC exposing only the fields in `PublicList`.
   */
  getPublic(id: Id): Promise<PublicList | null>
}

export interface GuestRepository {
  list(): Promise<Guest[]>
  get(id: Id): Promise<Guest | null>
  create(input: NewGuestInput): Promise<Guest>
  update(id: Id, patch: GuestPatch): Promise<Guest>
  remove(id: Id): Promise<void>
}

export interface PhotoStore {
  /** Stores an image and returns a URL that can be used in `<img src>`. */
  upload(file: File): Promise<string>
}

export interface Repositories {
  places: PlaceRepository
  catalog: CatalogRepository
  visits: VisitRepository
  lists: ListRepository
  guests: GuestRepository
  photos: PhotoStore
  /** Demo-only: restore the seed data. Leave undefined in a real back end. */
  resetDemoData?: () => Promise<void>
}
