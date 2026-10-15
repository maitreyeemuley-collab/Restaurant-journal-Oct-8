import { useAuth } from '../auth/authContext'
import { Button } from './Button'
import styles from './DemoDataFooter.module.css'

/** Signed-in account line with Sign out. Phones have no side nav, so it lives here too. */
export function AccountFooter() {
  const { user, isDemo, signOut } = useAuth()
  if (isDemo || !user) return null
  return (
    <footer className={styles.footer}>
      <p>
        Signed in as <strong>{user.email ?? user.displayName}</strong>
      </p>
      <Button variant="secondary" size="sm" onClick={() => void signOut()}>
        Sign out
      </Button>
    </footer>
  )
}
