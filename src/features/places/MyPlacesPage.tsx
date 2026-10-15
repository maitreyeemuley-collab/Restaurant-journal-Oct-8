import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { AccountFooter } from '../../components/AccountFooter'
import { DemoDataFooter } from '../../components/DemoDataFooter'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, QueryBoundary } from '../../components/StateViews'
import { latestRatingByPlace } from '../../data/selectors'
import { useRepositories } from '../../data/repositoryContext'
import { useRepoQuery } from '../../data/useRepoQuery'
import { useActiveGuest } from '../hosting/activeGuestContext'
import { GuestBanner } from '../hosting/GuestBanner'
import { filterAndRankForGuest } from '../hosting/guestMatch'
import { useQuickSave } from '../quick-save/quickSaveContext'
import { applyFilters, EMPTY_FILTERS, hasAnyFilter } from '../shared/filters'
import type { FilterState } from '../shared/filters'
import { FilterBar } from '../shared/FilterBar'
import { PlaceCard } from './PlaceCard'
import styles from './MyPlacesPage.module.css'
import { ButtonLink } from '../../components/Button'
import type { Place, Visit } from '../../data/types'

export function MyPlacesPage() {
  const { places, visits } = useRepositories()
  const { openQuickSave } = useQuickSave()
  const { guest } = useActiveGuest()
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)

  const { state, refetch } = useRepoQuery(async () => {
    const [savedPlaces, allVisits] = await Promise.all([places.list(), visits.listAll()])
    return { savedPlaces, allVisits }
  }, [places, visits])

  return (
    <>
      <PageHeader title="My Places" subtitle="Everything you've saved or visited." />
      <GuestBanner />
      <FilterBar
        filters={filters}
        onChange={setFilters}
        searchLabel="Search your places"
        searchPlaceholder="Search name, cuisine, note, or who told you"
        showStatus
      />
      <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading your places">
        {({ savedPlaces, allVisits }) => (
          <PlaceResults
            savedPlaces={savedPlaces}
            allVisits={allVisits}
            filters={filters}
            guest={guest}
            onClear={() => setFilters(EMPTY_FILTERS)}
            onQuickSave={openQuickSave}
          />
        )}
      </QueryBoundary>
      <DemoDataFooter />
      <AccountFooter />
    </>
  )
}

interface PlaceResultsProps {
  savedPlaces: Place[]
  allVisits: Visit[]
  filters: FilterState
  guest: ReturnType<typeof useActiveGuest>['guest']
  onClear: () => void
  onQuickSave: () => void
}

function PlaceResults({
  savedPlaces,
  allVisits,
  filters,
  guest,
  onClear,
  onQuickSave,
}: PlaceResultsProps) {
  const ratings = useMemo(() => latestRatingByPlace(allVisits), [allVisits])

  const results = useMemo(() => {
    // Newest saves first, then narrowed by filters, then by the hosting guest.
    const newestFirst = [...savedPlaces].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const matching = applyFilters(newestFirst, filters, (place) =>
      [
        place.name,
        place.cuisine,
        place.neighborhood,
        place.note,
        place.recommendation?.detail,
        ...place.tags,
      ]
        .filter(Boolean)
        .join(' '),
    )
    return filterAndRankForGuest(matching, guest)
  }, [savedPlaces, filters, guest])

  if (savedPlaces.length === 0) {
    return (
      <EmptyState
        title="Nothing saved yet"
        action={
          <div className={styles.actions}>
            <Button onClick={onQuickSave}>Quick save a place</Button>
            <ButtonLink to="/" variant="secondary">
              Browse Discover
            </ButtonLink>
          </div>
        }
      >
        Heard about a spot from a friend? Tap + to save it in seconds, before you forget.
      </EmptyState>
    )
  }

  if (results.length === 0) {
    return (
      <EmptyState
        title={guest ? `No saved places suit ${guest.name}` : 'No places match'}
        action={
          hasAnyFilter(filters) ? (
            <Button onClick={onClear}>Clear search and filters</Button>
          ) : (
            <ButtonLink to="/" variant="secondary">
              Find more on Discover
            </ButtonLink>
          )
        }
      >
        {guest
          ? 'Try Discover for new ideas, or stop the guest filter to see everything.'
          : 'Try a different search, or clear a filter.'}
      </EmptyState>
    )
  }

  return (
    <section aria-label="Your places">
      <p className={styles.count} aria-live="polite">
        {results.length} {results.length === 1 ? 'place' : 'places'}
      </p>
      <div className={styles.grid}>
        {results.map(({ item, match }) => (
          <PlaceCard key={item.id} place={item} rating={ratings.get(item.id)} match={match} />
        ))}
      </div>
    </section>
  )
}
