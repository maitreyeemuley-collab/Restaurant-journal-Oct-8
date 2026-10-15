import { DEMO_OWNER_ID } from '../constants'
import { emitDataChange } from '../events'
import type {
  CatalogRepository,
  GuestRepository,
  ListRepository,
  PlaceRepository,
  Repositories,
  VisitRepository,
} from '../repository'
import type { Guest, Id, ListItem, Place, PlaceList, PublicList, Visit } from '../types'
import { newId } from './ids'
import { createLocalPhotoStore } from './photoStore'
import { createLocalDb } from './storage'

export interface LocalRepositoryOptions {
  storage?: Storage
  /** TODO(auth): in the Supabase version this comes from the signed-in session. */
  ownerId?: Id
  now?: () => Date
}

class NotFoundError extends Error {
  constructor(what: string) {
    super(`We couldn't find that ${what}. It may have been removed.`)
    this.name = 'NotFoundError'
  }
}

const unique = <T>(items: readonly T[]): T[] => [...new Set(items)]

export function createLocalRepositories(options: LocalRepositoryOptions = {}): Repositories {
  const storage = options.storage ?? window.localStorage
  const ownerId = options.ownerId ?? DEMO_OWNER_ID
  const now = options.now ?? (() => new Date())
  const stamp = (): string => now().toISOString()
  const db = createLocalDb(storage, now)

  /** Runs a write and tells every open screen to refresh. */
  function write<T>(mutator: Parameters<typeof db.update<T>>[0]): T {
    const result = db.update(mutator)
    emitDataChange()
    return result
  }

  const places: PlaceRepository = {
    async list() {
      return db.read().places.filter((p) => p.ownerId === ownerId)
    },
    async get(id) {
      return db.read().places.find((p) => p.id === id && p.ownerId === ownerId) ?? null
    },
    async create(input) {
      return write((data) => {
        if (input.catalogId) {
          const existing = data.places.find(
            (p) => p.catalogId === input.catalogId && p.ownerId === ownerId,
          )
          if (existing) return existing
        }
        const timestamp = stamp()
        const place: Place = {
          id: newId('place'),
          ownerId,
          name: input.name.trim(),
          neighborhood: input.neighborhood,
          cuisine: input.cuisine,
          priceLevel: input.priceLevel,
          status: 'want_to_try',
          recommendation: input.recommendation,
          note: input.note?.trim() || undefined,
          tags: input.tags ?? [],
          occasions: input.occasions ?? [],
          dietaryOptions: input.dietaryOptions ?? [],
          lat: input.lat,
          lng: input.lng,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        if (input.catalogId) place.catalogId = input.catalogId
        if (!place.name) throw new Error('A place needs a name.')
        data.places.push(place)
        return place
      })
    },
    async update(id, patch) {
      return write((data) => {
        const place = data.places.find((p) => p.id === id && p.ownerId === ownerId)
        if (!place) throw new NotFoundError('place')
        Object.assign(place, patch, { updatedAt: stamp() })
        return place
      })
    },
    async remove(id) {
      write((data) => {
        data.places = data.places.filter((p) => p.id !== id)
        data.visits = data.visits.filter((v) => v.placeId !== id)
        data.listItems = data.listItems.filter((i) => i.placeId !== id)
      })
    },
  }

  const catalog: CatalogRepository = {
    async list() {
      return db.read().catalog
    },
  }

  const visits: VisitRepository = {
    async listAll() {
      return db.read().visits.filter((v) => v.ownerId === ownerId)
    },
    async listForPlace(placeId) {
      return db
        .read()
        .visits.filter((v) => v.placeId === placeId && v.ownerId === ownerId)
        .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
    },
    async logVisit(input) {
      if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
        throw new Error('Pick a rating from 1 to 5.')
      }
      return write((data) => {
        const place = data.places.find((p) => p.id === input.placeId && p.ownerId === ownerId)
        if (!place) throw new NotFoundError('place')
        const timestamp = stamp()
        const visit: Visit = {
          id: newId('visit'),
          placeId: place.id,
          ownerId,
          rating: input.rating,
          occasion: input.occasion,
          photoUrls: input.photoUrls ?? [],
          visitedAt: input.visitedAt ?? timestamp,
          createdAt: timestamp,
        }
        data.visits.push(visit)
        place.status = 'visited'
        if (input.occasion) place.occasions = unique([...place.occasions, input.occasion])
        place.updatedAt = timestamp
        return visit
      })
    },
  }

  const lists: ListRepository = {
    async list() {
      return db
        .read()
        .lists.filter((l) => l.ownerId === ownerId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
    async get(id) {
      return db.read().lists.find((l) => l.id === id && l.ownerId === ownerId) ?? null
    },
    async create(input) {
      return write((data) => {
        const title = input.title.trim()
        if (!title) throw new Error('A list needs a title.')
        const timestamp = stamp()
        const list: PlaceList = {
          id: newId('list'),
          ownerId,
          title,
          description: input.description?.trim() || undefined,
          isPublic: input.isPublic ?? true,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        data.lists.push(list)
        return list
      })
    },
    async update(id, patch) {
      return write((data) => {
        const list = data.lists.find((l) => l.id === id && l.ownerId === ownerId)
        if (!list) throw new NotFoundError('list')
        Object.assign(list, patch, { updatedAt: stamp() })
        return list
      })
    },
    async remove(id) {
      write((data) => {
        data.lists = data.lists.filter((l) => l.id !== id)
        data.listItems = data.listItems.filter((i) => i.listId !== id)
      })
    },
    async listItems(listId) {
      return db
        .read()
        .listItems.filter((i) => i.listId === listId)
        .sort((a, b) => a.position - b.position)
    },
    async listAllItems() {
      return db.read().listItems
    },
    async addPlace(listId, placeId) {
      write((data) => {
        if (!data.lists.some((l) => l.id === listId && l.ownerId === ownerId)) {
          throw new NotFoundError('list')
        }
        if (!data.places.some((p) => p.id === placeId && p.ownerId === ownerId)) {
          throw new NotFoundError('place')
        }
        if (data.listItems.some((i) => i.listId === listId && i.placeId === placeId)) return
        const position = data.listItems.filter((i) => i.listId === listId).length
        const item: ListItem = { listId, placeId, position, createdAt: stamp() }
        data.listItems.push(item)
        const list = data.lists.find((l) => l.id === listId)
        if (list) list.updatedAt = item.createdAt
      })
    },
    async removePlace(listId, placeId) {
      write((data) => {
        data.listItems = data.listItems.filter(
          (i) => !(i.listId === listId && i.placeId === placeId),
        )
        data.listItems
          .filter((i) => i.listId === listId)
          .sort((a, b) => a.position - b.position)
          .forEach((item, index) => {
            item.position = index
          })
      })
    },
    async getPublic(id) {
      // Deliberately ignores `ownerId`: anyone with the link can read a public list.
      const data = db.read()
      const list = data.lists.find((l) => l.id === id)
      if (!list || !list.isPublic) return null
      const placesById = new Map(data.places.map((p) => [p.id, p]))
      const publicPlaces = data.listItems
        .filter((i) => i.listId === id)
        .sort((a, b) => a.position - b.position)
        .flatMap((item) => {
          const place = placesById.get(item.placeId)
          return place
            ? [
                {
                  id: place.id,
                  name: place.name,
                  neighborhood: place.neighborhood,
                  cuisine: place.cuisine,
                  priceLevel: place.priceLevel,
                  tags: place.tags,
                  lat: place.lat,
                  lng: place.lng,
                },
              ]
            : []
        })
      const result: PublicList = {
        list: {
          id: list.id,
          title: list.title,
          description: list.description,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        },
        places: publicPlaces,
      }
      return result
    },
  }

  const guests: GuestRepository = {
    async list() {
      return db.read().guests.filter((g) => g.ownerId === ownerId)
    },
    async get(id) {
      return db.read().guests.find((g) => g.id === id && g.ownerId === ownerId) ?? null
    },
    async create(input) {
      return write((data) => {
        const name = input.name.trim()
        if (!name) throw new Error('A guest needs a name.')
        const timestamp = stamp()
        const guest: Guest = {
          id: newId('guest'),
          ownerId,
          name,
          likes: input.likes ?? [],
          dislikes: input.dislikes ?? [],
          dietaryNeeds: input.dietaryNeeds ?? [],
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        data.guests.push(guest)
        return guest
      })
    },
    async update(id, patch) {
      return write((data) => {
        const guest = data.guests.find((g) => g.id === id && g.ownerId === ownerId)
        if (!guest) throw new NotFoundError('guest')
        Object.assign(guest, patch, { updatedAt: stamp() })
        return guest
      })
    },
    async remove(id) {
      write((data) => {
        data.guests = data.guests.filter((g) => g.id !== id)
      })
    },
  }

  return {
    places,
    catalog,
    visits,
    lists,
    guests,
    photos: createLocalPhotoStore(),
    async resetDemoData() {
      db.reset()
      emitDataChange()
    },
  }
}
