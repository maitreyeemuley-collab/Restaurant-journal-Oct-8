// @vitest-environment node
/**
 * Runs the REAL migration files (supabase/migrations/*.sql) against an in-process Postgres
 * (PGlite) and checks the database rules as different users: privacy (row-level security),
 * constraints, log_visit(), get_public_list() and cascades.
 *
 * Supabase's own `auth` and `storage` schemas don't exist in PGlite, so tiny stand-ins are
 * created below. `auth.uid()` reads the same setting Supabase uses, so the policies run
 * exactly as written.
 */
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

const migration = (name: string): string =>
  readFileSync(join(process.cwd(), 'supabase/migrations', name), 'utf8')

const SUPABASE_STANDINS = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (bucket_id text, name text);
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  insert into auth.users (id) values ('${USER_A}'), ('${USER_B}');
`

/** Supabase gives these roles table privileges by default, so RLS is the only gate under test. */
const SUPABASE_DEFAULT_GRANTS = `
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, delete on storage.objects, storage.buckets to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  grant all on all tables in schema public to anon, authenticated;
  grant execute on all functions in schema public to anon, authenticated;
`

let db: PGlite

async function as(user: 'anon' | typeof USER_A | typeof USER_B) {
  await db.exec('reset role')
  if (user === 'anon') {
    await db.exec(`select set_config('request.jwt.claim.sub', '', false); set role anon;`)
  } else {
    await db.exec(
      `select set_config('request.jwt.claim.sub', '${user}', false); set role authenticated;`,
    )
  }
}

async function one<T>(sql: string, params: unknown[] = []): Promise<T> {
  const { rows } = await db.query<T>(sql, params)
  const row = rows[0]
  if (!row) throw new Error(`No row returned for: ${sql}`)
  return row
}

const count = async (sql: string, params: unknown[] = []): Promise<number> =>
  Number((await one<{ n: string | number }>(sql, params)).n)

/** Runs a statement that must be rejected and returns the database's message. */
async function rejection(sql: string, params: unknown[] = []): Promise<string> {
  try {
    await db.query(sql, params)
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
  throw new Error(`Expected this to be rejected, but it succeeded: ${sql}`)
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STANDINS)
  await db.exec(migration('0001_init.sql'))
  await db.exec(migration('0002_seed_catalog.sql'))
  await db.exec(SUPABASE_DEFAULT_GRANTS)
})

afterAll(async () => {
  await db.close()
})

/** Each test starts from empty user data (the catalog stays). */
beforeEach(async () => {
  await db.exec('reset role')
  await db.exec(
    'truncate public.list_items, public.visits, public.lists, public.guests, public.places cascade',
  )
})

const addPlace = async (
  user: typeof USER_A | typeof USER_B,
  name: string,
  extra = '',
): Promise<string> => {
  await as(user)
  const row = await one<{ id: string }>(
    `insert into public.places (name${extra ? ', ' + extra.split('=')[0] : ''})
     values ($1${extra ? ', ' + extra.split('=')[1] : ''}) returning id`,
    [name],
  )
  return row.id
}

describe('migrations', () => {
  it('apply cleanly and seed the 25-place Discover catalog (idempotently)', async () => {
    await db.exec('reset role')
    expect(await count('select count(*) as n from public.catalog_places')).toBe(25)
    await db.exec(migration('0002_seed_catalog.sql')) // run again: no duplicates, no error
    expect(await count('select count(*) as n from public.catalog_places')).toBe(25)
  })

  it('creates the public photos bucket', async () => {
    await db.exec('reset role')
    expect(
      await one<{ public: boolean }>(`select public from storage.buckets where id = 'photos'`),
    ).toEqual({
      public: true,
    })
  })
})

describe('catalog access', () => {
  it('signed-in people can read it but not change it; signed-out visitors see nothing', async () => {
    await as(USER_A)
    expect(await count('select count(*) as n from public.catalog_places')).toBe(25)
    await rejection(`insert into public.catalog_places values ('x','x','Ballard','Thai',1,'x')`)
    const updated = await db.query(`update public.catalog_places set name = 'hacked' returning id`)
    expect(updated.rows).toHaveLength(0)

    await as('anon')
    expect(await count('select count(*) as n from public.catalog_places')).toBe(0)
  })
})

describe('privacy between accounts (row-level security)', () => {
  it("person B can't see, edit or delete person A's places", async () => {
    const placeId = await addPlace(USER_A, 'Private Pasta')

    await as(USER_B)
    expect(await count('select count(*) as n from public.places')).toBe(0)
    expect(
      (
        await db.query(`update public.places set name = 'mine now' where id = $1 returning id`, [
          placeId,
        ])
      ).rows,
    ).toHaveLength(0)
    expect(
      (await db.query(`delete from public.places where id = $1 returning id`, [placeId])).rows,
    ).toHaveLength(0)

    await as(USER_A)
    expect(await one(`select name from public.places where id = $1`, [placeId])).toEqual({
      name: 'Private Pasta',
    })
  })

  it("a person can't create a place owned by someone else", async () => {
    await as(USER_B)
    expect(
      await rejection(`insert into public.places (name, owner_id) values ('Spoof', $1)`, [USER_A]),
    ).toMatch(/row-level security/)
  })

  it('owner_id is filled in by the database from the signed-in user', async () => {
    const placeId = await addPlace(USER_A, 'Auto Owner')
    expect(await one(`select owner_id from public.places where id = $1`, [placeId])).toEqual({
      owner_id: USER_A,
    })
  })

  it('signed-out visitors can read and write none of the private tables', async () => {
    await addPlace(USER_A, 'Hidden')
    await as('anon')
    for (const table of ['places', 'visits', 'lists', 'list_items', 'guests']) {
      expect(await count(`select count(*) as n from public.${table}`)).toBe(0)
    }
    await rejection(`insert into public.places (name) values ('anon place')`)
  })

  it('guests are private to their owner', async () => {
    await as(USER_A)
    await db.query(`insert into public.guests (name, likes) values ('Aunt Lee', array['dim sum'])`)
    await as(USER_B)
    expect(await count('select count(*) as n from public.guests')).toBe(0)
  })
})

describe('places constraints', () => {
  it('saving the same Discover place twice is rejected, but different people can each save it', async () => {
    await as(USER_A)
    await db.query(
      `insert into public.places (name, catalog_id) values ('Basil & Brine', 'cat-basil-brine')`,
    )
    expect(
      await rejection(
        `insert into public.places (name, catalog_id) values ('Basil & Brine', 'cat-basil-brine')`,
      ),
    ).toMatch(/duplicate key|unique/)

    await as(USER_B)
    await db.query(
      `insert into public.places (name, catalog_id) values ('Basil & Brine', 'cat-basil-brine')`,
    )
  })

  it('allows many places without a catalog id', async () => {
    await as(USER_A)
    await db.query(`insert into public.places (name) values ('One'), ('Two'), ('Three')`)
    expect(await count('select count(*) as n from public.places')).toBe(3)
  })

  it('rejects blank names, bad prices and unknown statuses', async () => {
    await as(USER_A)
    await rejection(`insert into public.places (name) values ('   ')`)
    await rejection(`insert into public.places (name, price_level) values ('Pricey', 5)`)
    await rejection(`insert into public.places (name, status) values ('Odd', 'maybe')`)
  })

  it('new places start as want_to_try, and updated_at moves forward on edit', async () => {
    const placeId = await addPlace(USER_A, 'Trigger Test')
    await db.exec('reset role')
    await db.query(`update public.places set updated_at = '2020-01-01T00:00:00Z' where id = $1`, [
      placeId,
    ])
    await as(USER_A)
    await db.query(`update public.places set note = 'edited' where id = $1`, [placeId])
    const row = await one<{ status: string; fresh: boolean }>(
      `select status, updated_at > '2020-01-02' as fresh from public.places where id = $1`,
      [placeId],
    )
    expect(row).toEqual({ status: 'want_to_try', fresh: true })
  })
})

describe('log_visit()', () => {
  it('records the visit, moves the place to visited and remembers the occasion once', async () => {
    const placeId = await addPlace(USER_A, 'Visit Me')

    const first = await one<{ id: string; rating: number; occasion: string; photo_urls: string[] }>(
      `select * from public.log_visit($1, 4, 'friends', array['https://x/y.jpg'])`,
      [placeId],
    )
    expect(first).toMatchObject({ rating: 4, occasion: 'friends', photo_urls: ['https://x/y.jpg'] })

    await db.query(`select public.log_visit($1, 5, 'friends')`, [placeId]) // same occasion again
    const place = await one<{ status: string; occasions: string[] }>(
      `select status, occasions from public.places where id = $1`,
      [placeId],
    )
    expect(place.status).toBe('visited')
    expect(place.occasions).toEqual(['friends'])
    expect(
      await count('select count(*) as n from public.visits where place_id = $1', [placeId]),
    ).toBe(2)
  })

  it('works with only a rating', async () => {
    const placeId = await addPlace(USER_A, 'Rating Only')
    const visit = await one<{ occasion: string | null; photo_urls: string[] }>(
      `select * from public.log_visit($1, 3)`,
      [placeId],
    )
    expect(visit.occasion).toBeNull()
    expect(visit.photo_urls).toEqual([])
  })

  it('rejects ratings outside 1-5 and leaves the place untouched (all or nothing)', async () => {
    const placeId = await addPlace(USER_A, 'Bad Rating')
    await rejection(`select public.log_visit($1, 6)`, [placeId])
    await rejection(`select public.log_visit($1, 0)`, [placeId])
    expect(await one(`select status from public.places where id = $1`, [placeId])).toEqual({
      status: 'want_to_try',
    })
    expect(await count('select count(*) as n from public.visits')).toBe(0)
  })

  it("can't log a visit on someone else's place", async () => {
    const placeId = await addPlace(USER_A, 'Not Yours')
    await as(USER_B)
    await rejection(`select public.log_visit($1, 5)`, [placeId])
    await as(USER_A)
    expect(await one(`select status from public.places where id = $1`, [placeId])).toEqual({
      status: 'want_to_try',
    })
  })

  it("can't be called by signed-out visitors", async () => {
    const placeId = await addPlace(USER_A, 'Anon Test')
    await as('anon')
    await rejection(`select public.log_visit($1, 5)`, [placeId])
  })
})

describe('lists and list items', () => {
  it("a person can't put someone else's place on their list", async () => {
    const theirs = await addPlace(USER_A, 'Theirs')
    await as(USER_B)
    const list = await one<{ id: string }>(
      `insert into public.lists (title) values ('Mine') returning id`,
    )
    expect(
      await rejection(`insert into public.list_items (list_id, place_id) values ($1, $2)`, [
        list.id,
        theirs,
      ]),
    ).toMatch(/row-level security/)
  })

  it("a person can't add items to someone else's list", async () => {
    await as(USER_A)
    const list = await one<{ id: string }>(
      `insert into public.lists (title) values ('A list') returning id`,
    )
    const place = await one<{ id: string }>(
      `insert into public.places (name) values ('A place') returning id`,
    )
    await as(USER_B)
    const own = await one<{ id: string }>(
      `insert into public.places (name) values ('B place') returning id`,
    )
    await rejection(`insert into public.list_items (list_id, place_id) values ($1, $2)`, [
      list.id,
      own.id,
    ])
    expect(await count('select count(*) as n from public.list_items')).toBe(0)
    await as(USER_A)
    await db.query(`insert into public.list_items (list_id, place_id) values ($1, $2)`, [
      list.id,
      place.id,
    ])
  })

  it('the same place can only appear once per list', async () => {
    await as(USER_A)
    const list = await one<{ id: string }>(
      `insert into public.lists (title) values ('Dupes') returning id`,
    )
    const place = await one<{ id: string }>(
      `insert into public.places (name) values ('Once') returning id`,
    )
    await db.query(`insert into public.list_items (list_id, place_id) values ($1, $2)`, [
      list.id,
      place.id,
    ])
    await rejection(`insert into public.list_items (list_id, place_id) values ($1, $2)`, [
      list.id,
      place.id,
    ])
  })

  it('deleting a place removes its visits and list entries; deleting a list removes its items', async () => {
    await as(USER_A)
    const place = await one<{ id: string }>(
      `insert into public.places (name) values ('Cascade') returning id`,
    )
    const list = await one<{ id: string }>(
      `insert into public.lists (title) values ('L') returning id`,
    )
    await db.query(`insert into public.list_items (list_id, place_id) values ($1, $2)`, [
      list.id,
      place.id,
    ])
    await db.query(`select public.log_visit($1, 5)`, [place.id])

    await db.query(`delete from public.places where id = $1`, [place.id])
    expect(await count('select count(*) as n from public.visits')).toBe(0)
    expect(await count('select count(*) as n from public.list_items')).toBe(0)

    const other = await one<{ id: string }>(
      `insert into public.places (name) values ('Other') returning id`,
    )
    await db.query(`insert into public.list_items (list_id, place_id) values ($1, $2)`, [
      list.id,
      other.id,
    ])
    await db.query(`delete from public.lists where id = $1`, [list.id])
    expect(await count('select count(*) as n from public.list_items')).toBe(0)
    expect(await count('select count(*) as n from public.places')).toBe(1)
  })
})

describe('get_public_list() (the signed-out shareable page)', () => {
  async function seedList(isPublic: boolean): Promise<{ listId: string; placeIds: string[] }> {
    await as(USER_A)
    const list = await one<{ id: string }>(
      `insert into public.lists (title, description, is_public) values ('Visitors', 'First weekend', $1) returning id`,
      [isPublic],
    )
    const placeIds: string[] = []
    for (const [name, position] of [
      ['Second', 1],
      ['First', 0],
    ] as const) {
      const place = await one<{ id: string }>(
        `insert into public.places (name, neighborhood, cuisine, price_level, tags, note, recommendation_detail)
         values ($1, 'Ballard', 'Thai', 2, array['patio'], 'SECRET NOTE', 'SECRET FRIEND') returning id`,
        [name],
      )
      await db.query(`select public.log_visit($1, 5, 'friends', array['https://x/photo.jpg'])`, [
        place.id,
      ])
      await db.query(
        `insert into public.list_items (list_id, place_id, position) values ($1, $2, $3)`,
        [list.id, place.id, position],
      )
      placeIds.push(place.id)
    }
    return { listId: list.id, placeIds }
  }

  it('returns a public list to a signed-out visitor, in position order', async () => {
    const { listId } = await seedList(true)
    await as('anon')
    const { data } = await one<{ data: { list: { title: string }; places: { name: string }[] } }>(
      `select public.get_public_list($1) as data`,
      [listId],
    )
    expect(data.list.title).toBe('Visitors')
    expect(data.places.map((p) => p.name)).toEqual(['First', 'Second'])
  })

  it('exposes only public fields: never notes, status, ratings, photos, recommenders or the owner', async () => {
    const { listId } = await seedList(true)
    await as('anon')
    const { data } = await one<{ data: unknown }>(`select public.get_public_list($1) as data`, [
      listId,
    ])
    const json = JSON.stringify(data)
    for (const secret of [
      'SECRET NOTE',
      'SECRET FRIEND',
      'photo.jpg',
      'visited',
      'want_to_try',
      USER_A,
      'owner',
      'rating',
    ]) {
      expect(json).not.toContain(secret)
    }
    expect(Object.keys((data as { places: object[] }).places[0] ?? {}).sort()).toEqual([
      'cuisine',
      'id',
      'lat',
      'lng',
      'name',
      'neighborhood',
      'price_level',
      'tags',
    ])
  })

  it('returns null for private lists and for ids that do not exist', async () => {
    const { listId } = await seedList(false)
    await as('anon')
    expect(
      (await one<{ data: unknown }>(`select public.get_public_list($1) as data`, [listId])).data,
    ).toBeNull()
    expect(
      (
        await one<{ data: unknown }>(
          `select public.get_public_list('00000000-0000-4000-8000-000000000000') as data`,
        )
      ).data,
    ).toBeNull()
  })

  it('returns an empty places array for a public list with no places', async () => {
    await as(USER_A)
    const list = await one<{ id: string }>(
      `insert into public.lists (title) values ('Empty') returning id`,
    )
    await as('anon')
    const { data } = await one<{ data: { places: unknown[] } }>(
      `select public.get_public_list($1) as data`,
      [list.id],
    )
    expect(data.places).toEqual([])
  })
})

describe('photo storage policy', () => {
  it('only allows uploading into your own folder', async () => {
    await as(USER_A)
    await db.query(`insert into storage.objects (bucket_id, name) values ('photos', $1)`, [
      `${USER_A}/one.jpg`,
    ])
    expect(
      await rejection(`insert into storage.objects (bucket_id, name) values ('photos', $1)`, [
        `${USER_B}/sneaky.jpg`,
      ]),
    ).toMatch(/row-level security/)
  })
})
