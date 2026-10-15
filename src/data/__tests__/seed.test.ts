import { NEIGHBORHOODS } from '../constants'
import { buildSeed } from '../seed'
import { freshRepositories } from './helpers'

describe('seed data', () => {
  const seed = buildSeed(new Date('2026-10-08T12:00:00.000Z'))

  it('covers every neighborhood in both saved places and the catalog', () => {
    for (const { name } of NEIGHBORHOODS) {
      expect(seed.places.some((p) => p.neighborhood === name)).toBe(true)
      expect(seed.catalog.some((c) => c.neighborhood === name)).toBe(true)
    }
  })

  it('has about 15 saved places with a mix of statuses', () => {
    expect(seed.places).toHaveLength(15)
    expect(seed.places.some((p) => p.status === 'visited')).toBe(true)
    expect(seed.places.some((p) => p.status === 'want_to_try')).toBe(true)
  })

  it('gives every visited place a visit, and no want-to-try place a visit', () => {
    for (const place of seed.places) {
      const visits = seed.visits.filter((v) => v.placeId === place.id)
      expect(visits.length > 0).toBe(place.status === 'visited')
    }
  })

  it('only references catalog entries that exist', () => {
    const catalogIds = new Set(seed.catalog.map((c) => c.id))
    for (const place of seed.places) {
      if (place.catalogId) expect(catalogIds.has(place.catalogId)).toBe(true)
    }
  })

  it('has unique ids', () => {
    const ids = [...seed.places, ...seed.catalog, ...seed.guests, ...seed.lists].map((x) => x.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is written to localStorage the first time the repositories are used', async () => {
    const repos = freshRepositories()
    expect(window.localStorage.getItem('restaurant-journal:v1')).toBeNull()
    const places = await repos.places.list()
    expect(places).toHaveLength(15)
    expect(window.localStorage.getItem('restaurant-journal:v1')).not.toBeNull()
  })
})
