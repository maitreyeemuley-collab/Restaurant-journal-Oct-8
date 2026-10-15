/**
 * Tiny change bus. Repositories call `emitDataChange()` after every write and
 * `useRepoQuery` listens, so every open screen refreshes itself.
 * A Supabase version can call this after mutations too, or swap it for realtime subscriptions.
 */
type Listener = () => void

const listeners = new Set<Listener>()

export function subscribeToDataChanges(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitDataChange(): void {
  for (const listener of [...listeners]) listener()
}
