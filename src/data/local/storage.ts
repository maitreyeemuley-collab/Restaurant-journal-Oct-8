import { buildSeed } from '../seed'
import type { DbShape } from '../seed'

export const STORAGE_KEY = 'restaurant-journal:v1'

/** Thrown when localStorage can't be read or written. Messages are safe to show to people. */
export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

const COLLECTIONS = ['places', 'catalog', 'visits', 'lists', 'listItems', 'guests'] as const

function isDbShape(value: unknown): value is DbShape {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return COLLECTIONS.every((key) => Array.isArray(record[key]))
}

export interface LocalDb {
  read(): DbShape
  /** Reads, lets `mutator` change the copy, then writes it back. Returns the mutator's result. */
  update<T>(mutator: (data: DbShape) => T): T
  reset(): void
}

/**
 * Everything lives under one localStorage key as one JSON document.
 * The demo data is written the first time the app runs with an empty key.
 */
export function createLocalDb(storage: Storage, now: () => Date = () => new Date()): LocalDb {
  function write(data: DbShape): void {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      throw new StorageError(
        "We couldn't save that. Your browser storage may be full. Try removing some photos.",
      )
    }
  }

  function read(): DbShape {
    let raw: string | null
    try {
      raw = storage.getItem(STORAGE_KEY)
    } catch {
      throw new StorageError("We couldn't open your saved places. Is browser storage turned off?")
    }

    if (raw === null) {
      const seed = buildSeed(now())
      write(seed)
      return seed
    }

    try {
      const parsed: unknown = JSON.parse(raw)
      if (isDbShape(parsed)) return parsed
    } catch {
      // fall through to the error below
    }
    throw new StorageError(
      'Your saved data looks damaged. You can reset the demo data to start fresh.',
    )
  }

  return {
    read,
    update(mutator) {
      const data = read()
      const result = mutator(data)
      write(data)
      return result
    },
    reset() {
      write(buildSeed(now()))
    },
  }
}
