import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, QueryBoundary } from '../../components/StateViews'
import { useToast } from '../../components/toastContext'
import { placeInputFromCatalog } from '../../data/catalog'
import { useRepositories } from '../../data/repositoryContext'
import type { CatalogPlace, Place } from '../../data/types'
import { useRepoQuery } from '../../data/useRepoQuery'
import { GuestBanner } from '../hosting/GuestBanner'
import { useActiveGuest } from '../hosting/activeGuestContext'
import { filterAndRankForGuest } from '../hosting/guestMatch'
import { useQuickSave } from '../quick-save/quickSaveContext'
import { applyFilters, EMPTY_FILTERS, hasAnyFilter } from '../shared/filters'
import type { FilterState } from '../shared/filters'
import { FilterBar } from '../shared/FilterBar'
import { DiscoverCard } from './DiscoverCard'
import { pickSections, unsavedFirst } from './organize'
import styles from './DiscoverPage.module.css'

export function DiscoverPage() {
  const { catalog, places } = useRepositories()
  const { guest } = useActiveGuest()
  const toast = useToast()
  const { openQuickSave } = useQuickSave()
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [savingId, setSavingId] = useState<string | null>(null)

  const { state, refetch } = useRepoQuery(async () => {
    const [catalogPlaces, savedPlaces] = await Promise.all([catalog.list(), places.list()])
    return { catalogPlaces, savedPlaces }
  }, [catalog, places])

  async function handleSave(place: CatalogPlace) {
    setSavingId(place.id)
    try {
      const saved = await places.create(placeInputFromCatalog(place))
      toast.show({
        message: `Saved ${place.name} to Want to try`,
        action: {
          label: 'Undo',
          onClick: () => {
            void places.remove(saved.id)
          },
        },
      })
    } catch (caught) {
      toast.show({
        message: caught instanceof Error ? caught.message : "We couldn't save that. Try again?",
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Discover"
        subtitle="Fresh places to try in Seattle. Tap Save and it's in your Want to try list."
      />
      <GuestBanner />
      <FilterBar
        filters={filters}
        onChange={setFilters}
        searchLabel="Search Discover"
        searchPlaceholder="Search by name, cuisine, or vibe"
      />
      <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading places to discover">
        {({ catalogPlaces, savedPlaces }) => (
          <DiscoverResults
            catalogPlaces={catalogPlaces}
            savedByCatalogId={
              new Map(savedPlaces.flatMap((p) => (p.catalogId ? [[p.catalogId, p] as const] : [])))
            }
            filters={filters}
            savingId={savingId}
            onSave={handleSave}
            onClearFilters={() => setFilters(EMPTY_FILTERS)}
            onQuickSave={openQuickSave}
            guest={guest}
          />
        )}
      </QueryBoundary>
    </>
  )
}

interface DiscoverResultsProps {
  catalogPlaces: CatalogPlace[]
  savedByCatalogId: Map<string, Place>
  filters: FilterState
  savingId: string | null
  guest: ReturnType<typeof useActiveGuest>['guest']
  onSave: (place: CatalogPlace) => void
  onClearFilters: () => void
  onQuickSave: () => void
}

function DiscoverResults({
  catalogPlaces,
  savedByCatalogId,
  filters,
  savingId,
  guest,
  onSave,
  onClearFilters,
  onQuickSave,
}: DiscoverResultsProps) {
  const savedIds = useMemo(() => new Set(savedByCatalogId.keys()), [savedByCatalogId])

  const ranked = useMemo(() => {
    const matching = applyFilters(catalogPlaces, filters, (place) =>
      [place.name, place.cuisine, place.neighborhood, place.blurb, ...place.tags].join(' '),
    )
    return unsavedFirst(filterAndRankForGuest(matching, guest), savedIds)
  }, [catalogPlaces, guest, filters, savedIds])

  const filtering = hasAnyFilter(filters)
  const { fresh, trending } = useMemo(() => pickSections(ranked, savedIds), [ranked, savedIds])

  const renderCard = ({ item, match }: (typeof ranked)[number]) => (
    <DiscoverCard
      key={item.id}
      place={item}
      saved={savedByCatalogId.get(item.id)}
      match={match}
      saving={savingId === item.id}
      onSave={onSave}
    />
  )

  if (ranked.length === 0) {
    return (
      <EmptyState
        title={guest ? `Nothing here suits ${guest.name} yet` : 'Nothing matches those filters'}
        action={
          <div className={styles.emptyActions}>
            {filtering ? <Button onClick={onClearFilters}>Clear filters</Button> : null}
            <Button variant="secondary" onClick={onQuickSave}>
              Save a place a friend mentioned
            </Button>
          </div>
        }
      >
        {guest
          ? 'Try stopping the guest filter, or loosen your own filters.'
          : 'Try clearing a filter or searching for something else.'}
      </EmptyState>
    )
  }

  if (filtering) {
    return (
      <section aria-labelledby="results-heading">
        <h2 id="results-heading" className={styles.sectionTitle}>
          {ranked.length} {ranked.length === 1 ? 'place' : 'places'}
        </h2>
        <div className={styles.grid}>{ranked.map(renderCard)}</div>
      </section>
    )
  }

  return (
    <div className={styles.sections}>
      {fresh.length > 0 ? (
        <section aria-labelledby="new-heading">
          <h2 id="new-heading" className={styles.sectionTitle}>
            New &amp; notable
          </h2>
          <div className={styles.row}>{fresh.map(renderCard)}</div>
        </section>
      ) : null}

      {trending.length > 0 ? (
        <section aria-labelledby="trending-heading">
          <h2 id="trending-heading" className={styles.sectionTitle}>
            Trending this month
          </h2>
          <div className={styles.row}>{trending.map(renderCard)}</div>
        </section>
      ) : null}

      <section aria-labelledby="all-heading">
        <h2 id="all-heading" className={styles.sectionTitle}>
          All of Seattle
        </h2>
        <div className={styles.grid}>{ranked.map(renderCard)}</div>
      </section>
    </div>
  )
}
