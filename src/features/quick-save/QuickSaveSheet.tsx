import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { Button } from '../../components/Button'
import { Chip, ChipGroup } from '../../components/Chip'
import { SelectField, TextField } from '../../components/Fields'
import { useToast } from '../../components/toastContext'
import { NEIGHBORHOODS, PICKABLE_SOURCES } from '../../data/constants'
import { approximateLocation } from '../../data/geo'
import { useRepositories } from '../../data/repositoryContext'
import type { Neighborhood, RecommendationSource } from '../../data/types'
import styles from './QuickSaveSheet.module.css'

const DETAIL_LABELS: Record<RecommendationSource, string> = {
  friend: "Friend's name",
  instagram: 'Instagram account or post',
  rating_site: 'Which site?',
  discover: '',
  other: 'Where did you hear about it?',
}

interface QuickSaveSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * The fastest path in the app. Only the name is required: type it, press Enter, done.
 * New places always land in "Want to try".
 */
export function QuickSaveSheet({ open, onClose }: QuickSaveSheetProps) {
  const { places } = useRepositories()
  const toast = useToast()
  const nameRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [neighborhood, setNeighborhood] = useState<Neighborhood | ''>('')
  const [source, setSource] = useState<RecommendationSource | null>(null)
  const [detail, setDetail] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) nameRef.current?.focus()
  }, [open])

  function reset() {
    setName('')
    setNeighborhood('')
    setSource(null)
    setDetail('')
    setNote('')
    setError(undefined)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('What’s the place called? A name is all we need.')
      nameRef.current?.focus()
      return
    }
    setSaving(true)
    try {
      const point = neighborhood ? approximateLocation(neighborhood, trimmed) : undefined
      const place = await places.create({
        name: trimmed,
        neighborhood: neighborhood || undefined,
        recommendation: source ? { source, detail: detail.trim() || undefined } : undefined,
        note: note.trim() || undefined,
        lat: point?.lat,
        lng: point?.lng,
      })
      reset()
      onClose()
      toast.show({
        message: `Saved ${place.name} to Want to try`,
        link: { label: 'View', to: `/places/${place.id}` },
      })
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "We couldn't save that. Please try again.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Quick save">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          ref={nameRef}
          label="Place name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (error) setError(undefined)
          }}
          error={error}
          placeholder="e.g. Noodle Theory"
          autoComplete="off"
          enterKeyHint="done"
          required
        />

        <details className={styles.more}>
          <summary>Add details (optional)</summary>
          <div className={styles.moreBody}>
            <SelectField
              label="Neighborhood"
              optional
              value={neighborhood}
              onChange={(event) => setNeighborhood(event.target.value as Neighborhood | '')}
            >
              <option value="">Not sure yet</option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n.name} value={n.name}>
                  {n.name}
                </option>
              ))}
            </SelectField>

            <div>
              <p className={styles.groupLabel} id="qs-source-label">
                Who recommended it? <span className={styles.optional}>(optional)</span>
              </p>
              <div aria-labelledby="qs-source-label" role="group">
                <ChipGroup label="Recommended by">
                  {PICKABLE_SOURCES.map((s) => (
                    <Chip
                      key={s.value}
                      selected={source === s.value}
                      onToggle={() => setSource(source === s.value ? null : s.value)}
                    >
                      {s.label}
                    </Chip>
                  ))}
                </ChipGroup>
              </div>
            </div>

            {source ? (
              <TextField
                label={DETAIL_LABELS[source]}
                optional
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                autoComplete="off"
              />
            ) : null}

            <TextField
              label="Why did it catch your eye?"
              optional
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="One line is plenty"
              maxLength={140}
              autoComplete="off"
            />
          </div>
        </details>

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'Saving…' : 'Save to Want to try'}
        </Button>
      </form>
    </BottomSheet>
  )
}
