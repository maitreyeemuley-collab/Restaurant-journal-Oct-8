import type { DietaryOption, Guest } from '../../data/types'

/** Anything with a cuisine, tags and dietary options can be matched: saved or catalog places. */
export interface Matchable {
  cuisine?: string
  tags: readonly string[]
  dietaryOptions: readonly DietaryOption[]
}

export interface GuestMatch {
  /** False when the place hits a dislike or can't cover a dietary need. */
  eligible: boolean
  matchedLikes: string[]
  hitDislikes: string[]
  missingDietary: DietaryOption[]
  /** Number of liked things the place offers. Higher ranks first. */
  score: number
}

const normalize = (text: string): string => text.trim().toLowerCase()

function haystackOf(item: Matchable): string[] {
  return [item.cuisine ?? '', ...item.tags].map(normalize).filter(Boolean)
}

const termMatches = (haystack: readonly string[], term: string): boolean =>
  haystack.some((entry) => entry.includes(term))

export function matchGuest(
  item: Matchable,
  guest: Pick<Guest, 'likes' | 'dislikes' | 'dietaryNeeds'>,
): GuestMatch {
  const haystack = haystackOf(item)
  const likes = guest.likes.map(normalize).filter(Boolean)
  const dislikes = guest.dislikes.map(normalize).filter(Boolean)

  const matchedLikes = likes.filter((term) => termMatches(haystack, term))
  const hitDislikes = dislikes.filter((term) => termMatches(haystack, term))
  const missingDietary = guest.dietaryNeeds.filter((need) => !item.dietaryOptions.includes(need))

  return {
    eligible: hitDislikes.length === 0 && missingDietary.length === 0,
    matchedLikes,
    hitDislikes,
    missingDietary,
    score: matchedLikes.length,
  }
}

export interface RankedItem<T> {
  item: T
  match: GuestMatch | null
}

/**
 * With a guest: drops places that don't suit them and ranks the rest by how many of their
 * likes they offer (ties keep the original order). With no guest: returns items unchanged.
 */
export function filterAndRankForGuest<T extends Matchable>(
  items: readonly T[],
  guest: Pick<Guest, 'likes' | 'dislikes' | 'dietaryNeeds'> | null,
): RankedItem<T>[] {
  if (!guest) return items.map((item) => ({ item, match: null }))
  return items
    .map((item, index) => ({ item, match: matchGuest(item, guest), index }))
    .filter(({ match }) => match.eligible)
    .sort((a, b) => b.match.score - a.match.score || a.index - b.index)
    .map(({ item, match }) => ({ item, match }))
}
