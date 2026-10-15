import type { Neighborhood, Occasion, PlaceStatus, PriceLevel } from '../../data/types'

/** What Discover and My Places let you filter by. `null` means "any". */
export interface FilterState {
  query: string
  status: PlaceStatus | null
  cuisine: string | null
  neighborhood: Neighborhood | null
  price: PriceLevel | null
  occasion: Occasion | null
}

export const EMPTY_FILTERS: FilterState = {
  query: '',
  status: null,
  cuisine: null,
  neighborhood: null,
  price: null,
  occasion: null,
}

export interface Filterable {
  cuisine?: string
  neighborhood?: string
  priceLevel?: PriceLevel
  occasions: readonly Occasion[]
  status?: PlaceStatus
}

/** Number of filters in use, not counting the search text or status chips. */
export function countActiveFilters(filters: FilterState): number {
  return [filters.cuisine, filters.neighborhood, filters.price, filters.occasion].filter(
    (value) => value !== null,
  ).length
}

export function hasAnyFilter(filters: FilterState): boolean {
  return filters.query.trim() !== '' || filters.status !== null || countActiveFilters(filters) > 0
}

/**
 * Pure function so it's easy to test: every active filter must match (AND),
 * and the search text must appear somewhere in `getSearchText(item)`.
 */
export function applyFilters<T extends Filterable>(
  items: readonly T[],
  filters: FilterState,
  getSearchText: (item: T) => string,
): T[] {
  const query = filters.query.trim().toLowerCase()
  return items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false
    if (filters.cuisine && item.cuisine !== filters.cuisine) return false
    if (filters.neighborhood && item.neighborhood !== filters.neighborhood) return false
    if (filters.price && item.priceLevel !== filters.price) return false
    if (filters.occasion && !item.occasions.includes(filters.occasion)) return false
    if (query && !getSearchText(item).toLowerCase().includes(query)) return false
    return true
  })
}
