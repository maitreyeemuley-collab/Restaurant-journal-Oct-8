import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/Button'
import { Chip, ChipGroup } from '../../components/Chip'
import { PageHeader } from '../../components/PageHeader'
import { RatingInput } from '../../components/Rating'
import { EmptyState, QueryBoundary } from '../../components/StateViews'
import { useToast } from '../../components/toastContext'
import { OCCASIONS } from '../../data/constants'
import { useRepositories } from '../../data/repositoryContext'
import type { Occasion, Place, Rating } from '../../data/types'
import { useRepoQuery } from '../../data/useRepoQuery'
import { PhotoPicker } from './PhotoPicker'
import styles from './LogVisitPage.module.css'

export function LogVisitPage() {
  const { id = '' } = useParams()
  const { places } = useRepositories()
  const { state, refetch } = useRepoQuery(() => places.get(id), [places, id])

  return (
    <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading place">
      {(place) =>
        place ? (
          <LogVisitForm place={place} />
        ) : (
          <>
            <PageHeader title="Log a visit" backTo="/places" backLabel="My Places" />
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

/** A photo and a tap rating are enough. Dish-level notes are not part of this version. */
function LogVisitForm({ place }: { place: Place }) {
  const { visits } = useRepositories()
  const toast = useToast()
  const navigate = useNavigate()

  const [photo, setPhoto] = useState<string | null>(null)
  const [rating, setRating] = useState<Rating | null>(null)
  const [occasion, setOccasion] = useState<Occasion | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!rating) {
      setError('Tap a star to rate it. That’s the only thing we need.')
      return
    }
    setSaving(true)
    setError(undefined)
    try {
      await visits.logVisit({
        placeId: place.id,
        rating,
        occasion: occasion ?? undefined,
        photoUrls: photo ? [photo] : [],
      })
      toast.show({
        message:
          place.status === 'want_to_try'
            ? `Logged! ${place.name} moved to Visited`
            : `Logged your visit to ${place.name}`,
      })
      navigate(`/places/${place.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't save that visit.")
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Log a visit"
        subtitle={place.name}
        backTo={`/places/${place.id}`}
        backLabel={place.name}
      />
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <PhotoPicker placeName={place.name} value={photo} onChange={setPhoto} />

        <RatingInput
          value={rating}
          onChange={(value) => {
            setRating(value)
            setError(undefined)
          }}
        />

        <div>
          <p className={styles.label}>
            Occasion <span className={styles.optional}>(optional)</span>
          </p>
          <ChipGroup label="Occasion">
            {OCCASIONS.map(({ value, label }) => (
              <Chip
                key={value}
                selected={occasion === value}
                onToggle={() => setOccasion(occasion === value ? null : value)}
              >
                {label}
              </Chip>
            ))}
          </ChipGroup>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'Saving…' : 'Save visit'}
        </Button>
      </form>
    </>
  )
}
