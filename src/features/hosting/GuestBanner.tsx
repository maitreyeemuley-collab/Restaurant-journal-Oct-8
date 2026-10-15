import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { useActiveGuest } from './activeGuestContext'
import styles from './GuestBanner.module.css'

/** Shown on Discover and My Places while a guest is selected. */
export function GuestBanner() {
  const { guest, setGuestId } = useActiveGuest()
  if (!guest) return null
  return (
    <div className={styles.banner} role="status">
      <p>
        Hosting <strong>{guest.name}</strong>: showing places they'll enjoy.{' '}
        <Link to="/hosting">Edit guests</Link>
      </p>
      <Button variant="secondary" size="sm" onClick={() => setGuestId(null)}>
        Stop filtering
      </Button>
    </div>
  )
}
