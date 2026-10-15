import { useId } from 'react'
import type { Rating } from '../data/types'
import { StarIcon } from './icons'
import styles from './Rating.module.css'

const VALUES: readonly Rating[] = [1, 2, 3, 4, 5]
const WORDS: Record<Rating, string> = {
  1: 'Not for me',
  2: 'It was okay',
  3: 'Good',
  4: 'Really good',
  5: 'Loved it',
}

interface RatingInputProps {
  value: Rating | null
  onChange: (value: Rating) => void
  label?: string
}

/** Five tappable stars built on radio inputs, so arrow keys and screen readers work. */
export function RatingInput({ value, onChange, label = 'Your rating' }: RatingInputProps) {
  const name = useId()
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.stars}>
        {VALUES.map((n) => (
          <label key={n} className={styles.star}>
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="visually-hidden"
            />
            <span className={styles.icon} data-on={value !== null && n <= value}>
              <StarIcon size={34} filled={value !== null && n <= value} />
            </span>
            <span className="visually-hidden">
              {n} of 5, {WORDS[n]}
            </span>
          </label>
        ))}
      </div>
      <p className={styles.caption} aria-live="polite">
        {value ? WORDS[value] : 'Tap a star'}
      </p>
    </fieldset>
  )
}

export function RatingStars({ value }: { value: Rating }) {
  return (
    <span className={styles.display} role="img" aria-label={`${value} out of 5 stars`}>
      {VALUES.map((n) => (
        <span key={n} className={styles.displayStar} data-on={n <= value}>
          <StarIcon size={16} filled={n <= value} />
        </span>
      ))}
    </span>
  )
}
