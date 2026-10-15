import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import {
  BookmarkIcon,
  CompassIcon,
  ListIcon,
  MapIcon,
  PlusIcon,
  UsersIcon,
} from '../components/icons'
import { ToastProvider } from '../components/Toast'
import { ActiveGuestProvider } from '../features/hosting/ActiveGuestProvider'
import { QuickSaveProvider } from '../features/quick-save/QuickSaveProvider'
import { useQuickSave } from '../features/quick-save/quickSaveContext'
import styles from './AppShell.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Discover', icon: CompassIcon, end: true },
  { to: '/places', label: 'My Places', icon: BookmarkIcon, end: false },
  { to: '/map', label: 'Map', icon: MapIcon, end: false },
  { to: '/hosting', label: 'Hosting', icon: UsersIcon, end: false },
  { to: '/lists', label: 'Lists', icon: ListIcon, end: false },
] as const

function QuickSaveButton() {
  const { openQuickSave } = useQuickSave()
  return (
    <button
      type="button"
      className={styles.fab}
      onClick={openQuickSave}
      aria-label="Quick save a place"
    >
      <PlusIcon size={26} />
      <span className={styles.fabLabel} aria-hidden="true">
        Quick save
      </span>
    </button>
  )
}

/**
 * Phones: content + bottom tab bar. Tablets and desktop (>= 768px): side navigation.
 * The Quick Save button floats on every screen inside the shell.
 */
export function AppShell() {
  const { user, isDemo, signOut } = useAuth()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  // Move focus to the page content after navigating, so keyboard and screen reader users
  // start at the top of the new screen instead of on the link they just used.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])
  // Focused form screens (log a visit, guest form, list editor) hide the button so it can't
  // cover their Save buttons.
  const hideQuickSave = /\/visit$|^\/hosting\/guests\/|\/edit$/.test(pathname)

  return (
    <ToastProvider>
      <ActiveGuestProvider>
        <QuickSaveProvider>
          <div className={styles.shell}>
            <a href="#main" className={styles.skip}>
              Skip to content
            </a>

            <nav className={styles.nav} aria-label="Main">
              <p className={styles.brand}>
                <span aria-hidden="true">🍴</span> Restaurant Journal
              </p>
              <ul className={styles.navList}>
                {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `${styles.link} ${isActive ? styles.active : ''}`
                      }
                    >
                      <Icon size={22} />
                      <span>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className={styles.user}>
                {isDemo ? (
                  <p>
                    {user?.displayName}
                    <span className={styles.demo}> · demo mode</span>
                  </p>
                ) : (
                  <>
                    <p className={styles.email} title={user?.email}>
                      {user?.email ?? user?.displayName}
                    </p>
                    <button type="button" className={styles.signOut} onClick={() => void signOut()}>
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </nav>

            <main id="main" ref={mainRef} className={styles.main} tabIndex={-1}>
              <Outlet />
            </main>

            {hideQuickSave ? null : <QuickSaveButton />}
          </div>
        </QuickSaveProvider>
      </ActiveGuestProvider>
    </ToastProvider>
  )
}
