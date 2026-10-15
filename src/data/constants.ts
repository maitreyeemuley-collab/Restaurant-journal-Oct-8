import type {
  DietaryOption,
  Neighborhood,
  Occasion,
  PriceLevel,
  RecommendationSource,
} from './types'

/** Id used for the single demo user until real auth exists. */
export const DEMO_OWNER_ID = 'local-user'

export interface NeighborhoodInfo {
  name: Neighborhood
  lat: number
  lng: number
}

export const NEIGHBORHOODS: readonly NeighborhoodInfo[] = [
  { name: 'Capitol Hill', lat: 47.6253, lng: -122.3222 },
  { name: 'Ballard', lat: 47.6686, lng: -122.3844 },
  { name: 'Fremont', lat: 47.6512, lng: -122.35 },
  { name: 'Queen Anne', lat: 47.6372, lng: -122.3569 },
  { name: 'International District', lat: 47.5984, lng: -122.3236 },
]

export const SEATTLE_CENTER = { lat: 47.6338, lng: -122.3474 }

export const CUISINES: readonly string[] = [
  'Chinese',
  'Dim Sum',
  'Japanese',
  'Ramen',
  'Korean',
  'Thai',
  'Vietnamese',
  'Filipino',
  'Indian',
  'Ethiopian',
  'Italian',
  'Pizza',
  'Mexican',
  'Mediterranean',
  'Pacific NW',
  'BBQ',
  'Cocktail bar',
  'Café & bakery',
]

export const OCCASIONS: readonly { value: Occasion; label: string }[] = [
  { value: 'date_night', label: 'Date night' },
  { value: 'friends', label: 'With friends' },
  { value: 'family', label: 'Family' },
  { value: 'visitors', label: 'Hosting visitors' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'solo', label: 'Solo' },
  { value: 'casual', label: 'Casual bite' },
]

export const DIETARY_OPTIONS: readonly { value: DietaryOption; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten-free' },
  { value: 'dairy_free', label: 'Dairy-free' },
  { value: 'nut_free', label: 'Nut-free' },
  { value: 'halal', label: 'Halal' },
]

export const RECOMMENDATION_SOURCES: readonly { value: RecommendationSource; label: string }[] = [
  { value: 'friend', label: 'A friend' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'rating_site', label: 'Rating site' },
  { value: 'discover', label: 'Discover' },
  { value: 'other', label: 'Other' },
]

/** Sources a person can pick by hand in Quick Save ('discover' is set automatically). */
export const PICKABLE_SOURCES = RECOMMENDATION_SOURCES.filter((s) => s.value !== 'discover')

export const PRICE_LEVELS: readonly PriceLevel[] = [1, 2, 3, 4]

export const occasionLabel = (value: Occasion): string =>
  OCCASIONS.find((o) => o.value === value)?.label ?? value

export const dietaryLabel = (value: DietaryOption): string =>
  DIETARY_OPTIONS.find((d) => d.value === value)?.label ?? value

export const sourceLabel = (value: RecommendationSource): string =>
  RECOMMENDATION_SOURCES.find((s) => s.value === value)?.label ?? value

export const priceLabel = (level: PriceLevel): string => '$'.repeat(level)
