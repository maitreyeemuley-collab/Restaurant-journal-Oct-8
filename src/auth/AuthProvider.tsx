/**
 * Picks the auth implementation, mirroring RepositoryProvider:
 *  - Supabase configured -> real email + password accounts (SupabaseAuthProvider)
 *  - otherwise           -> a fixed local demo user, always signed in
 *
 * Screens only ever call `useAuth()` (authContext.ts), so they don't know which one is active.
 */
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { DEMO_OWNER_ID } from '../data/constants'
import { supabase } from '../data/supabase/client'
import { AuthContext } from './authContext'
import type { AuthState } from './authContext'
import { SupabaseAuthProvider } from './SupabaseAuthProvider'

function DemoAuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AuthState>(
    () => ({
      status: 'signedIn',
      user: { id: DEMO_OWNER_ID, displayName: 'Jessica' },
      isDemo: true,
      signIn: async () => {},
      signUp: async () => ({ needsEmailConfirmation: false }),
      signOut: async () => {},
    }),
    [],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return supabase ? (
    <SupabaseAuthProvider client={supabase}>{children}</SupabaseAuthProvider>
  ) : (
    <DemoAuthProvider>{children}</DemoAuthProvider>
  )
}
