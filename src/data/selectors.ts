import type { Id, Rating, Visit } from './types'

/** Most recent visit per place, newest `visitedAt` wins. */
export function latestVisitByPlace(visits: readonly Visit[]): Map<Id, Visit> {
  const latest = new Map<Id, Visit>()
  for (const visit of visits) {
    const current = latest.get(visit.placeId)
    if (!current || visit.visitedAt > current.visitedAt) latest.set(visit.placeId, visit)
  }
  return latest
}

export function latestRatingByPlace(visits: readonly Visit[]): Map<Id, Rating> {
  const ratings = new Map<Id, Rating>()
  for (const [placeId, visit] of latestVisitByPlace(visits)) ratings.set(placeId, visit.rating)
  return ratings
}
