import { useId } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { BookmarkIcon, CheckIcon } from '../../components/icons'
import { Tag } from '../../components/StatusBadge'
import { priceLabel } from '../../data/constants'
import type { CatalogPlace, Place } from '../../data/types'
import { cuisineEmoji } from '../shared/cuisine'
import type { GuestMatch } from '../hosting/guestMatch'
import styles from './DiscoverCard.module.css'

interface DiscoverCardProps {
  place: CatalogPlace
  /** The saved copy, if Jessica already saved this one. */
  saved: Place | undefined
  match: GuestMatch | null
  saving: boolean
  onSave: (place: CatalogPlace) => void
}

export function DiscoverCard({ place, saved, match, saving, onSave }: DiscoverCardProps) {
  // The same place can appear in several sections, so ids must be unique per card instance.
  const titleId = useId()
  return (
    <article className={`${styles.card} ${saved ? styles.saved : ''}`} aria-labelledby={titleId}>
      <div className={styles.top}>
        <span className={styles.emoji} aria-hidden="true">
          {cuisineEmoji(place.cuisine)}
        </span>
        <div className={styles.titleBlock}>
          <h3 id={titleId}>{place.name}</h3>
          <p className={styles.meta}>
            {place.cuisine} · {place.neighborhood} ·{' '}
            <span aria-label={`${place.priceLevel} of 4 dollar signs`}>
              {priceLabel(place.priceLevel)}
            </span>
          </p>
        </div>
      </div>

      <p className={styles.blurb}>{place.blurb}</p>

      <div className={styles.badges}>
        {place.isNew ? <Tag tone="new">New</Tag> : null}
        {place.isTrending ? <Tag tone="trending">Trending</Tag> : null}
        {place.tags.slice(0, 2).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      {match && match.matchedLikes.length > 0 ? (
        <p className={styles.match}>Matches: {match.matchedLikes.join(', ')}</p>
      ) : null}

      <div className={styles.footer}>
        {saved ? (
          <Link to={`/places/${saved.id}`} className={styles.savedLink}>
            <CheckIcon size={18} /> Saved · View
          </Link>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() => onSave(place)}
            aria-label={`Save ${place.name} to Want to try`}
          >
            <BookmarkIcon size={18} /> Save
          </Button>
        )}
      </div>
    </article>
  )
}
