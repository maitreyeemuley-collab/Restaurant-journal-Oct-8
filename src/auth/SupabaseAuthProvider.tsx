import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { friendlyAuthError } from './authErrors'
import { AuthContext } from './authContext'
import type { AuthState, AuthUser, SignUpProfile } from './authContext'

function toAuthUser(session: Session | null): AuthUser | null {
  if (!session) return null
  const { id, email, user_metadata } = session.user
  const firstName = typeof user_metadata?.first_name === 'string' ? user_metadata.first_name : ''
  return { id, email, displayName: firstName || email?.split('@')[0] || 'You' }
}

/** Profile details become Supabase "user metadata" (snake_case keys). Empty values are left out. */
export function profileToMetadata(profile: SignUpProfile = {}): Record<string, string> {
  const entries: [string, string | undefined][] = [
    ['first_name', profile.firstName],
    ['last_name', profile.lastName],
    ['street_address', profile.streetAddress],
    ['city', profile.city],
    ['state', profile.state],
    ['zip', profile.zip],
  ]
  return Object.fromEntries(
    entries.flatMap(([key, value]) => (value?.trim() ? [[key, value.trim()]] : [])),
  )
}

interface SupabaseAuthProviderProps {
  client: SupabaseClient
  children: ReactNode
}

/** Real accounts: email + password through Supabase Auth. The session lives in the browser. */
export function SupabaseAuthProvider({ client, children }: SupabaseAuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    client.auth.getSession().then(
      ({ data }) => {
        if (!active) return
        setSession(data.session)
        setLoading(false)
      },
      () => {
        // Treat an unreadable session as "signed out" rather than a blank screen.
        if (active) setLoading(false)
      },
    )
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client])

  const signIn = useCallback<AuthState['signIn']>(
    async (email, password) => {
      try {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } catch (error) {
        throw new Error(friendlyAuthError(error, 'sign-in'))
      }
    },
    [client],
  )

  const signUp = useCallback<AuthState['signUp']>(
    async (email, password, profile) => {
      try {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { data: profileToMetadata(profile) },
        })
        if (error) throw error
        // With "Confirm email" on, an address that already has an account comes back as a user
        // with no identities instead of an error (so attackers can't probe for accounts).
        if (data.user && data.user.identities?.length === 0) {
          throw { code: 'user_already_exists' }
        }
        return { needsEmailConfirmation: data.session === null }
      } catch (error) {
        throw new Error(friendlyAuthError(error, 'sign-up'))
      }
    },
    [client],
  )

  const signOut = useCallback<AuthState['signOut']>(async () => {
    await client.auth.signOut()
  }, [client])

  const value = useMemo<AuthState>(
    () => ({
      status: loading ? 'loading' : session ? 'signedIn' : 'signedOut',
      user: toAuthUser(session),
      isDemo: false,
      signIn,
      signUp,
      signOut,
    }),
    [loading, session, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
