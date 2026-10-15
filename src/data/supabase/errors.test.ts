import { friendlyMessage, isUuid, notFoundError, unwrap } from './errors'

describe('isUuid', () => {
  it('accepts uuids and rejects everything else', () => {
    expect(isUuid('9ae5d3be-5b0e-40b8-a589-17e1a8d460ee')).toBe(true)
    expect(isUuid('abc')).toBe(false)
    expect(isUuid('list-visitors')).toBe(false)
    expect(isUuid('')).toBe(false)
  })
})

describe('friendlyMessage', () => {
  it('explains network failures', () => {
    expect(friendlyMessage(new TypeError('Failed to fetch'))).toMatch(/can't reach the server/)
  })

  it('maps common Postgres / PostgREST codes', () => {
    expect(friendlyMessage({ code: '23505', message: 'duplicate key' })).toBe(
      'That already exists.',
    )
    expect(friendlyMessage({ code: '42501', message: 'x' })).toMatch(/permission/)
    expect(
      friendlyMessage({ message: 'new row violates row-level security policy for table "places"' }),
    ).toMatch(/permission/)
    expect(friendlyMessage({ code: 'PGRST301', message: 'JWT expired' })).toMatch(
      /session has expired/,
    )
    expect(friendlyMessage({ code: 'PGRST116', message: 'no rows' })).toMatch(/couldn't find/)
  })

  it('never leaks raw database messages', () => {
    const message = friendlyMessage({
      code: 'XX000',
      message: 'relation "secret_table" does not exist',
    })
    expect(message).not.toMatch(/secret_table/)
    expect(message).toMatch(/Something went wrong/)
  })
})

describe('unwrap', () => {
  it('returns data on success', () => {
    expect(unwrap({ data: [1, 2], error: null })).toEqual([1, 2])
  })

  it('throws a friendly RepositoryError on failure', () => {
    expect(() => unwrap({ data: null, error: { code: '23505', message: 'dup' } })).toThrow(
      'That already exists.',
    )
  })

  it('builds a not-found message naming the thing', () => {
    expect(notFoundError('list').message).toBe(
      "We couldn't find that list. It may have been removed.",
    )
  })
})
