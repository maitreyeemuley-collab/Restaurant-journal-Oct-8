/**
 * Shared domain types.
 *
 * Each interface maps onto one future database table (snake_case columns later):
 *   Place -> places, CatalogPlace -> catalog_places, Visit -> visits,
 *   PlaceList -> lists, ListItem -> list_items, Guest -> guests.
 * Ids are strings (uuid later) and timestamps are ISO-8601 strings (timestamptz later).
 */

export type Id = string
export type Timestamp = string

export type Neighborhood =
  'Capitol Hill' | 'Ballard' | 'Fremont' | 'Queen Anne' | 'International District'

export type PriceLevel = 1 | 2 | 3 | 4
export type Rating = 1 | 2 | 3 | 4 | 5

export type PlaceStatus = 'want_to_try' | 'visited'

export type RecommendationSource = 'friend' | 'instagram' | 'rating_site' | 'discover' | 'other'

export type Occasion =
  'date_night' | 'friends' | 'family' | 'visitors' | 'celebration' | 'solo' | 'casual'

export type DietaryOption =
  'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'nut_free' | 'halal'

export interface Recommendation {
  source: RecommendationSource
  /** Friend name, Instagram handle, site name, or free text. */
  detail?: string
}

/** A place Jessica has saved. Always owned by one user. */
export interface Place {
  id: Id
  ownerId: Id
  name: string
  neighborhood?: Neighborhood
  cuisine?: string
  priceLevel?: PriceLevel
  status: PlaceStatus
  recommendation?: Recommendation
  /** Set when the place was saved from Discover. */
  catalogId?: Id
  note?: string
  tags: string[]
  occasions: Occasion[]
  /** Dietary needs this place is good for. */
  dietaryOptions: DietaryOption[]
  lat?: number
  lng?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** A place "out in the world" that Discover can suggest. Not owned by a user. */
export interface CatalogPlace {
  id: Id
  name: string
  neighborhood: Neighborhood
  cuisine: string
  priceLevel: PriceLevel
  /** One-line reason to go. */
  blurb: string
  tags: string[]
  occasions: Occasion[]
  dietaryOptions: DietaryOption[]
  isNew: boolean
  isTrending: boolean
  lat: number
  lng: number
  createdAt: Timestamp
}

export interface Visit {
  id: Id
  placeId: Id
  ownerId: Id
  rating: Rating
  occasion?: Occasion
  photoUrls: string[]
  visitedAt: Timestamp
  createdAt: Timestamp
}

export interface PlaceList {
  id: Id
  ownerId: Id
  title: string
  description?: string
  isPublic: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** Join table between lists and places. */
export interface ListItem {
  listId: Id
  placeId: Id
  position: number
  createdAt: Timestamp
}

export interface Guest {
  id: Id
  ownerId: Id
  name: string
  likes: string[]
  dislikes: string[]
  dietaryNeeds: DietaryOption[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** The only fields of a place that a public list exposes (no notes, status or ratings). */
export type PublicPlace = Pick<
  Place,
  'id' | 'name' | 'neighborhood' | 'cuisine' | 'priceLevel' | 'tags' | 'lat' | 'lng'
>

export interface PublicList {
  list: Pick<PlaceList, 'id' | 'title' | 'description' | 'createdAt' | 'updatedAt'>
  places: PublicPlace[]
}

/** Input shapes (what screens send to repositories). */
export interface NewPlaceInput {
  name: string
  neighborhood?: Neighborhood
  cuisine?: string
  priceLevel?: PriceLevel
  recommendation?: Recommendation
  catalogId?: Id
  note?: string
  tags?: string[]
  occasions?: Occasion[]
  dietaryOptions?: DietaryOption[]
  lat?: number
  lng?: number
}

export type PlacePatch = Partial<
  Pick<
    Place,
    | 'name'
    | 'neighborhood'
    | 'cuisine'
    | 'priceLevel'
    | 'recommendation'
    | 'note'
    | 'tags'
    | 'occasions'
    | 'dietaryOptions'
    | 'status'
  >
>

export interface NewVisitInput {
  placeId: Id
  rating: Rating
  occasion?: Occasion
  photoUrls?: string[]
  visitedAt?: Timestamp
}

export interface NewListInput {
  title: string
  description?: string
  isPublic?: boolean
}

export type ListPatch = Partial<Pick<PlaceList, 'title' | 'description' | 'isPublic'>>

export interface NewGuestInput {
  name: string
  likes?: string[]
  dislikes?: string[]
  dietaryNeeds?: DietaryOption[]
}

export type GuestPatch = Partial<Pick<Guest, 'name' | 'likes' | 'dislikes' | 'dietaryNeeds'>>
