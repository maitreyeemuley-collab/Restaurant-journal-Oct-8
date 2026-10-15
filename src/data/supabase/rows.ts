/** Shapes of the rows Postgres returns (snake_case). Mapped to domain types in mappers.ts. */

export interface PlaceRow {
  id: string
  owner_id: string
  name: string
  neighborhood: string | null
  cuisine: string | null
  price_level: number | null
  status: string
  recommendation_source: string | null
  recommendation_detail: string | null
  catalog_id: string | null
  note: string | null
  tags: string[]
  occasions: string[]
  dietary_options: string[]
  lat: number | null
  lng: number | null
  created_at: string
  updated_at: string
}

export interface CatalogRow {
  id: string
  name: string
  neighborhood: string
  cuisine: string
  price_level: number
  blurb: string
  tags: string[]
  occasions: string[]
  dietary_options: string[]
  is_new: boolean
  is_trending: boolean
  lat: number
  lng: number
  created_at: string
}

export interface VisitRow {
  id: string
  place_id: string
  owner_id: string
  rating: number
  occasion: string | null
  photo_urls: string[]
  visited_at: string
  created_at: string
}

export interface ListRow {
  id: string
  owner_id: string
  title: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface ListItemRow {
  list_id: string
  place_id: string
  position: number
  created_at: string
}

export interface GuestRow {
  id: string
  owner_id: string
  name: string
  likes: string[]
  dislikes: string[]
  dietary_needs: string[]
  created_at: string
  updated_at: string
}

/** What the get_public_list() database function returns. */
export interface PublicListJson {
  list: {
    id: string
    title: string
    description: string | null
    created_at: string
    updated_at: string
  }
  places: {
    id: string
    name: string
    neighborhood: string | null
    cuisine: string | null
    price_level: number | null
    tags: string[]
    lat: number | null
    lng: number | null
  }[]
}
