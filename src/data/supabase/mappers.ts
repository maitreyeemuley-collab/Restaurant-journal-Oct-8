/**
 * Pure converters between database rows (snake_case, nulls) and domain types
 * (camelCase, optional fields). No network here, so everything is unit tested.
 */
import type {
  CatalogPlace,
  DietaryOption,
  Guest,
  GuestPatch,
  ListItem,
  ListPatch,
  Neighborhood,
  NewGuestInput,
  NewListInput,
  NewPlaceInput,
  Occasion,
  Place,
  PlaceList,
  PlacePatch,
  PlaceStatus,
  PriceLevel,
  PublicList,
  Rating,
  RecommendationSource,
  Visit,
} from '../types'
import type {
  CatalogRow,
  GuestRow,
  ListItemRow,
  ListRow,
  PlaceRow,
  PublicListJson,
  VisitRow,
} from './rows'

const orNull = <T>(value: T | undefined): T | null => value ?? null
const trimmedOrNull = (value: string | undefined): string | null => value?.trim() || null

// ---------------------------------------------------------------- places

export function placeFromRow(row: PlaceRow): Place {
  const place: Place = {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    neighborhood: (row.neighborhood ?? undefined) as Neighborhood | undefined,
    cuisine: row.cuisine ?? undefined,
    priceLevel: (row.price_level ?? undefined) as PriceLevel | undefined,
    status: row.status as PlaceStatus,
    recommendation: row.recommendation_source
      ? {
          source: row.recommendation_source as RecommendationSource,
          detail: row.recommendation_detail ?? undefined,
        }
      : undefined,
    note: row.note ?? undefined,
    tags: row.tags,
    occasions: row.occasions as Occasion[],
    dietaryOptions: row.dietary_options as DietaryOption[],
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  if (row.catalog_id) place.catalogId = row.catalog_id
  return place
}

/** owner_id is NOT sent: the database fills it with auth.uid() and RLS enforces it. */
export function placeToInsertRow(input: NewPlaceInput): Record<string, unknown> {
  return {
    name: input.name.trim(),
    neighborhood: orNull(input.neighborhood),
    cuisine: orNull(input.cuisine),
    price_level: orNull(input.priceLevel),
    recommendation_source: orNull(input.recommendation?.source),
    recommendation_detail: trimmedOrNull(input.recommendation?.detail),
    catalog_id: orNull(input.catalogId),
    note: trimmedOrNull(input.note),
    tags: input.tags ?? [],
    occasions: input.occasions ?? [],
    dietary_options: input.dietaryOptions ?? [],
    lat: orNull(input.lat),
    lng: orNull(input.lng),
  }
}

/**
 * A key that is present with the value `undefined` means "clear this field" (the screens rely
 * on that, e.g. emptying a note), while a key that is absent means "leave it alone".
 * JSON drops undefined, so clearing has to be translated to an explicit null here.
 */
export function placePatchToRow(patch: PlacePatch): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name.trim()
  if ('neighborhood' in patch) row.neighborhood = orNull(patch.neighborhood)
  if ('cuisine' in patch) row.cuisine = orNull(patch.cuisine)
  if ('priceLevel' in patch) row.price_level = orNull(patch.priceLevel)
  if ('note' in patch) row.note = trimmedOrNull(patch.note)
  if ('recommendation' in patch) {
    row.recommendation_source = orNull(patch.recommendation?.source)
    row.recommendation_detail = trimmedOrNull(patch.recommendation?.detail)
  }
  if (patch.tags !== undefined) row.tags = patch.tags
  if (patch.occasions !== undefined) row.occasions = patch.occasions
  if (patch.dietaryOptions !== undefined) row.dietary_options = patch.dietaryOptions
  if (patch.status !== undefined) row.status = patch.status
  return row
}

// ---------------------------------------------------------------- catalog

export function catalogFromRow(row: CatalogRow): CatalogPlace {
  return {
    id: row.id,
    name: row.name,
    neighborhood: row.neighborhood as Neighborhood,
    cuisine: row.cuisine,
    priceLevel: row.price_level as PriceLevel,
    blurb: row.blurb,
    tags: row.tags,
    occasions: row.occasions as Occasion[],
    dietaryOptions: row.dietary_options as DietaryOption[],
    isNew: row.is_new,
    isTrending: row.is_trending,
    lat: row.lat,
    lng: row.lng,
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------- visits

export function visitFromRow(row: VisitRow): Visit {
  return {
    id: row.id,
    placeId: row.place_id,
    ownerId: row.owner_id,
    rating: row.rating as Rating,
    occasion: (row.occasion ?? undefined) as Occasion | undefined,
    photoUrls: row.photo_urls,
    visitedAt: row.visited_at,
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------- lists

export function listFromRow(row: ListRow): PlaceList {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? undefined,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listToInsertRow(input: NewListInput): Record<string, unknown> {
  return {
    title: input.title.trim(),
    description: trimmedOrNull(input.description),
    is_public: input.isPublic ?? true,
  }
}

export function listPatchToRow(patch: ListPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = patch.title.trim()
  if ('description' in patch) row.description = trimmedOrNull(patch.description)
  if (patch.isPublic !== undefined) row.is_public = patch.isPublic
  return row
}

export function listItemFromRow(row: ListItemRow): ListItem {
  return {
    listId: row.list_id,
    placeId: row.place_id,
    position: row.position,
    createdAt: row.created_at,
  }
}

export function publicListFromJson(json: PublicListJson): PublicList {
  return {
    list: {
      id: json.list.id,
      title: json.list.title,
      description: json.list.description ?? undefined,
      createdAt: json.list.created_at,
      updatedAt: json.list.updated_at,
    },
    places: json.places.map((place) => ({
      id: place.id,
      name: place.name,
      neighborhood: (place.neighborhood ?? undefined) as Neighborhood | undefined,
      cuisine: place.cuisine ?? undefined,
      priceLevel: (place.price_level ?? undefined) as PriceLevel | undefined,
      tags: place.tags,
      lat: place.lat ?? undefined,
      lng: place.lng ?? undefined,
    })),
  }
}

// ---------------------------------------------------------------- guests

export function guestFromRow(row: GuestRow): Guest {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    likes: row.likes,
    dislikes: row.dislikes,
    dietaryNeeds: row.dietary_needs as DietaryOption[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function guestToInsertRow(input: NewGuestInput): Record<string, unknown> {
  return {
    name: input.name.trim(),
    likes: input.likes ?? [],
    dislikes: input.dislikes ?? [],
    dietary_needs: input.dietaryNeeds ?? [],
  }
}

export function guestPatchToRow(patch: GuestPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name.trim()
  if (patch.likes !== undefined) row.likes = patch.likes
  if (patch.dislikes !== undefined) row.dislikes = patch.dislikes
  if (patch.dietaryNeeds !== undefined) row.dietary_needs = patch.dietaryNeeds
  return row
}
