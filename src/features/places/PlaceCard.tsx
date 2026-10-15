import { Link } from 'react-router-dom'
import { RatingStars } from '../../components/Rating'
import { StatusBadge, Tag } from '../../components/StatusBadge'
import { priceLabel } from '../../data/constants'
import type { Place, Rating } from '../../data/types'
import type { GuestMatch } from '../hosting/guestMatch'
import { cuisineEmoji } from '../shared/cuisine'
import { describeRecommendation } from '../shared/recommendation'
import styles from './PlaceCard.module.css'

interface PlaceCardProps {
  place: Place
  /** Rating from the latest visit, if she has been. */
  rating: Rating | undefined
  match: GuestMatch | null
}

export function PlaceCard({ place, rating, match }: PlaceCardProps) {
  const recommendation = describeRecommendation(place.recommendation)
  const meta = [place.cuisine, place.neighborhood].filter(Boolean).join(' · ')

  return (
    <article className={styles.card}>
      <span className={styles.emoji} aria-hidden="true">
        {cuisineEmoji(place.cuisine)}
      </span>
      <div className={styles.body}>
        <h3 className={styles.title}>
          {/* The link's ::after covers the whole card, so the entire card is tappable. */}
          <Link to={`/places/${place.id}`} className={styles.link}>
            {place.name}
          </Link>
        </h3>
        <p className={styles.meta}>
          {meta}
          {meta && place.priceLevel ? ' · ' : ''}
          {place.priceLevel ? (
            <span aria-label={`${place.priceLevel} of 4 dollar signs`}>
              {priceLabel(place.priceLevel)}
            </span>
          ) : null}
        </p>
        <div className={styles.row}>
          <StatusBadge status={place.status} />
          {place.status === 'visited' && rating ? <RatingStars value={rating} /> : null}
        </div>
        {recommendation ? <p className={styles.reco}>{recommendation}</p> : null}
        {match && match.matchedLikes.length > 0 ? (
          <p className={styles.match}>Matches: {match.matchedLikes.join(', ')}</p>
        ) : null}
        {place.tags.length > 0 ? (
          <div className={styles.tags}>
            {place.tags.slice(0, 3).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
