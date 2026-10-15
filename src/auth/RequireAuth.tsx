import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../components/StateViews'
import { useAuth } from './authContext'

/**
 * Layout route that keeps signed-out visitors out of the app. It waits for the saved session
 * to load first, so a refresh never flashes the sign-in page at someone who is signed in.
 */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div style={{ padding: 'var(--space-5) var(--space-4)' }}>
        <LoadingState label="Checking your session" />
      </div>
    )
  }
  if (status === 'signedOut') {
    return (
      <Navigate to="/sign-in" replace state={{ from: `${location.pathname}${location.search}` }} />
    )
  }
  return <Outlet />
}
