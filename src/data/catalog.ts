import type { CatalogPlace, NewPlaceInput } from './types'

/** Builds the Quick-Save style input used when Jessica taps "Save" on a Discover card. */
export function placeInputFromCatalog(catalogPlace: CatalogPlace): NewPlaceInput {
  return {
    name: catalogPlace.name,
    neighborhood: catalogPlace.neighborhood,
    cuisine: catalogPlace.cuisine,
    priceLevel: catalogPlace.priceLevel,
    recommendation: { source: 'discover' },
    catalogId: catalogPlace.id,
    note: catalogPlace.blurb,
    tags: catalogPlace.tags,
    occasions: catalogPlace.occasions,
    dietaryOptions: catalogPlace.dietaryOptions,
    lat: catalogPlace.lat,
    lng: catalogPlace.lng,
  }
}
