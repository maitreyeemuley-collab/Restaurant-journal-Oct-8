import { applyFilters, countActiveFilters, EMPTY_FILTERS, hasAnyFilter } from './filters'
import type { Filterable } from './filters'

interface Item extends Filterable {
  name: string
}

const items: Item[] = [
  {
    name: 'Mala & Moon',
    cuisine: 'Chinese',
    neighborhood: 'Capitol Hill',
    priceLevel: 2,
    occasions: ['friends'],
    status: 'visited',
  },
  {
    name: 'Sorella',
    cuisine: 'Italian',
    neighborhood: 'Fremont',
    priceLevel: 3,
    occasions: ['date_night'],
    status: 'visited',
  },
  {
    name: 'Casa Lupita',
    cuisine: 'Mexican',
    neighborhood: 'Ballard',
    priceLevel: 2,
    occasions: ['friends', 'date_night'],
    status: 'want_to_try',
  },
  { name: 'Mystery Spot', occasions: [], status: 'want_to_try' },
]

const run = (filters: Partial<typeof EMPTY_FILTERS>) =>
  applyFilters(items, { ...EMPTY_FILTERS, ...filters }, (item) => item.name).map((i) => i.name)

describe('applyFilters', () => {
  it('returns everything when no filter is set', () => {
    expect(run({})).toHaveLength(4)
  })

  it('filters by status', () => {
    expect(run({ status: 'want_to_try' })).toEqual(['Casa Lupita', 'Mystery Spot'])
    expect(run({ status: 'visited' })).toEqual(['Mala & Moon', 'Sorella'])
  })

  it('filters by cuisine, neighborhood and price', () => {
    expect(run({ cuisine: 'Italian' })).toEqual(['Sorella'])
    expect(run({ neighborhood: 'Ballard' })).toEqual(['Casa Lupita'])
    expect(run({ price: 2 })).toEqual(['Mala & Moon', 'Casa Lupita'])
  })

  it('filters by occasion', () => {
    expect(run({ occasion: 'date_night' })).toEqual(['Sorella', 'Casa Lupita'])
  })

  it('combines filters with AND', () => {
    expect(run({ price: 2, occasion: 'date_night' })).toEqual(['Casa Lupita'])
    expect(run({ cuisine: 'Italian', price: 2 })).toEqual([])
  })

  it('searches case-insensitively and ignores surrounding spaces', () => {
    expect(run({ query: '  LUPITA ' })).toEqual(['Casa Lupita'])
    expect(run({ query: 'zzz' })).toEqual([])
  })

  it('excludes items missing the field being filtered', () => {
    expect(run({ cuisine: 'Chinese' })).not.toContain('Mystery Spot')
  })
})

describe('filter helpers', () => {
  it('counts active filters but not search or status', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0)
    expect(
      countActiveFilters({
        ...EMPTY_FILTERS,
        query: 'x',
        status: 'visited',
        cuisine: 'Thai',
        price: 1,
      }),
    ).toBe(2)
  })

  it('knows when anything is filtered', () => {
    expect(hasAnyFilter(EMPTY_FILTERS)).toBe(false)
    expect(hasAnyFilter({ ...EMPTY_FILTERS, query: ' a' })).toBe(true)
    expect(hasAnyFilter({ ...EMPTY_FILTERS, status: 'visited' })).toBe(true)
  })
})
