import type { ReactNode } from 'react'
import { useRepositories } from '../data/repositoryContext'
import type { QueryState } from '../data/useRepoQuery'
import { Button } from './Button'
import styles from './StateViews.module.css'

interface EmptyStateProps {
  title: string
  children?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className={styles.state}>
      <p className={styles.emoji} aria-hidden="true">
        🍽️
      </p>
      <h2>{title}</h2>
      {children ? <p className={styles.copy}>{children}</p> : null}
      {action}
    </div>
  )
}

interface ErrorStateProps {
  error?: Error
  onRetry?: () => void
  /** Optional escape hatch, e.g. "Reset demo data" when stored data is damaged. */
  extraAction?: ReactNode
}

export function ErrorState({ error, onRetry, extraAction }: ErrorStateProps) {
  const { resetDemoData } = useRepositories()
  // Damaged saved data can't be fixed by retrying, so offer a fresh start (demo builds only).
  const canReset = error?.name === 'StorageError' && resetDemoData !== undefined
  return (
    <div className={styles.state} role="alert">
      <p className={styles.emoji} aria-hidden="true">
        🫠
      </p>
      <h2>Something went sideways</h2>
      <p className={styles.copy}>{error?.message ?? "We couldn't load this. Please try again."}</p>
      <div className={styles.actions}>
        {onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
        {canReset ? (
          <Button variant="secondary" onClick={() => void resetDemoData?.()}>
            Reset demo data
          </Button>
        ) : null}
        {extraAction}
      </div>
    </div>
  )
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className="visually-hidden">{label}…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.skeleton} aria-hidden="true" />
      ))}
    </div>
  )
}

interface QueryBoundaryProps<T> {
  state: QueryState<T>
  onRetry?: () => void
  loadingLabel?: string
  errorExtra?: ReactNode
  children: (data: T) => ReactNode
}

/** Renders the loading and error views for you, so screens only write the happy path. */
export function QueryBoundary<T>({
  state,
  onRetry,
  loadingLabel,
  errorExtra,
  children,
}: QueryBoundaryProps<T>) {
  if (state.status === 'loading') return <LoadingState label={loadingLabel} />
  if (state.status === 'error') {
    return <ErrorState error={state.error} onRetry={onRetry} extraAction={errorExtra} />
  }
  return <>{children(state.data)}</>
}
