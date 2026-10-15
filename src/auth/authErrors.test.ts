import { friendlyAuthError } from './authErrors'

describe('friendlyAuthError', () => {
  it('uses one message for wrong email or wrong password', () => {
    const byCode = friendlyAuthError({ code: 'invalid_credentials' }, 'sign-in')
    const byMessage = friendlyAuthError({ message: 'Invalid login credentials' }, 'sign-in')
    expect(byCode).toBe(byMessage)
    expect(byCode).toMatch(/email and password don't match/)
  })

  it('asks people to confirm their email first', () => {
    expect(friendlyAuthError({ code: 'email_not_confirmed' }, 'sign-in')).toMatch(
      /confirm your email/,
    )
  })

  it('nudges existing accounts toward signing in', () => {
    expect(friendlyAuthError({ code: 'user_already_exists' }, 'sign-up')).toMatch(/Try signing in/)
    expect(friendlyAuthError({ message: 'User already registered' }, 'sign-up')).toMatch(
      /signing in/,
    )
  })

  it('handles weak passwords, rate limits and a closed sign-up', () => {
    expect(friendlyAuthError({ code: 'weak_password' }, 'sign-up')).toMatch(/too easy to guess/)
    expect(friendlyAuthError({ code: 'over_email_send_rate_limit' }, 'sign-up')).toMatch(
      /Too many attempts/,
    )
    expect(friendlyAuthError({ status: 429 }, 'sign-in')).toMatch(/Too many attempts/)
    expect(friendlyAuthError({ code: 'signup_disabled' }, 'sign-up')).toMatch(/turned off/)
  })

  it('explains network problems', () => {
    expect(friendlyAuthError(new TypeError('Failed to fetch'), 'sign-in')).toMatch(
      /can't reach the server/,
    )
    expect(friendlyAuthError({ name: 'AuthRetryableFetchError' }, 'sign-in')).toMatch(
      /can't reach the server/,
    )
  })

  it('falls back to action-specific copy without leaking internals', () => {
    expect(friendlyAuthError({ message: 'boom: internal stack' }, 'sign-in')).toBe(
      "We couldn't sign you in just now. Please try again.",
    )
    expect(friendlyAuthError(null, 'sign-up')).toBe(
      "We couldn't create your account just now. Please try again.",
    )
  })
})
