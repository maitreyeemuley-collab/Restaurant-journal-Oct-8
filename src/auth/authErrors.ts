/**
 * Friendly wording for sign-in / sign-up failures. Wrong email and wrong password share ONE
 * message on purpose, so the form never reveals which email addresses have accounts.
 */

interface AuthErrorLike {
  message?: string
  code?: string
  status?: number
  name?: string
}

export type AuthAction = 'sign-in' | 'sign-up'

export function friendlyAuthError(error: unknown, action: AuthAction): string {
  const e: AuthErrorLike = typeof error === 'object' && error !== null ? error : {}
  const message = (e.message ?? '').toLowerCase()
  const code = e.code ?? ''

  if (
    error instanceof TypeError ||
    e.name === 'AuthRetryableFetchError' ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed')
  ) {
    return "We can't reach the server. Check your connection and try again."
  }
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return "That email and password don't match. Check them and try again."
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Please confirm your email first. We sent you a link when you created your account.'
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return "There's already an account with that email. Try signing in instead."
  }
  if (code === 'weak_password' || message.includes('password should be')) {
    return 'That password is too easy to guess. Try a longer one with a mix of letters and numbers.'
  }
  if (
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    e.status === 429 ||
    message.includes('rate limit')
  ) {
    return 'Too many attempts right now. Please wait a few minutes and try again.'
  }
  if (code === 'signup_disabled' || message.includes('signups not allowed')) {
    return 'New accounts are turned off right now.'
  }
  if (code === 'email_address_invalid' || code === 'validation_failed') {
    return "That email address doesn't look right."
  }
  return action === 'sign-in'
    ? "We couldn't sign you in just now. Please try again."
    : "We couldn't create your account just now. Please try again."
}
