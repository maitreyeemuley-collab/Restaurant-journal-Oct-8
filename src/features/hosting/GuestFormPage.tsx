import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/Button'
import { Chip, ChipGroup } from '../../components/Chip'
import { TextField } from '../../components/Fields'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, QueryBoundary } from '../../components/StateViews'
import { useToast } from '../../components/toastContext'
import { DIETARY_OPTIONS } from '../../data/constants'
import { useRepositories } from '../../data/repositoryContext'
import type { DietaryOption, Guest } from '../../data/types'
import { useRepoQuery } from '../../data/useRepoQuery'
import { formatTerms, parseTerms } from './terms'
import styles from './GuestFormPage.module.css'

/** One page for both `/hosting/guests/new` and `/hosting/guests/:id/edit`. */
export function GuestFormPage() {
  const { id } = useParams()
  const { guests } = useRepositories()
  const { state, refetch } = useRepoQuery(
    () => (id ? guests.get(id) : Promise.resolve(null)),
    [guests, id],
  )

  if (!id) return <GuestForm guest={null} />

  return (
    <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading guest">
      {(guest) =>
        guest ? (
          <GuestForm guest={guest} />
        ) : (
          <>
            <PageHeader title="Edit guest" backTo="/hosting" backLabel="Hosting" />
            <EmptyState
              title="We can’t find that guest"
              action={<ButtonLink to="/hosting">Back to Hosting</ButtonLink>}
            >
              They may have been deleted.
            </EmptyState>
          </>
        )
      }
    </QueryBoundary>
  )
}

function GuestForm({ guest }: { guest: Guest | null }) {
  const { guests } = useRepositories()
  const toast = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState(guest?.name ?? '')
  const [likes, setLikes] = useState(formatTerms(guest?.likes ?? []))
  const [dislikes, setDislikes] = useState(formatTerms(guest?.dislikes ?? []))
  const [needs, setNeeds] = useState<DietaryOption[]>(guest?.dietaryNeeds ?? [])
  const [nameError, setNameError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  const toggleNeed = (need: DietaryOption) =>
    setNeeds((current) =>
      current.includes(need) ? current.filter((n) => n !== need) : [...current, need],
    )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setNameError('Who is this guest? Add a name.')
      return
    }
    setSaving(true)
    setFormError(undefined)
    const values = {
      name: name.trim(),
      likes: parseTerms(likes),
      dislikes: parseTerms(dislikes),
      dietaryNeeds: needs,
    }
    try {
      if (guest) await guests.update(guest.id, values)
      else await guests.create(values)
      toast.show({ message: guest ? `Updated ${values.name}` : `Added ${values.name}` })
      navigate('/hosting')
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "We couldn't save that guest.")
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title={guest ? 'Edit guest' : 'Add a guest'}
        backTo="/hosting"
        backLabel="Hosting"
      />
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <TextField
          label="Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setNameError(undefined)
          }}
          error={nameError}
          placeholder="e.g. Aunt Lee"
          autoComplete="off"
          required
        />
        <TextField
          label="Likes"
          optional
          value={likes}
          onChange={(event) => setLikes(event.target.value)}
          hint="Separate with commas, e.g. ramen, cocktails, patio"
          autoComplete="off"
        />
        <TextField
          label="Dislikes"
          optional
          value={dislikes}
          onChange={(event) => setDislikes(event.target.value)}
          hint="Places with these are hidden, e.g. seafood, spicy"
          autoComplete="off"
        />
        <div>
          <p className={styles.label}>
            Dietary needs <span className={styles.optional}>(optional)</span>
          </p>
          <ChipGroup label="Dietary needs">
            {DIETARY_OPTIONS.map(({ value, label }) => (
              <Chip key={value} selected={needs.includes(value)} onToggle={() => toggleNeed(value)}>
                {label}
              </Chip>
            ))}
          </ChipGroup>
          <p className={styles.hint}>Only places that cover every need you pick will show up.</p>
        </div>

        {formError ? (
          <p className={styles.error} role="alert">
            {formError}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : guest ? 'Save changes' : 'Add guest'}
          </Button>
          <ButtonLink to="/hosting" variant="ghost">
            Cancel
          </ButtonLink>
        </div>
      </form>
    </>
  )
}
