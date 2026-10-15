import { ButtonLink } from '../components/Button'
import { EmptyState } from '../components/StateViews'

export function NotFoundPage() {
  return (
    <main style={{ padding: 'var(--space-5) var(--space-4)' }}>
      <EmptyState
        title="We couldn’t find that page"
        action={<ButtonLink to="/">Back to Discover</ButtonLink>}
      >
        The link may be old, or the page may have moved.
      </EmptyState>
    </main>
  )
}
