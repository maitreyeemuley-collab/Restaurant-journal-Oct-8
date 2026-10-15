import { Outlet } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RepositoryProvider } from './data/RepositoryProvider'

/** Root of the route tree: providers every page needs, public or not. */
export function App() {
  return (
    <AuthProvider>
      <RepositoryProvider>
        <Outlet />
      </RepositoryProvider>
    </AuthProvider>
  )
}
