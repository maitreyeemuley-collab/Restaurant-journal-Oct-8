import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fakeAuth } from '../test-utils'
import { AuthContext } from './authContext'
import type { AuthState } from './authContext'
import { RequireAuth } from './RequireAuth'

function renderGate(auth: Partial<AuthState>) {
  render(
    <AuthContext.Provider value={fakeAuth(auth)}>
      <MemoryRouter initialEntries={['/places']}>
        <Routes>
          <Route path="/sign-in" element={<p>Sign in page</p>} />
          <Route element={<RequireAuth />}>
            <Route path="/places" element={<p>Private places</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('RequireAuth', () => {
  it('shows a loading state while the session is being checked (no redirect flash)', () => {
    renderGate({ status: 'loading', user: null })
    expect(screen.getByRole('status')).toHaveTextContent(/Checking your session/)
    expect(screen.queryByText('Sign in page')).not.toBeInTheDocument()
  })

  it('redirects signed-out visitors to the sign-in page', () => {
    renderGate({ status: 'signedOut', user: null, isDemo: false })
    expect(screen.getByText('Sign in page')).toBeInTheDocument()
    expect(screen.queryByText('Private places')).not.toBeInTheDocument()
  })

  it('renders the app for signed-in people', () => {
    renderGate({ status: 'signedIn' })
    expect(screen.getByText('Private places')).toBeInTheDocument()
  })
})
