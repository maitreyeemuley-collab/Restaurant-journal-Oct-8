import { createContext, useContext } from 'react'
import type { Guest, Id } from '../../data/types'

export interface ActiveGuestValue {
  /** The guest whose tastes currently filter Discover and My Places, or null. */
  guest: Guest | null
  guestId: Id | null
  setGuestId: (id: Id | null) => void
}

export const ActiveGuestContext = createContext<ActiveGuestValue | null>(null)

export function useActiveGuest(): ActiveGuestValue {
  const value = useContext(ActiveGuestContext)
  if (!value) throw new Error('useActiveGuest must be used inside <ActiveGuestProvider>')
  return value
}
