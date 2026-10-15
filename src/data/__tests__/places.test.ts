import { createLocalRepositories } from '../local/repositories'
import { StorageError, STORAGE_KEY } from '../local/storage'
import { placeInputFromCatalog } from '../catalog'
import { approximateLocation } from '../geo'
import { freshRepositories } from './helpers'

describe('PlaceRepository (localStorage)', () => {
  it('creates a place as want_to_try with trimmed name and defaults', async () => {
    const repos = freshRepositories()
    const place = await repos.places.create({
      name: '  Pho Real  ',
      neighborhood: 'Fremont',
      recommendation: { source: 'friend', detail: 'Sam' },
    })
    expect(place.name).toBe('Pho Real')
    expect(place.status).toBe('want_to_try')
    expect(place.tags).toEqual([])
    expect(place.id).toBeTruthy()
    expect(place.createdAt).toBe('2026-10-08T12:00:00.000Z')
  })

  it('rejects an empty name', async () => {
    const repos = freshRepositories()
    await expect(repos.places.create({ name: '   ' })).rejects.toThrow('name')
  })

  it('persists across repository instances (a page reload)', async () => {
    const first = freshRepositories()
    const created = await first.places.create({ name: 'Persisted Place' })
    const second = createLocalRepositories()
    expect(await second.places.get(created.id)).toMatchObject({ name: 'Persisted Place' })
  })

  it('updates a place and bumps updatedAt', async () => {
    const repos = freshRepositories()
    const place = await repos.places.create({ name: 'Edit Me' })
    const later = createLocalRepositories({ now: () => new Date('2026-10-09T09:00:00.000Z') })
    const updated = await later.places.update(place.id, { note: 'Great fries' })
    expect(updated.note).toBe('Great fries')
    expect(updated.updatedAt).toBe('2026-10-09T09:00:00.000Z')
  })

  it('rejects updates to a place that does not exist', async () => {
    const repos = freshRepositories()
    await expect(repos.places.update('nope', { note: 'x' })).rejects.toThrow("couldn't find")
  })

  it('saving from Discover is idempotent and records the discover source', async () => {
    const repos = freshRepositories()
    const catalog = await repos.catalog.list()
    const candidate = catalog.find((c) => c.id === 'cat-basil-brine')
    if (!candidate) throw new Error('seed missing cat-basil-brine')

    const first = await repos.places.create(placeInputFromCatalog(candidate))
    const second = await repos.places.create(placeInputFromCatalog(candidate))

    expect(first.id).toBe(second.id)
    expect(first.recommendation).toEqual({ source: 'discover' })
    expect(first.status).toBe('want_to_try')
    expect((await repos.places.list()).filter((p) => p.catalogId === candidate.id)).toHaveLength(1)
  })

  it('removing a place also removes its visits and list entries', async () => {
    const repos = freshRepositories()
    // place-tidewater is visited and is in the seed list
    await repos.places.remove('place-tidewater')
    expect(await repos.places.get('place-tidewater')).toBeNull()
    expect((await repos.visits.listForPlace('place-tidewater')).length).toBe(0)
    const items = await repos.lists.listAllItems()
    expect(items.some((i) => i.placeId === 'place-tidewater')).toBe(false)
  })

  it('surfaces a friendly StorageError when the data is corrupted', async () => {
    const repos = freshRepositories()
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    await expect(repos.places.list()).rejects.toBeInstanceOf(StorageError)
    await repos.resetDemoData?.()
    expect(await repos.places.list()).toHaveLength(15)
  })
})

describe('approximateLocation', () => {
  it('stays close to the neighborhood and is stable for the same seed', () => {
    const a = approximateLocation('Ballard', 'Some Place')
    const b = approximateLocation('Ballard', 'Some Place')
    expect(a).toEqual(b)
    expect(a?.lat).toBeGreaterThan(47.6)
    expect(a?.lat).toBeLessThan(47.72)
  })

  it('gives different places different pins', () => {
    expect(approximateLocation('Ballard', 'A')).not.toEqual(approximateLocation('Ballard', 'B'))
  })
})
