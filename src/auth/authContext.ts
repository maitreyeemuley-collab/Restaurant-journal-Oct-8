import { createContext, useContext } from 'react'

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut'

export interface AuthUser {
  id: string
  displayName: string
  email?: string
}

/** Optional details collected on the Create account form. Stored on the account as profile data. */
export interface SignUpProfile {
  firstName?: string
  lastName?: string
  streetAddress?: string
  city?: string
  state?: string
  zip?: string
}

export interface SignUpResult {
  /** True when the project requires clicking an emailed link before the first sign-in. */
  needsEmailConfirmation: boolean
}

export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  /** True on the local demo back end, where there is no real account. */
  isDemo: boolean
  /** Rejects with an Error whose message is safe to show to people. */
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, profile?: SignUpProfile) => Promise<SignUpResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

/** The ONLY way screens should learn who is signed in. */
export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
