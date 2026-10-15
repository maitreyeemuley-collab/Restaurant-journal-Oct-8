import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fakeAuth } from '../test-utils'
import { AuthContext } from './authContext'
import type { AuthState } from './authContext'
import { profileToMetadata } from './SupabaseAuthProvider'
import { SignInPage } from './SignInPage'

function renderSignIn(auth: Partial<AuthState> = {}) {
  const state = fakeAuth({ status: 'signedOut', user: null, isDemo: false, ...auth })
  render(
    <AuthContext.Provider value={state}>
      <MemoryRouter initialEntries={['/sign-in']}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/" element={<p>Home screen</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
  return state
}

/** The Sign in / Create account toggle and the submit button can share a name. */
const toggle = (name: 'Sign in' | 'Create account') =>
  within(screen.getByRole('group', { name: 'Sign in or create an account' })).getByRole('button', {
    name,
  })
const submit = () => {
  const button = document.querySelector<HTMLButtonElement>('button[type=submit]')
  if (!button) throw new Error('No submit button')
  return button
}

describe('SignInPage', () => {
  it('starts on Sign in, with the toggle showing which side is active', () => {
    renderSignIn()
    expect(
      screen.getByRole('heading', { name: 'Sign in to Restaurant Journal' }),
    ).toBeInTheDocument()
    expect(toggle('Sign in')).toHaveAttribute('aria-pressed', 'true')
    expect(toggle('Create account')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument()
    expect(submit()).toHaveTextContent('Sign in')
  })

  it('signs in with the typed email and password', async () => {
    const user = userEvent.setup()
    const signIn = vi.fn().mockResolvedValue(undefined)
    renderSignIn({ signIn })

    await user.type(screen.getByLabelText('Email'), 'jessica@example.com')
    await user.type(screen.getByLabelText('Password'), 'hunter2hunter2')
    await user.click(submit())

    expect(signIn).toHaveBeenCalledWith('jessica@example.com', 'hunter2hunter2')
  })

  it('validates before calling the server', async () => {
    const user = userEvent.setup()
    const signIn = vi.fn()
    renderSignIn({ signIn })

    await user.click(submit())
    expect(await screen.findByText(/Enter your email address/)).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'x')
    await user.click(submit())
    expect(await screen.findByText(/like name@example.com/)).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('shows the friendly error when sign-in fails', async () => {
    const user = userEvent.setup()
    renderSignIn({
      signIn: vi
        .fn()
        .mockRejectedValue(
          new Error("That email and password don't match. Check them and try again."),
        ),
    })

    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(/don't match/)
  })

  it('Create account shows the full form from the design', async () => {
    const user = userEvent.setup()
    renderSignIn()

    await user.click(toggle('Create account'))
    expect(toggle('Create account')).toHaveAttribute('aria-pressed', 'true')
    for (const label of [
      'First name',
      'Last name',
      'Email',
      'Password',
      'Street address',
      'City',
      'State',
      'ZIP',
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument()
    expect(submit()).toHaveTextContent('Create account')
  })

  it('creates an account with the profile details, requiring 8+ characters', async () => {
    const user = userEvent.setup()
    const signUp = vi.fn().mockResolvedValue({ needsEmailConfirmation: false })
    renderSignIn({ signUp })

    await user.click(toggle('Create account'))
    await user.type(screen.getByLabelText('First name'), 'Jessica')
    await user.type(screen.getByLabelText('Last name'), 'Lee')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.click(submit())
    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText('Password'))
    await user.type(screen.getByLabelText('Password'), 'long-enough-password')
    await user.type(screen.getByLabelText('City'), 'Seattle')
    await user.type(screen.getByLabelText('ZIP'), '98103')
    await user.click(submit())

    expect(signUp).toHaveBeenCalledWith('new@example.com', 'long-enough-password', {
      firstName: 'Jessica',
      lastName: 'Lee',
      streetAddress: '',
      city: 'Seattle',
      state: '',
      zip: '98103',
    })
  })

  it('only needs an email and password: the profile details are optional', async () => {
    const user = userEvent.setup()
    const signUp = vi.fn().mockResolvedValue({ needsEmailConfirmation: false })
    renderSignIn({ signUp })

    await user.click(toggle('Create account'))
    await user.type(screen.getByLabelText('Email'), 'minimal@example.com')
    await user.type(screen.getByLabelText('Password'), 'long-enough-password')
    await user.click(submit())

    expect(signUp).toHaveBeenCalledTimes(1)
  })

  it('tells people to check their email when confirmation is required', async () => {
    const user = userEvent.setup()
    renderSignIn({ signUp: vi.fn().mockResolvedValue({ needsEmailConfirmation: true }) })

    await user.click(toggle('Create account'))
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'long-enough-password')
    await user.click(submit())

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    expect(screen.getByText('new@example.com')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back to sign in' }))
    expect(
      screen.getByRole('heading', { name: 'Sign in to Restaurant Journal' }),
    ).toBeInTheDocument()
  })

  it('shows and hides the password', async () => {
    const user = userEvent.setup()
    renderSignIn()
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('in demo mode shows the screen as a preview and creates nothing', async () => {
    const user = userEvent.setup()
    const signIn = vi.fn()
    renderSignIn({ status: 'signedIn', isDemo: true, signIn })

    expect(toggle('Sign in')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(/Preview/)
    expect(screen.getByRole('link', { name: 'Continue to the demo' })).toHaveAttribute('href', '/')

    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'whatever-123')
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent(/Preview only/)
    expect(signIn).not.toHaveBeenCalled()
  })

  it('moves on to the app once signed in', async () => {
    renderSignIn({ status: 'signedIn', user: { id: 'u1', displayName: 'Jess', email: 'j@x.co' } })
    await waitFor(() => expect(screen.getByText('Home screen')).toBeInTheDocument())
  })
})

describe('profileToMetadata', () => {
  it('maps profile fields to snake_case keys and drops empty ones', () => {
    expect(
      profileToMetadata({ firstName: ' Jessica ', lastName: '', city: 'Seattle', zip: '98103' }),
    ).toEqual({ first_name: 'Jessica', city: 'Seattle', zip: '98103' })
  })

  it('returns an empty object when there is no profile', () => {
    expect(profileToMetadata()).toEqual({})
    expect(profileToMetadata({ firstName: '   ' })).toEqual({})
  })
})
