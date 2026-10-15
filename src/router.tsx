import { createBrowserRouter } from 'react-router-dom'
import { App } from './App'
import { RequireAuth } from './auth/RequireAuth'
import { SignInPage } from './auth/SignInPage'
import { AppShell } from './layout/AppShell'
import { NotFoundPage } from './layout/NotFoundPage'
import { DiscoverPage } from './features/discover/DiscoverPage'
import { GuestFormPage } from './features/hosting/GuestFormPage'
import { HostingPage } from './features/hosting/HostingPage'
import { ListEditorPage } from './features/lists/ListEditorPage'
import { ListsPage } from './features/lists/ListsPage'
import { PublicListPage } from './features/lists/PublicListPage'
import { MyPlacesPage } from './features/places/MyPlacesPage'
import { PlaceDetailPage } from './features/places/PlaceDetailPage'
import { LogVisitPage } from './features/visits/LogVisitPage'

/**
 * Routes. Everything inside <RequireAuth> + <AppShell> is the signed-in app.
 * Public pages live OUTSIDE the gate so they work with no user: /sign-in and /lists/:id.
 */
export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: 'sign-in', element: <SignInPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <DiscoverPage /> },
              { path: 'places', element: <MyPlacesPage /> },
              { path: 'places/:id', element: <PlaceDetailPage /> },
              { path: 'places/:id/visit', element: <LogVisitPage /> },
              {
                path: 'map',
                // Leaflet is heavy, so the map code only loads when someone opens the map.
                lazy: async () => ({ Component: (await import('./features/map/MapPage')).MapPage }),
              },
              { path: 'hosting', element: <HostingPage /> },
              { path: 'hosting/guests/new', element: <GuestFormPage /> },
              { path: 'hosting/guests/:id/edit', element: <GuestFormPage /> },
              { path: 'lists', element: <ListsPage /> },
              { path: 'lists/:id/edit', element: <ListEditorPage /> },
            ],
          },
        ],
      },
      // Public, read-only, no sign-in needed.
      { path: 'lists/:id', element: <PublicListPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
