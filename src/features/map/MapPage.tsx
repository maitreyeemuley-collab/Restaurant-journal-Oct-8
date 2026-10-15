import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Chip, ChipGroup } from '../../components/Chip'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, QueryBoundary } from '../../components/StateViews'
import { StatusBadge } from '../../components/StatusBadge'
import { ButtonLink } from '../../components/Button'
import { priceLabel, SEATTLE_CENTER } from '../../data/constants'
import { useRepositories } from '../../data/repositoryContext'
import type { Place, PlaceStatus } from '../../data/types'
import { useRepoQuery } from '../../data/useRepoQuery'
import { pinIcon } from './pins'
import styles from './MapPage.module.css'

type Located = Place & { lat: number; lng: number }

const hasCoords = (place: Place): place is Located =>
  typeof place.lat === 'number' && typeof place.lng === 'number'

/** Zooms the map to fit whatever markers are showing. */
function FitToPlaces({ places }: { places: readonly Located[] }) {
  const map = useMap()
  useEffect(() => {
    if (places.length === 0) return
    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [map, places])
  return null
}

export function MapPage() {
  const { places } = useRepositories()
  const { state, refetch } = useRepoQuery(() => places.list(), [places])
  const [status, setStatus] = useState<PlaceStatus | null>(null)

  return (
    <>
      <PageHeader title="Map" subtitle="Where your saved places are." />
      <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading the map">
        {(saved) => <MapContent saved={saved} status={status} onStatusChange={setStatus} />}
      </QueryBoundary>
    </>
  )
}

interface MapContentProps {
  saved: Place[]
  status: PlaceStatus | null
  onStatusChange: (status: PlaceStatus | null) => void
}

function MapContent({ saved, status, onStatusChange }: MapContentProps) {
  const filtered = useMemo(
    () => saved.filter((p) => status === null || p.status === status),
    [saved, status],
  )
  const located = useMemo(() => filtered.filter(hasCoords), [filtered])
  const unlocated = useMemo(() => filtered.filter((p) => !hasCoords(p)), [filtered])

  if (saved.length === 0) {
    return (
      <EmptyState
        title="Nothing to map yet"
        action={<ButtonLink to="/">Find places on Discover</ButtonLink>}
      >
        Save a place and it will show up here as a pin.
      </EmptyState>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <ChipGroup label="Show on map">
          <Chip selected={status === null} onToggle={() => onStatusChange(null)}>
            All
          </Chip>
          <Chip
            selected={status === 'want_to_try'}
            onToggle={() => onStatusChange(status === 'want_to_try' ? null : 'want_to_try')}
          >
            Want to try
          </Chip>
          <Chip
            selected={status === 'visited'}
            onToggle={() => onStatusChange(status === 'visited' ? null : 'visited')}
          >
            Visited
          </Chip>
        </ChipGroup>
        <ul className={styles.legend} aria-label="Map legend">
          <li>
            <span className={`${styles.dot} ${styles.dotWant}`} aria-hidden="true" /> Want to try
          </li>
          <li>
            <span className={`${styles.dot} ${styles.dotVisited}`} aria-hidden="true" /> Visited
          </li>
        </ul>
      </div>

      <div className={styles.map}>
        <MapContainer
          center={[SEATTLE_CENTER.lat, SEATTLE_CENTER.lng]}
          zoom={12}
          scrollWheelZoom
          className={styles.leaflet}
          aria-label="Map of your saved places"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToPlaces places={located} />
          {located.map((place) => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={pinIcon(place.status)}
              title={`${place.name} (${place.status === 'visited' ? 'Visited' : 'Want to try'})`}
            >
              <Popup>
                <div className={styles.popup}>
                  <strong>{place.name}</strong>
                  <span>
                    {[place.cuisine, place.neighborhood].filter(Boolean).join(' · ')}
                    {place.priceLevel ? ` · ${priceLabel(place.priceLevel)}` : ''}
                  </span>
                  <StatusBadge status={place.status} />
                  <Link to={`/places/${place.id}`}>Open place</Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {located.length === 0 ? <p className={styles.note}>No pins for this filter yet.</p> : null}

      {unlocated.length > 0 ? (
        <section className={styles.unlocated} aria-labelledby="unlocated-heading">
          <h2 id="unlocated-heading">
            {unlocated.length} {unlocated.length === 1 ? 'place isn’t' : 'places aren’t'} on the map
            yet
          </h2>
          <p className={styles.note}>Add a neighborhood when you save a place and it gets a pin.</p>
          <ul>
            {unlocated.map((place) => (
              <li key={place.id}>
                <Link to={`/places/${place.id}`}>{place.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
