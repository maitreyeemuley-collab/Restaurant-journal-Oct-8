-- Restaurant Journal: initial schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Then run 0002_seed_catalog.sql.
--
-- Column names are snake_case versions of the TypeScript types in src/data/types.ts.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Places Discover can suggest. Shared by everyone, read-only for signed-in users.
create table public.catalog_places (
  id              text primary key,            -- stable slug, e.g. 'cat-basil-brine'
  name            text not null,
  neighborhood    text not null,
  cuisine         text not null,
  price_level     smallint not null check (price_level between 1 and 4),
  blurb           text not null,
  tags            text[] not null default '{}',
  occasions       text[] not null default '{}',
  dietary_options text[] not null default '{}',
  is_new          boolean not null default false,
  is_trending     boolean not null default false,
  lat             double precision not null,
  lng             double precision not null,
  created_at      timestamptz not null default now()
);

-- Places a person has saved.
create table public.places (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name                  text not null check (length(trim(name)) > 0),
  neighborhood          text,
  cuisine               text,
  price_level           smallint check (price_level between 1 and 4),
  status                text not null default 'want_to_try' check (status in ('want_to_try', 'visited')),
  recommendation_source text check (recommendation_source in ('friend', 'instagram', 'rating_site', 'discover', 'other')),
  recommendation_detail text,
  catalog_id            text references public.catalog_places (id) on delete set null,
  note                  text,
  tags                  text[] not null default '{}',
  occasions             text[] not null default '{}',
  dietary_options       text[] not null default '{}',
  lat                   double precision,
  lng                   double precision,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Saving the same Discover place twice is a no-op. NULL catalog_ids never collide.
  unique (owner_id, catalog_id)
);
create index places_owner_idx on public.places (owner_id);

create table public.visits (
  id         uuid primary key default gen_random_uuid(),
  place_id   uuid not null references public.places (id) on delete cascade,
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  occasion   text,
  photo_urls text[] not null default '{}',
  visited_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index visits_owner_idx on public.visits (owner_id);
create index visits_place_idx on public.visits (place_id);

create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (length(trim(title)) > 0),
  description text,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index lists_owner_idx on public.lists (owner_id);

create table public.list_items (
  list_id    uuid not null references public.lists (id) on delete cascade,
  place_id   uuid not null references public.places (id) on delete cascade,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (list_id, place_id)
);
create index list_items_place_idx on public.list_items (place_id);

create table public.guests (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  likes         text[] not null default '{}',
  dislikes      text[] not null default '{}',
  dietary_needs text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index guests_owner_idx on public.guests (owner_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger places_updated_at before update on public.places
  for each row execute function public.set_updated_at();
create trigger lists_updated_at before update on public.lists
  for each row execute function public.set_updated_at();
create trigger guests_updated_at before update on public.guests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security: people only ever see their own rows
-- ---------------------------------------------------------------------------

alter table public.catalog_places enable row level security;
alter table public.places         enable row level security;
alter table public.visits         enable row level security;
alter table public.lists          enable row level security;
alter table public.list_items     enable row level security;
alter table public.guests         enable row level security;

create policy "catalog: signed-in users can read"
  on public.catalog_places for select to authenticated
  using (true);

create policy "places: owner full access"
  on public.places for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- A visit must belong to the person AND point at one of their own places.
create policy "visits: owner full access"
  on public.visits for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.places p
      where p.id = place_id and p.owner_id = (select auth.uid())
    )
  );

create policy "lists: owner full access"
  on public.lists for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- List items are owned through their list, and may only reference the owner's places.
create policy "list_items: owner full access"
  on public.list_items for all to authenticated
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and l.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.lists l
      where l.id = list_id and l.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.places p
      where p.id = place_id and p.owner_id = (select auth.uid())
    )
  );

create policy "guests: owner full access"
  on public.guests for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- Log a visit, flip the place to 'visited' and remember the occasion: one transaction.
-- security invoker: row-level security above still applies.
create function public.log_visit(
  p_place_id   uuid,
  p_rating     integer,
  p_occasion   text default null,
  p_photo_urls text[] default '{}',
  p_visited_at timestamptz default null
)
returns public.visits
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v public.visits;
begin
  insert into public.visits (place_id, rating, occasion, photo_urls, visited_at)
  values (
    p_place_id,
    p_rating,
    p_occasion,
    coalesce(p_photo_urls, '{}'),
    coalesce(p_visited_at, now())
  )
  returning * into v;

  update public.places
  set status = 'visited',
      occasions = case
        when p_occasion is null or p_occasion = any (occasions) then occasions
        else array_append(occasions, p_occasion)
      end
  where id = p_place_id;

  return v;
end;
$$;

revoke execute on function public.log_visit(uuid, integer, text, text[], timestamptz) from public, anon;
grant  execute on function public.log_visit(uuid, integer, text, text[], timestamptz) to authenticated;

-- Read-only view of a PUBLIC list for the shareable page. Works with no signed-in user.
-- Returns NULL when the list doesn't exist or isn't public, and only the fields below:
-- never notes, status, ratings, photos or the owner.
create function public.get_public_list(p_list_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'list', jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'description', l.description,
      'created_at', l.created_at,
      'updated_at', l.updated_at
    ),
    'places', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'neighborhood', p.neighborhood,
          'cuisine', p.cuisine,
          'price_level', p.price_level,
          'tags', to_jsonb(p.tags),
          'lat', p.lat,
          'lng', p.lng
        )
        order by li.position
      )
      from public.list_items li
      join public.places p on p.id = li.place_id
      where li.list_id = l.id
    ), '[]'::jsonb)
  )
  from public.lists l
  where l.id = p_list_id and l.is_public;
$$;

revoke execute on function public.get_public_list(uuid) from public;
grant  execute on function public.get_public_list(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: a public bucket for visit photos, one folder per user
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos: upload into your own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "photos: delete your own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
