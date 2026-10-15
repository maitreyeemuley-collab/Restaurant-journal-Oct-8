import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/Button'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, QueryBoundary } from '../../components/StateViews'
import { Tag } from '../../components/StatusBadge'
import { useToast } from '../../components/toastContext'
import { dietaryLabel } from '../../data/constants'
import { useRepositories } from '../../data/repositoryContext'
import type { Guest } from '../../data/types'
import { useRepoQuery } from '../../data/useRepoQuery'
import { useActiveGuest } from './activeGuestContext'
import styles from './HostingPage.module.css'

export function HostingPage() {
  const { guests } = useRepositories()
  const { state, refetch } = useRepoQuery(() => guests.list(), [guests])

  return (
    <>
      <PageHeader
        title="Hosting mode"
        subtitle="Add the people you're taking out. Pick one and Discover and My Places only show spots they'll enjoy."
        actions={<ButtonLink to="/hosting/guests/new">Add a guest</ButtonLink>}
      />
      <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading guests">
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              title="No guests yet"
              action={<ButtonLink to="/hosting/guests/new">Add your first guest</ButtonLink>}
            >
              Visitors coming to town? Note what they like, what they don't, and any dietary needs.
            </EmptyState>
          ) : (
            <ul className={styles.list}>
              {list.map((guest) => (
                <li key={guest.id}>
                  <GuestCard guest={guest} />
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </>
  )
}

function GuestCard({ guest }: { guest: Guest }) {
  const { guests } = useRepositories()
  const { guestId, setGuestId } = useActiveGuest()
  const toast = useToast()
  const active = guestId === guest.id

  async function handleDelete() {
    if (!window.confirm(`Delete ${guest.name}'s profile?`)) return
    try {
      await guests.remove(guest.id)
      if (active) setGuestId(null)
      toast.show({ message: `Deleted ${guest.name}` })
    } catch (caught) {
      toast.show({ message: caught instanceof Error ? caught.message : "We couldn't delete that." })
    }
  }

  return (
    <article className={`${styles.card} ${active ? styles.active : ''}`}>
      <div className={styles.head}>
        <h2>{guest.name}</h2>
        {active ? <Tag tone="new">Hosting now</Tag> : null}
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>Likes</dt>
          <dd>{guest.likes.length ? guest.likes.join(', ') : 'Not set'}</dd>
        </div>
        <div>
          <dt>Dislikes</dt>
          <dd>{guest.dislikes.length ? guest.dislikes.join(', ') : 'Not set'}</dd>
        </div>
        <div>
          <dt>Dietary needs</dt>
          <dd>
            {guest.dietaryNeeds.length ? guest.dietaryNeeds.map(dietaryLabel).join(', ') : 'None'}
          </dd>
        </div>
      </dl>

      <div className={styles.actions}>
        {active ? (
          <>
            <ButtonLink to="/">See Discover</ButtonLink>
            <ButtonLink to="/places" variant="secondary">
              See My Places
            </ButtonLink>
            <Button variant="ghost" onClick={() => setGuestId(null)}>
              Stop filtering
            </Button>
          </>
        ) : (
          <Button
            onClick={() => setGuestId(guest.id)}
            aria-label={`Host ${guest.name}: filter places for them`}
          >
            Host {firstName(guest.name)}
          </Button>
        )}
        <Link to={`/hosting/guests/${guest.id}/edit`} className={styles.textLink}>
          Edit
        </Link>
        <Button variant="danger" size="sm" onClick={() => void handleDelete()}>
          Delete
        </Button>
      </div>
    </article>
  )
}

const firstName = (name: string): string => name.split(/[\s(]/)[0] ?? name
