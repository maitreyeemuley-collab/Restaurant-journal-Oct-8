import type { CatalogPlace, Id } from '../../data/types'

/** Stable sort: places Jessica hasn't saved yet come first, already-saved ones last. */
export function unsavedFirst<T extends { item: CatalogPlace }>(
  entries: readonly T[],
  savedCatalogIds: ReadonlySet<Id>,
): T[] {
  const unsaved = entries.filter((e) => !savedCatalogIds.has(e.item.id))
  const saved = entries.filter((e) => savedCatalogIds.has(e.item.id))
  return [...unsaved, ...saved]
}

export interface DiscoverSections<T> {
  fresh: T[]
  trending: T[]
}

/** The two highlight rows. Already-saved places are left out: they aren't news to her. */
export function pickSections<T extends { item: CatalogPlace }>(
  entries: readonly T[],
  savedCatalogIds: ReadonlySet<Id>,
): DiscoverSections<T> {
  const open = entries.filter((e) => !savedCatalogIds.has(e.item.id))
  return {
    fresh: open.filter((e) => e.item.isNew),
    trending: open.filter((e) => e.item.isTrending),
  }
}
