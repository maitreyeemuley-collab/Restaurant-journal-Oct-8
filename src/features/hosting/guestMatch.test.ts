import type { Guest } from '../../data/types'
import { filterAndRankForGuest, matchGuest } from './guestMatch'

const guest = (
  overrides: Partial<Guest> = {},
): Pick<Guest, 'likes' | 'dislikes' | 'dietaryNeeds'> => ({
  likes: [],
  dislikes: [],
  dietaryNeeds: [],
  ...overrides,
})

const ramen = { cuisine: 'Ramen', tags: ['noodles', 'broth'], dietaryOptions: [] }
const oysters = {
  cuisine: 'Pacific NW',
  tags: ['seafood', 'oysters'],
  dietaryOptions: ['gluten_free' as const],
}
const veggie = {
  cuisine: 'Indian',
  tags: ['curry'],
  dietaryOptions: ['vegetarian' as const, 'vegan' as const],
}

describe('matchGuest', () => {
  it('counts liked cuisines and tags (case-insensitive)', () => {
    const match = matchGuest(ramen, guest({ likes: ['RAMEN', 'broth', 'pizza'] }))
    expect(match.matchedLikes).toEqual(['ramen', 'broth'])
    expect(match.score).toBe(2)
    expect(match.eligible).toBe(true)
  })

  it('is ineligible when a dislike matches', () => {
    const match = matchGuest(oysters, guest({ dislikes: ['seafood'] }))
    expect(match.eligible).toBe(false)
    expect(match.hitDislikes).toEqual(['seafood'])
  })

  it('is ineligible when a dietary need is not covered', () => {
    const match = matchGuest(ramen, guest({ dietaryNeeds: ['vegetarian'] }))
    expect(match.eligible).toBe(false)
    expect(match.missingDietary).toEqual(['vegetarian'])
  })

  it('needs every dietary need covered', () => {
    expect(matchGuest(veggie, guest({ dietaryNeeds: ['vegetarian', 'vegan'] })).eligible).toBe(true)
    expect(
      matchGuest(veggie, guest({ dietaryNeeds: ['vegetarian', 'gluten_free'] })).eligible,
    ).toBe(false)
  })

  it('ignores blank likes and dislikes', () => {
    const match = matchGuest(ramen, guest({ likes: ['  '], dislikes: [''] }))
    expect(match.score).toBe(0)
    expect(match.eligible).toBe(true)
  })
})

describe('filterAndRankForGuest', () => {
  const items = [ramen, oysters, veggie]

  it('returns everything untouched with no guest', () => {
    const result = filterAndRankForGuest(items, null)
    expect(result.map((r) => r.item)).toEqual(items)
    expect(result.every((r) => r.match === null)).toBe(true)
  })

  it('filters out unsuitable places and ranks by liked items', () => {
    const result = filterAndRankForGuest(
      items,
      guest({ likes: ['curry', 'vegan'], dislikes: ['seafood'] }),
    )
    expect(result.map((r) => r.item)).toEqual([veggie, ramen])
  })

  it('keeps the original order for equal scores', () => {
    const result = filterAndRankForGuest([ramen, veggie], guest())
    expect(result.map((r) => r.item)).toEqual([ramen, veggie])
  })
})
