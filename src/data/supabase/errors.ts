/**
 * Turns database / network failures into short, friendly messages. The screens already show
 * `error.message` in their error states, so this is the only place that wording lives.
 */

interface ErrorLike {
  message?: string
  code?: string
  status?: number
  name?: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Ids from the URL are untrusted: a non-uuid would make Postgres error instead of "not found". */
export const isUuid = (value: string): boolean => UUID.test(value)

export class RepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export const notFoundError = (what: string): RepositoryError =>
  new RepositoryError(`We couldn't find that ${what}. It may have been removed.`)

export function friendlyMessage(error: unknown): string {
  const e: ErrorLike = typeof error === 'object' && error !== null ? error : {}
  const message = (e.message ?? '').toLowerCase()

  if (
    error instanceof TypeError ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed')
  ) {
    return "We can't reach the server. Check your connection and try again."
  }
  if (e.code === 'PGRST116') return "We couldn't find that. It may have been removed."
  if (e.code === '23505') return 'That already exists.'
  if (e.code === '23514') return "One of those values isn't allowed. Please check it and try again."
  if (e.code === '22P02') return "We couldn't find that. It may have been removed."
  if (
    e.code === 'PGRST301' ||
    e.code === 'PGRST303' ||
    message.includes('jwt') ||
    message.includes('not authenticated')
  ) {
    return 'Your session has expired. Please sign in again.'
  }
  if (e.code === '42501' || message.includes('row-level security')) {
    return "You don't have permission to do that. Try signing out and back in."
  }
  return 'Something went wrong on our side. Please try again.'
}

export const friendlyError = (error: unknown): RepositoryError =>
  new RepositoryError(friendlyMessage(error))

/**
 * Throws a friendly error if a Supabase call failed, otherwise returns its data.
 * The client isn't generated from the schema, so data comes back as `unknown` and each
 * repository states the row shape it expects (see rows.ts).
 */
export function unwrap(result: { data: unknown; error: unknown }): unknown {
  if (result.error) throw friendlyError(result.error)
  return result.data
}
