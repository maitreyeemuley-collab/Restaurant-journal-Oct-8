# Restaurant Journal

A mobile-first web app that helps Jessica, a Seattle food lover, **find new places to try** and **never forget a restaurant a friend mentions**. It runs in one of two modes, chosen by environment variables: **Supabase mode** (real email + password accounts, data in your Supabase project) or **local demo mode** (no sign-in, sample data in your browser's `localStorage`). Both sit behind the same small data layer, so the screens don't know which one is active.

## Run it

Requires Node 20+ (built on Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script               | What it does                                      |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Start the dev server                              |
| `npm run build`      | Type-check (`tsc -b`) and build for production    |
| `npm run preview`    | Serve the production build                        |
| `npm run lint`       | ESLint (TypeScript strict, react-hooks, jsx-a11y) |
| `npm test`           | Run the Vitest suite once                         |
| `npm run test:watch` | Vitest in watch mode                              |
| `npm run format`     | Prettier                                          |

With no `.env.local` the app runs in **local demo mode**: no sign-in, and the first run fills `localStorage` with sample Seattle data. **My Places → Reset demo data** (page footer) restores it. To use your own Supabase project, follow [Connecting Supabase](#connecting-supabase) below.

## What's in it

| Screen              | Route                       | Notes                                                                                                                                                                                                      |
| ------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discover** (home) | `/`                         | Curated places Jessica hasn't saved: New & notable, Trending, and a full list. Search plus cuisine / neighborhood / price / occasion filters. One tap on **Save** adds a place to Want to try (with Undo). |
| **Quick Save**      | floating button             | Only the place name is required. Optional: neighborhood, who recommended it, a one-line note. Lands in Want to try.                                                                                        |
| **My Places**       | `/places`                   | Saved places with status chips (All / Want to try / Visited), filters and search. Cards show cuisine, neighborhood, price, rating and who recommended it.                                                  |
| **Place detail**    | `/places/:id`               | Source of the recommendation, editable note, tags, visits with photos, Add to a list, Log a visit.                                                                                                         |
| **Log a visit**     | `/places/:id/visit`         | Photo (file picker), 1–5 star rating, optional occasion. Saving moves a Want-to-try place to Visited.                                                                                                      |
| **Map**             | `/map`                      | Leaflet + OpenStreetMap tiles (no key). Terracotta pins = Want to try, olive pins = Visited.                                                                                                               |
| **Hosting mode**    | `/hosting`                  | Guest profiles (likes, dislikes, dietary needs). Pick one and Discover and My Places hide places that clash with them and rank the rest by their likes.                                                    |
| **Lists**           | `/lists`, `/lists/:id/edit` | Create lists and add places.                                                                                                                                                                               |
| **Public list**     | `/lists/:id`                | Read-only page that works without signing in. Includes a **Copy link** button.                                                                                                                             |

Not in this version (by design): dish-level notes, following friends, reservations, a personalized feed, payments, password reset, and social login.

### Decisions I made where the brief was open

- **Discover is a curated, static catalog**, not a personalized feed. The brief listed a "discovery feed" as out of scope, then made finding new places the top priority, so this is the smallest version that serves that goal.
- **Fictional restaurant names** in the seed data, so the demo never makes claims about real businesses.
- **Styling:** CSS Modules plus design tokens in `src/styles/tokens.css`.
- **Map coordinates:** there is no geocoder. A place saved with a neighborhood is pinned near that neighborhood's center; one without a neighborhood is listed under the map as "not on the map yet".
- **Hosting mode lives in a context** (remembered per signed-in person for the browser session), not a URL parameter, so it follows you between tabs.
- **Photos** are resized to about 1024px and stored as data URLs. `localStorage` holds roughly 5 MB, so many photos will fill it; the app shows a friendly error when that happens.
- **Rating is per visit.** A place card shows its most recent visit's rating.
- **Library choices:** React 19, React Router 7, Vite 8, TypeScript 6. ESLint is pinned to v9 because `eslint-plugin-jsx-a11y` doesn't support v10 yet.

## Folder structure

```
src/
  main.tsx, App.tsx, router.tsx       entry, root providers, routes
  auth/                               email + password sign-in (Supabase) or a demo user (local)
    SignInPage.tsx, RequireAuth.tsx   the sign-in screen and the route gate
    authContext.ts                    useAuth(): the only way screens read the user
  data/                               the data layer (see below)
    types.ts, constants.ts, seed.ts
    repository.ts                     interfaces: the contract screens depend on
    local/                            localStorage implementations (demo mode)
    supabase/                         Supabase implementations (client, mappers, repositories)
    RepositoryProvider.tsx            the one place implementations are chosen
  (repo root) supabase/migrations/    SQL to run in the Supabase dashboard
  (repo root) scripts/                generate-catalog-sql.ts
    repositoryContext.ts              useRepositories()
    useRepoQuery.ts, events.ts        loading/error/data hook + change bus
    __tests__/                        Vitest tests for the data layer
  components/                         small shared UI (Button, Chip, BottomSheet, ...)
  layout/                             AppShell: bottom tabs on phones, side nav >= 768px
  features/
    discover/  places/  quick-save/  visits/  map/  hosting/  lists/  shared/
  styles/                             tokens.css, global.css
```

## How the data layer works

Screens never touch `localStorage`. They call interfaces from [`src/data/repository.ts`](src/data/repository.ts):

- `PlaceRepository`: list, get, create, update, remove saved places
- `CatalogRepository`: the Discover catalog
- `VisitRepository`: `logVisit` records a visit, moves the place to Visited and adds the occasion
- `ListRepository`: lists, list items, and `getPublic` for the shareable page
- `GuestRepository`: guest profiles
- `PhotoStore`: `upload(file)` returns a URL

Every method returns a `Promise`, so a network implementation has the same shape as the local one.

```
Screen ──useRepositories()──▶ Repositories (interfaces)
                                   │
                    RepositoryProvider picks the implementation
                                   ▼
                  src/data/supabase/*  (when env vars are set)
                  src/data/local/*     (otherwise: localStorage demo)
```

- **Types** in [`src/data/types.ts`](src/data/types.ts) map onto future tables: `Place → places`, `CatalogPlace → catalog_places`, `Visit → visits`, `PlaceList → lists`, `ListItem → list_items` (join table), `Guest → guests`. Ids are strings and `createdAt` / `updatedAt` are ISO timestamps. Everything a user owns has an `ownerId`.
- **Storage:** [`local/storage.ts`](src/data/local/storage.ts) keeps everything in one JSON document under the key `restaurant-journal:v1` and seeds it on first run. Damaged data throws a friendly `StorageError`, and the error screen offers a reset.
- **Reading data in a screen:** `useRepoQuery(fetcher, deps)` returns `{ state, refetch }` where `state` is `loading`, `error` or `success`. Pair it with `<QueryBoundary>` to get loading and error views for free.
- **Live refresh:** every repository write calls `emitDataChange()` ([`events.ts`](src/data/events.ts)) and every open `useRepoQuery` refetches.
- **Public lists:** `ListRepository.getPublic(id)` returns only the fields in `PublicList` (no notes, status, ratings or owner), and `/lists/:id` is registered outside `AppShell` and never calls `useAuth()`.

## Connecting Supabase

The code is already wired. You do three things in the Supabase dashboard and one in this folder.

**1. Create the tables.** Dashboard → **SQL Editor** → **New query**. Paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and press **Run**. Then do the same with [`0002_seed_catalog.sql`](supabase/migrations/0002_seed_catalog.sql) (the 25 places on Discover). Both are safe to run once on an empty project. `0002` is generated from `src/data/seed.ts` with `npm run db:catalog`.

**2. Turn on email sign-in.** Dashboard → **Authentication** → **Sign In / Providers** → make sure **Email** is on. Then choose how new accounts start:

- **Confirm email ON** (safer): new people must click a link in an email before they can sign in. Set **Authentication → URL Configuration → Site URL** to `http://localhost:5173` (and your real address later). Supabase's built-in email sender allows only a few emails per hour, so add your own SMTP provider before real users arrive.
- **Confirm email OFF** (easier for testing): creating an account signs you in immediately.

The app handles both.

**3. Add the key.** Dashboard → **Project Settings** → **API** → copy the **anon / publishable** key. Then:

```bash
cp .env.example .env.local
# open .env.local and paste the key after VITE_SUPABASE_ANON_KEY=
npm run dev   # restart so Vite picks up the new variables
```

Only the anon key goes in the app. Never use the `service_role` key: anything with a `VITE_` prefix is sent to every visitor's browser. Your data stays private because of the row-level security policies in the migration, not because the key is secret.

### How it fits together

| Piece                                                   | Where                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Client (reads the two env vars; `null` means demo mode) | [`src/data/supabase/client.ts`](src/data/supabase/client.ts)                                                                          |
| One implementation per interface                        | [`src/data/supabase/`](src/data/supabase) (`places`, `catalog`, `visits`, `lists`, `guests`, `photos`)                                |
| Row ⇄ domain conversion (snake_case, nulls)             | [`mappers.ts`](src/data/supabase/mappers.ts), unit tested                                                                             |
| Friendly database errors                                | [`errors.ts`](src/data/supabase/errors.ts)                                                                                            |
| Picks Supabase vs local                                 | [`RepositoryProvider.tsx`](src/data/RepositoryProvider.tsx) and [`AuthProvider.tsx`](src/auth/AuthProvider.tsx)                       |
| Sign-in screen, gate, friendly auth errors              | [`SignInPage.tsx`](src/auth/SignInPage.tsx), [`RequireAuth.tsx`](src/auth/RequireAuth.tsx), [`authErrors.ts`](src/auth/authErrors.ts) |

What the database does for you:

- **Privacy:** row-level security on every table, so each signed-in person can only read and write their own rows. `owner_id` is filled in by the database (`auth.uid()`), so the app never sends it.
- **`log_visit()`** records the visit, moves the place to Visited and remembers the occasion in one transaction.
- **`get_public_list()`** powers the shareable page for signed-out visitors. It returns only the public fields of public lists: never notes, ratings, photos or the owner.
- **Photos** go to a public Storage bucket called `photos`, one folder per user. Links are unguessable, but anyone who has a photo's link can view it.
- **Saving a Discover place twice** is harmless: a unique `(owner, catalog place)` constraint plus a check in the app make it idempotent.

Things to know:

- New accounts start **empty**. The 15 sample saved places exist only in local demo mode. Discover is filled from the catalog table.
- Data from local demo mode is **not** migrated into Supabase.
- There's no "forgot password" flow yet. For now, reset a password from the Supabase dashboard (Authentication → Users).
- Without `.env.local` the app keeps running in local demo mode, which is also what the tests use.

## Tests

`npm test` runs 115 tests:

- **Data layer** (`src/data/__tests__`): seed integrity, place create / update / remove and cascades, idempotent save from Discover, persistence across instances, corrupted storage, visits flipping status, rating validation, lists and ordering, public-list privacy, guests.
- **Pure logic:** filters (`shared/filters.test.ts`), guest matching and ranking (`hosting/guestMatch.test.ts`), Discover sections (`discover/organize.test.ts`), comma-separated term parsing.
- **Supabase mapping:** row ⇄ domain conversion (including "clear this field" patches), friendly error wording, uuid guard.
- **Auth:** sign-in and sign-up flows, validation, friendly errors, show/hide password, the route gate, and error-message mapping.
- **Screens:** Quick Save and Discover's one-tap Save, via Testing Library.

- **Database rules** (`src/data/supabase/migrations.test.ts`): runs the real SQL migration files in an in-process Postgres (PGlite) and checks them as different people: accounts can't see or change each other's data, signed-out visitors see nothing private, `log_visit()` is all-or-nothing, shared lists expose only public fields, deleting a place cleans up after it, and photo uploads are limited to your own folder. Supabase's `auth` and `storage` schemas are replaced by small stand-ins in the test.

The Supabase repositories themselves (the code that calls your project over the network) and real sign-in aren't covered by automated tests, since they need your credentials. Verify them by hand once your project is connected.

## Accessibility notes

- Semantic landmarks (`nav`, `main`), a skip link, and focus moves to the page content after navigation.
- Every input has a visible label; errors use `role="alert"`. Chips are toggle buttons with `aria-pressed`; the star rating is a radio group so arrow keys and screen readers work.
- Bottom sheets use the native `<dialog>`: focus is trapped, Escape closes it and focus returns to the opener.
- Tap targets are at least 44px. Form control borders meet 3:1 contrast. Motion respects `prefers-reduced-motion`.
- Photos have alt text; the map has a legend and a list of places that aren't pinned.
