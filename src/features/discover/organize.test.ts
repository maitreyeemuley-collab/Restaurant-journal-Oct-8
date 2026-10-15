import type { CatalogPlace } from '../../data/types'
import { pickSections, unsavedFirst } from './organize'

const make = (id: string, extra: Partial<CatalogPlace> = {}): { item: CatalogPlace } => ({
  item: {
    id,
    name: id,
    neighborhood: 'Ballard',
    cuisine: 'Thai',
    priceLevel: 2,
    blurb: '',
    tags: [],
    occasions: [],
    dietaryOptions: [],
    isNew: false,
    isTrending: false,
    lat: 0,
    lng: 0,
    createdAt: '2026-01-01T00:00:00Z',
    ...extra,
  },
})

describe('unsavedFirst', () => {
  it('moves saved places to the end and keeps the rest in order', () => {
    const entries = [make('a'), make('b'), make('c'), make('d')]
    const result = unsavedFirst(entries, new Set(['a', 'c']))
    expect(result.map((e) => e.item.id)).toEqual(['b', 'd', 'a', 'c'])
  })
})

describe('pickSections', () => {
  it('splits new and trending places and skips saved ones', () => {
    const entries = [
      make('new1', { isNew: true }),
      make('both', { isNew: true, isTrending: true }),
      make('hot', { isTrending: true }),
      make('saved-new', { isNew: true }),
      make('plain'),
    ]
    const { fresh, trending } = pickSections(entries, new Set(['saved-new']))
    expect(fresh.map((e) => e.item.id)).toEqual(['new1', 'both'])
    expect(trending.map((e) => e.item.id)).toEqual(['both', 'hot'])
  })
})
