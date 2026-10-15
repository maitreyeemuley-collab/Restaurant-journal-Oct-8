import type { PlaceStatus } from '../data/types'
import styles from './StatusBadge.module.css'

const LABELS: Record<PlaceStatus, string> = {
  want_to_try: 'Want to try',
  visited: 'Visited',
}

export function StatusBadge({ status }: { status: PlaceStatus }) {
  return (
    <span className={`${styles.badge} ${status === 'visited' ? styles.visited : styles.want}`}>
      {LABELS[status]}
    </span>
  )
}

export function Tag({
  children,
  tone = 'neutral',
}: {
  children: string
  tone?: 'neutral' | 'new' | 'trending'
}) {
  return <span className={`${styles.tag} ${styles[tone]}`}>{children}</span>
}
