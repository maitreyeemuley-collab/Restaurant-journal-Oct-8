import { SEED_PUBLIC_LIST_ID } from '../seed'
import { freshRepositories } from './helpers'

describe('ListRepository (localStorage)', () => {
  it('creates a list, adds places in order, and ignores duplicates', async () => {
    const repos = freshRepositories()
    const list = await repos.lists.create({ title: 'Date nights' })
    await repos.lists.addPlace(list.id, 'place-sorella')
    await repos.lists.addPlace(list.id, 'place-copper-heron')
    await repos.lists.addPlace(list.id, 'place-sorella')

    const items = await repos.lists.listItems(list.id)
    expect(items.map((i) => i.placeId)).toEqual(['place-sorella', 'place-copper-heron'])
    expect(items.map((i) => i.position)).toEqual([0, 1])
  })

  it('re-numbers positions when a place is removed', async () => {
    const repos = freshRepositories()
    const list = await repos.lists.create({ title: 'Short' })
    await repos.lists.addPlace(list.id, 'place-sorella')
    await repos.lists.addPlace(list.id, 'place-hanabi')
    await repos.lists.addPlace(list.id, 'place-mala-moon')
    await repos.lists.removePlace(list.id, 'place-sorella')
    const items = await repos.lists.listItems(list.id)
    expect(items.map((i) => [i.placeId, i.position])).toEqual([
      ['place-hanabi', 0],
      ['place-mala-moon', 1],
    ])
  })

  it('serves a public list without exposing private fields', async () => {
    const repos = freshRepositories()
    const publicList = await repos.lists.getPublic(SEED_PUBLIC_LIST_ID)
    expect(publicList).not.toBeNull()
    expect(publicList?.places.length).toBeGreaterThan(0)
    const first = publicList?.places[0]
    expect(first).toBeDefined()
    expect(first).not.toHaveProperty('note')
    expect(first).not.toHaveProperty('status')
    expect(first).not.toHaveProperty('ownerId')
  })

  it('returns null for private or missing lists', async () => {
    const repos = freshRepositories()
    const list = await repos.lists.create({ title: 'Secret', isPublic: false })
    expect(await repos.lists.getPublic(list.id)).toBeNull()
    expect(await repos.lists.getPublic('does-not-exist')).toBeNull()
    await repos.lists.update(list.id, { isPublic: true })
    expect(await repos.lists.getPublic(list.id)).not.toBeNull()
  })

  it('deleting a list deletes its items', async () => {
    const repos = freshRepositories()
    const list = await repos.lists.create({ title: 'Temp' })
    await repos.lists.addPlace(list.id, 'place-sorella')
    await repos.lists.remove(list.id)
    expect(await repos.lists.get(list.id)).toBeNull()
    expect(await repos.lists.listItems(list.id)).toEqual([])
  })
})

describe('GuestRepository (localStorage)', () => {
  it('creates, updates and removes a guest', async () => {
    const repos = freshRepositories()
    const guest = await repos.guests.create({
      name: 'Aunt Lee',
      likes: ['dim sum'],
      dietaryNeeds: ['vegetarian'],
    })
    expect(guest.dislikes).toEqual([])

    const updated = await repos.guests.update(guest.id, { dislikes: ['spicy'] })
    expect(updated.dislikes).toEqual(['spicy'])

    await repos.guests.remove(guest.id)
    expect(await repos.guests.get(guest.id)).toBeNull()
  })

  it('rejects an empty name', async () => {
    const repos = freshRepositories()
    await expect(repos.guests.create({ name: ' ' })).rejects.toThrow('name')
  })
})
