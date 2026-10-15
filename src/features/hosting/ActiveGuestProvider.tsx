import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Id } from '../../data/types'
import { useAuth } from '../../auth/authContext'
import { useRepositories } from '../../data/repositoryContext'
import { useRepoQuery } from '../../data/useRepoQuery'
import { ActiveGuestContext } from './activeGuestContext'

/** One remembered guest per signed-in person, so accounts never see each other's choice. */
const storageKeyFor = (userId: string | undefined): string =>
  `restaurant-journal:active-guest:${userId ?? 'anonymous'}`

function readStoredId(key: string): Id | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

/** "Hosting mode": remembered for the browser session, so it follows you across tabs. */
export function ActiveGuestProvider({ children }: { children: ReactNode }) {
  const { guests } = useRepositories()
  const { user } = useAuth()
  const storageKey = storageKeyFor(user?.id)
  const [guestId, setGuestIdState] = useState<Id | null>(() => readStoredId(storageKey))

  const setGuestId = useCallback(
    (id: Id | null) => {
      setGuestIdState(id)
      try {
        if (id) window.sessionStorage.setItem(storageKey, id)
        else window.sessionStorage.removeItem(storageKey)
      } catch {
        // Private mode etc.: hosting mode just won't survive a reload.
      }
    },
    [storageKey],
  )

  const { state } = useRepoQuery(
    () => (guestId ? guests.get(guestId) : Promise.resolve(null)),
    [guests, guestId],
  )

  // If the guest was deleted, quietly fall back to "no guest".
  const guest = state.status === 'success' && guestId ? state.data : null

  const value = useMemo(() => ({ guest, guestId, setGuestId }), [guest, guestId, setGuestId])
  return <ActiveGuestContext.Provider value={value}>{children}</ActiveGuestContext.Provider>
}
