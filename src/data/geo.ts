import { NEIGHBORHOODS } from './constants'
import type { Neighborhood } from './types'

export interface LatLng {
  lat: number
  lng: number
}

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * There is no geocoding service in this version, so a place with only a neighborhood is
 * pinned near that neighborhood's center. The offset is derived from `seed` so the pin stays
 * put between renders and different places don't stack on one point.
 * TODO(supabase): replace with real coordinates from a geocoder / places API.
 */
export function approximateLocation(neighborhood: Neighborhood, seed: string): LatLng | undefined {
  const center = NEIGHBORHOODS.find((n) => n.name === neighborhood)
  if (!center) return undefined
  const h = hash(seed)
  const dLat = ((h % 101) - 50) / 10000 // about +/- 550 m
  const dLng = (((h >> 7) % 101) - 50) / 7000
  return { lat: center.lat + dLat, lng: center.lng + dLng }
}
