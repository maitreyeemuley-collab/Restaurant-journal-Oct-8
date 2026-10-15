import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from './auth/authContext'
import type { AuthState } from './auth/authContext'
import { ToastProvider } from './components/Toast'
import { RepositoryProvider } from './data/RepositoryProvider'
import { createLocalRepositories } from './data/local/repositories'
import type { Repositories } from './data/repository'
import { ActiveGuestProvider } from './features/hosting/ActiveGuestProvider'
import { QuickSaveProvider } from './features/quick-save/QuickSaveProvider'

/** A signed-in demo user by default; override fields to test other states. */
export function fakeAuth(overrides: Partial<AuthState> = {}): AuthState {
  return {
    status: 'signedIn',
    user: { id: 'local-user', displayName: 'Jessica' },
    isDemo: true,
    signIn: async () => {},
    signUp: async () => ({ needsEmailConfirmation: false }),
    signOut: async () => {},
    ...overrides,
  }
}

/** Renders a screen with fresh seeded repositories, a router and the shared providers. */
export function renderWithApp(ui: ReactElement, route = '/') {
  window.localStorage.clear()
  window.sessionStorage.clear()
  const repositories: Repositories = createLocalRepositories()
  const view = render(
    <AuthContext.Provider value={fakeAuth()}>
      <RepositoryProvider repositories={repositories}>
        <MemoryRouter initialEntries={[route]}>
          <ToastProvider>
            <ActiveGuestProvider>
              <QuickSaveProvider>{ui}</QuickSaveProvider>
            </ActiveGuestProvider>
          </ToastProvider>
        </MemoryRouter>
      </RepositoryProvider>
    </AuthContext.Provider>,
  )
  return { ...view, repositories }
}
