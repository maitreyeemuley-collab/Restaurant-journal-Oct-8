import { useCallback, useEffect, useState } from 'react'
import type { DependencyList } from 'react'
import { subscribeToDataChanges } from './events'

export type QueryState<T> =
  { status: 'loading' } | { status: 'error'; error: Error } | { status: 'success'; data: T }

export interface QueryResult<T> {
  state: QueryState<T>
  refetch: () => void
}

/**
 * Runs an async repository call and gives back loading / error / success.
 * It re-runs when `deps` change and whenever any repository write happens (see events.ts).
 * While re-fetching it keeps showing the previous data instead of flashing a spinner.
 */
export function useRepoQuery<T>(fetcher: () => Promise<T>, deps: DependencyList): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>({ status: 'loading' })
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => subscribeToDataChanges(refetch), [refetch])

  useEffect(() => {
    let cancelled = false
    fetcher().then(
      (data) => {
        if (!cancelled) setState({ status: 'success', data })
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            error: error instanceof Error ? error : new Error('Something went wrong.'),
          })
        }
      },
    )
    return () => {
      cancelled = true
    }
    // `fetcher` is intentionally excluded: callers list what it depends on in `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return { state, refetch }
}
