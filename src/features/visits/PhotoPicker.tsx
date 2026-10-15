import { useId, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Button } from '../../components/Button'
import { CameraIcon } from '../../components/icons'
import { useRepositories } from '../../data/repositoryContext'
import styles from './PhotoPicker.module.css'

interface PhotoPickerProps {
  placeName: string
  /** URL of the chosen photo, or null. */
  value: string | null
  onChange: (url: string | null) => void
}

/** A plain file picker (camera or library on phones). Photos are resized before saving. */
export function PhotoPicker({ placeName, value, onChange }: PhotoPickerProps) {
  const { photos } = useRepositories()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow choosing the same file again later
    if (!file) return
    setBusy(true)
    setError(undefined)
    try {
      onChange(await photos.upload(file))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't use that photo.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.picker}>
      <label htmlFor={inputId} className={styles.label}>
        Photo <span className={styles.optional}>(optional)</span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="visually-hidden"
        onChange={(event) => void handleFile(event)}
      />

      {value ? (
        <div className={styles.preview}>
          <img src={value} alt={`Preview of your visit to ${placeName}`} className={styles.image} />
          <div className={styles.previewActions}>
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              Choose a different photo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remove photo
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          fullWidth
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <CameraIcon size={20} />
          {busy ? 'Preparing photo…' : 'Add a photo'}
        </Button>
      )}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
