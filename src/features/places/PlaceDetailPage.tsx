import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/Button'
import { PageHeader } from '../../components/PageHeader'
import { RatingStars } from '../../components/Rating'
import { EmptyState, QueryBoundary } from '../../components/StateViews'
import { StatusBadge, Tag } from '../../components/StatusBadge'
import { TextAreaField } from '../../components/Fields'
import { useToast } from '../../components/toastContext'
import { dietaryLabel, occasionLabel, priceLabel } from '../../data/constants'
import { useRepositories } from '../../data/repositoryContext'
import type { Place, Visit } from '../../data/types'
import { useRepoQuery } from '../../data/useRepoQuery'
import { AddToListSheet } from '../lists/AddToListSheet'
import { describeRecommendation } from '../shared/recommendation'
import { formatDate } from '../shared/format'
import styles from './PlaceDetailPage.module.css'

export function PlaceDetailPage() {
  const { id = '' } = useParams()
  // Key by id so switching places resets local state (notes draft, open sheet).
  return <PlaceDetail key={id} id={id} />
}

function PlaceDetail({ id }: { id: string }) {
  const { places, visits } = useRepositories()

  const { state, refetch } = useRepoQuery(async () => {
    const [place, placeVisits] = await Promise.all([places.get(id), visits.listForPlace(id)])
    return { place, placeVisits }
  }, [places, visits, id])

  return (
    <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading place">
      {({ place, placeVisits }) =>
        place ? (
          <PlaceDetailView place={place} visits={placeVisits} />
        ) : (
          <>
            <PageHeader title="Place not found" backTo="/places" backLabel="My Places" />
            <EmptyState
              title="We can’t find that place"
              action={<ButtonLink to="/places">Back to My Places</ButtonLink>}
            >
              It may have been removed.
            </EmptyState>
          </>
        )
      }
    </QueryBoundary>
  )
}

function PlaceDetailView({ place, visits: placeVisits }: { place: Place; visits: Visit[] }) {
  const { places } = useRepositories()
  const toast = useToast()
  const navigate = useNavigate()
  const [listsOpen, setListsOpen] = useState(false)
  const [note, setNote] = useState(place.note ?? '')
  const [noteError, setNoteError] = useState<string | undefined>()
  const noteChanged = note.trim() !== (place.note ?? '')
  const latest = placeVisits[0]
  const recommendation = describeRecommendation(place.recommendation)

  async function saveNote(event: FormEvent) {
    event.preventDefault()
    setNoteError(undefined)
    try {
      await places.update(place.id, { note: note.trim() || undefined })
      toast.show({ message: 'Note saved' })
    } catch (caught) {
      setNoteError(caught instanceof Error ? caught.message : "We couldn't save that note.")
    }
  }

  async function handleRemove() {
    if (!window.confirm(`Remove ${place.name} from your places? This also deletes its visits.`))
      return
    try {
      await places.remove(place.id)
      toast.show({ message: `Removed ${place.name}` })
      navigate('/places', { replace: true })
    } catch (caught) {
      toast.show({ message: caught instanceof Error ? caught.message : "We couldn't remove that." })
    }
  }

  return (
    <>
      <PageHeader title={place.name} backTo="/places" backLabel="My Places" />

      <div className={styles.summary}>
        <p className={styles.meta}>
          {[place.cuisine, place.neighborhood].filter(Boolean).join(' · ')}
          {place.priceLevel ? (
            <>
              {place.cuisine || place.neighborhood ? ' · ' : ''}
              <span aria-label={`${place.priceLevel} of 4 dollar signs`}>
                {priceLabel(place.priceLevel)}
              </span>
            </>
          ) : null}
        </p>
        <div className={styles.statusRow}>
          <StatusBadge status={place.status} />
          {latest ? <RatingStars value={latest.rating} /> : null}
        </div>
        <div className={styles.actions}>
          <ButtonLink to={`/places/${place.id}/visit`}>
            {place.status === 'visited' ? 'Log another visit' : 'Log a visit'}
          </ButtonLink>
          <Button variant="secondary" onClick={() => setListsOpen(true)}>
            Add to a list
          </Button>
        </div>
      </div>

      <div className={styles.sections}>
        <section aria-labelledby="source-heading" className={styles.card}>
          <h2 id="source-heading">Where you heard about it</h2>
          <p>{recommendation ?? 'You didn’t note where this one came from.'}</p>
        </section>

        <section aria-labelledby="notes-heading" className={styles.card}>
          <h2 id="notes-heading">Notes</h2>
          <form onSubmit={saveNote} className={styles.noteForm}>
            <TextAreaField
              label="Why it's on your list"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What to order, who to bring, what caught your eye"
              error={noteError}
            />
            <Button type="submit" variant="secondary" size="sm" disabled={!noteChanged}>
              Save note
            </Button>
          </form>
        </section>

        {place.tags.length + place.occasions.length + place.dietaryOptions.length > 0 ? (
          <section aria-labelledby="tags-heading" className={styles.card}>
            <h2 id="tags-heading">Tags</h2>
            <div className={styles.tags}>
              {place.tags.map((tag) => (
                <Tag key={`t-${tag}`}>{tag}</Tag>
              ))}
              {place.occasions.map((o) => (
                <Tag key={`o-${o}`}>{occasionLabel(o)}</Tag>
              ))}
              {place.dietaryOptions.map((d) => (
                <Tag key={`d-${d}`}>{dietaryLabel(d)}</Tag>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="visits-heading" className={styles.card}>
          <h2 id="visits-heading">Your visits</h2>
          {placeVisits.length === 0 ? (
            <p className={styles.muted}>
              No visits yet. When you go, log it with a photo and a quick rating.
            </p>
          ) : (
            <ul className={styles.visits}>
              {placeVisits.map((visit) => (
                <li key={visit.id} className={styles.visit}>
                  <div className={styles.visitHead}>
                    <RatingStars value={visit.rating} />
                    <span className={styles.muted}>{formatDate(visit.visitedAt)}</span>
                    {visit.occasion ? <Tag>{occasionLabel(visit.occasion)}</Tag> : null}
                  </div>
                  {visit.photoUrls.length > 0 ? (
                    <div className={styles.photos}>
                      {visit.photoUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Your visit to ${place.name} on ${formatDate(visit.visitedAt)}`}
                          className={styles.photo}
                        />
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div>
          <Button variant="danger" size="sm" onClick={() => void handleRemove()}>
            Remove this place
          </Button>
        </div>
      </div>

      <AddToListSheet place={place} open={listsOpen} onClose={() => setListsOpen(false)} />
    </>
  )
}
