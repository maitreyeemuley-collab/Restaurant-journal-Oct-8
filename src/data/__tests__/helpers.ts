import { createLocalRepositories } from '../local/repositories'
import type { Repositories } from '../repository'

/** Fresh, seeded repositories on an empty localStorage. */
export function freshRepositories(): Repositories {
  window.localStorage.clear()
  return createLocalRepositories({ now: () => new Date('2026-10-08T12:00:00.000Z') })
}
