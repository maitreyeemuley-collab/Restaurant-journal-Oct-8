import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../../components/Button'
import { EmptyState, QueryBoundary } from '../../components/StateViews'
import { Tag } from '../../components/StatusBadge'
import { priceLabel } from '../../data/constants'
import { isSupabaseConfigured } from '../../data/supabase/client'
import { useRepositories } from '../../data/repositoryContext'
import { useRepoQuery } from '../../data/useRepoQuery'
import { cuisineEmoji } from '../shared/cuisine'
import { CopyLinkButton } from './CopyLinkButton'
import styles from './PublicListPage.module.css'

/**
 * Public, read-only page at /lists/:id. It sits OUTSIDE the app shell and never calls
 * useAuth(), so it works for someone who isn't signed in. It only shows the fields in
 * `PublicList` (no notes, ratings or visit status).
 */
export function PublicListPage() {
  const { id = '' } = useParams()
  const { lists } = useRepositories()
  const { state, refetch } = useRepoQuery(() => lists.getPublic(id), [lists, id])

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link to="/" className={styles.brand}>
          <span aria-hidden="true">🍴</span> Restaurant Journal
        </Link>
      </header>

      <main className={styles.main}>
        <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading list">
          {(data) =>
            data ? (
              <>
                <div className={styles.head}>
                  <title>{`${data.list.title} · Restaurant Journal`}</title>
                  <h1>{data.list.title}</h1>
                  {data.list.description ? (
                    <p className={styles.desc}>{data.list.description}</p>
                  ) : null}
                  <div className={styles.share}>
                    <CopyLinkButton listId={data.list.id} />
                    <span className={styles.count}>
                      {data.places.length} {data.places.length === 1 ? 'place' : 'places'}
                    </span>
                  </div>
                </div>

                {data.places.length === 0 ? (
                  <EmptyState title="This list is empty so far">
                    Check back soon. The person who shared it is still adding places.
                  </EmptyState>
                ) : (
                  <ol className={styles.places}>
                    {data.places.map((place, index) => (
                      <li key={place.id} className={styles.place}>
                        <span className={styles.emoji} aria-hidden="true">
                          {cuisineEmoji(place.cuisine)}
                        </span>
                        <div className={styles.body}>
                          <h2>
                            <span className="visually-hidden">{index + 1}. </span>
                            {place.name}
                          </h2>
                          <p className={styles.meta}>
                            {[place.cuisine, place.neighborhood].filter(Boolean).join(' · ')}
                            {place.priceLevel ? (
                              <>
                                {place.cuisine || place.neighborhood ? ' · ' : ''}
                                <span aria-label={`${place.priceLevel} of 4 dollar signs`}>
                                  {priceLabel(place.priceLevel)}
                                </span>
                              </>
                            ) : null}
                          </p>
                          {place.tags.length > 0 ? (
                            <div className={styles.tags}>
                              {place.tags.slice(0, 4).map((tag) => (
                                <Tag key={tag}>{tag}</Tag>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            ) : (
              <EmptyState
                title="This list isn’t available"
                action={<ButtonLink to="/">Go to Restaurant Journal</ButtonLink>}
              >
                It may be private, or the link may be wrong.
                {isSupabaseConfigured
                  ? ''
                  : ' (In this demo, links only work in the browser where the list was made.)'}
              </EmptyState>
            )
          }
        </QueryBoundary>
      </main>
    </div>
  )
}
