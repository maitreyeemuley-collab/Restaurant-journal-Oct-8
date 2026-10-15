import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthField } from './AuthField'
import { useAuth } from './authContext'
import { PasswordField } from './PasswordField'
import styles from './SignInPage.module.css'

type Mode = 'sign-in' | 'sign-up'

const MIN_PASSWORD_LENGTH = 8
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

interface FieldErrors {
  email?: string
  password?: string
}

const EMPTY_PROFILE = {
  firstName: '',
  lastName: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
}

/**
 * Sign in or create an account with email + password. Public route (outside the app gate).
 * Layout follows the Figma sign-in card: a Sign in / Create account toggle above the form.
 * Sign-in redirects happen automatically when the auth status flips to "signedIn".
 */
export function SignInPage() {
  const { status, isDemo, signIn, signUp } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from
  // In demo mode everyone is "signed in" already; still show this screen so it can be previewed.
  if (status === 'signedIn' && !isDemo)
    return <Navigate to={from && from !== '/sign-in' ? from : '/'} replace />

  const isSignUp = mode === 'sign-up'
  const setField = (key: keyof typeof EMPTY_PROFILE) => (value: string) =>
    setProfile((current) => ({ ...current, [key]: value }))

  function switchMode(next: Mode) {
    setMode(next)
    setErrors({})
    setFormError(undefined)
    setConfirmEmail(null)
  }

  function validate(): FieldErrors {
    const found: FieldErrors = {}
    if (!EMAIL_PATTERN.test(email.trim()))
      found.email = 'Enter your email address, like name@example.com.'
    if (!password) found.password = 'Enter your password.'
    else if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      found.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    return found
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(undefined)
    const found = validate()
    setErrors(found)
    if (found.email || found.password) return

    if (isDemo) {
      setFormError(
        'Preview only: no account was created because the app isn’t connected to Supabase yet.',
      )
      return
    }

    setBusy(true)
    try {
      if (isSignUp) {
        const result = await signUp(email, password, profile)
        // When the project doesn't need confirmation the new account is signed in already and
        // the redirect above takes over. Otherwise tell them to check their inbox.
        if (result.needsEmailConfirmation) setConfirmEmail(email.trim())
      } else {
        await signIn(email, password)
      }
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : 'Something went wrong. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  const emailField = (
    <AuthField
      label="Email"
      type="email"
      value={email}
      onChange={(event) => {
        setEmail(event.target.value)
        setErrors((current) => ({ ...current, email: undefined }))
      }}
      error={errors.email}
      autoComplete="email"
      inputMode="email"
      autoCapitalize="none"
      spellCheck={false}
      required
    />
  )

  const passwordField = (
    <PasswordField
      label="Password"
      value={password}
      onChange={(event) => {
        setPassword(event.target.value)
        setErrors((current) => ({ ...current, password: undefined }))
      }}
      error={errors.password}
      hint={isSignUp ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
      autoComplete={isSignUp ? 'new-password' : 'current-password'}
      required
    />
  )

  return (
    <main className={styles.page}>
      <title>{`${isSignUp ? 'Create account' : 'Sign in'} · Restaurant Journal`}</title>
      <div className={styles.column}>
        {isDemo ? (
          <p className={styles.demoNotice} role="note">
            <strong>Preview.</strong> Sign-in is switched off until the app is connected to
            Supabase. <Link to="/">Continue to the demo</Link>
          </p>
        ) : null}

        <div className={styles.card}>
          {confirmEmail ? (
            <div className={styles.confirm} role="status">
              <h1>Check your email</h1>
              <p>
                We sent a confirmation link to <strong>{confirmEmail}</strong>. Open it, then come
                back here and sign in.
              </p>
              <button type="button" className={styles.submit} onClick={() => switchMode('sign-in')}>
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h1 className="visually-hidden">
                {isSignUp
                  ? 'Create your Restaurant Journal account'
                  : 'Sign in to Restaurant Journal'}
              </h1>

              <div role="group" aria-label="Sign in or create an account" className={styles.tabs}>
                <button
                  type="button"
                  aria-pressed={!isSignUp}
                  className={`${styles.tab} ${!isSignUp ? styles.tabActive : ''}`}
                  onClick={() => switchMode('sign-in')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  aria-pressed={isSignUp}
                  className={`${styles.tab} ${isSignUp ? styles.tabActive : ''}`}
                  onClick={() => switchMode('sign-up')}
                >
                  Create account
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form} noValidate>
                {isSignUp ? (
                  <div className={styles.row}>
                    <AuthField
                      label="First name"
                      value={profile.firstName}
                      onChange={(event) => setField('firstName')(event.target.value)}
                      autoComplete="given-name"
                    />
                    <AuthField
                      label="Last name"
                      value={profile.lastName}
                      onChange={(event) => setField('lastName')(event.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                ) : null}

                {emailField}
                {passwordField}

                {isSignUp ? (
                  <>
                    <AuthField
                      label="Street address"
                      value={profile.streetAddress}
                      onChange={(event) => setField('streetAddress')(event.target.value)}
                      autoComplete="street-address"
                    />
                    <AuthField
                      label="City"
                      value={profile.city}
                      onChange={(event) => setField('city')(event.target.value)}
                      autoComplete="address-level2"
                    />
                    <div className={styles.row}>
                      <AuthField
                        label="State"
                        value={profile.state}
                        onChange={(event) => setField('state')(event.target.value)}
                        autoComplete="address-level1"
                      />
                      <AuthField
                        label="ZIP"
                        value={profile.zip}
                        onChange={(event) => setField('zip')(event.target.value)}
                        autoComplete="postal-code"
                        inputMode="numeric"
                      />
                    </div>
                  </>
                ) : null}

                {formError ? (
                  <p className={styles.formError} role="alert">
                    {formError}
                  </p>
                ) : null}

                <button type="submit" className={styles.submit} disabled={busy}>
                  {busy
                    ? isSignUp
                      ? 'Creating account…'
                      : 'Signing in…'
                    : isSignUp
                      ? 'Create account'
                      : 'Sign in'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
