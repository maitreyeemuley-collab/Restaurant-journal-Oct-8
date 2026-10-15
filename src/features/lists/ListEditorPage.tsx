import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/Button'
import { TextAreaField, TextField } from '../../components/Fields'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, QueryBoundary } from '../../components/StateViews'
import { useToast } from '../../components/toastContext'
import { useRepositories } from '../../data/repositoryContext'
import type { Place, PlaceList } from '../../data/types'
import { useRepoQuery } from '../../data/useRepoQuery'
import { CopyLinkButton } from './CopyLinkButton'
import { LINK_SCOPE_NOTE, publicListUrl } from './shareLink'
import styles from './ListEditorPage.module.css'

export function ListEditorPage() {
  const { id = '' } = useParams()
  const { lists, places } = useRepositories()

  const { state, refetch } = useRepoQuery(async () => {
    const [list, items, allPlaces] = await Promise.all([
      lists.get(id),
      lists.listItems(id),
      places.list(),
    ])
    return { list, items, allPlaces }
  }, [lists, places, id])

  return (
    <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading list">
      {({ list, items, allPlaces }) =>
        list ? (
          <ListEditor
            // Re-mount when switching lists so the form fields reset.
            key={list.id}
            list={list}
            allPlaces={allPlaces}
            placeIdsInList={items.map((i) => i.placeId)}
          />
        ) : (
          <>
            <PageHeader title="List not found" backTo="/lists" backLabel="Lists" />
            <EmptyState
              title="We can’t find that list"
              action={<ButtonLink to="/lists">Back to Lists</ButtonLink>}
            >
              It may have been deleted.
            </EmptyState>
          </>
        )
      }
    </QueryBoundary>
  )
}

interface ListEditorProps {
  list: PlaceList
  allPlaces: Place[]
  placeIdsInList: string[]
}

function ListEditor({ list, allPlaces, placeIdsInList }: ListEditorProps) {
  const { lists } = useRepositories()
  const toast = useToast()
  const navigate = useNavigate()

  const [title, setTitle] = useState(list.title)
  const [description, setDescription] = useState(list.description ?? '')
  const [titleError, setTitleError] = useState<string | undefined>()
  const [search, setSearch] = useState('')

  const byId = new Map(allPlaces.map((p) => [p.id, p]))
  const inList = placeIdsInList.flatMap((id) => {
    const place = byId.get(id)
    return place ? [place] : []
  })
  const inListIds = new Set(placeIdsInList)
  const query = search.trim().toLowerCase()
  const candidates = allPlaces
    .filter((p) => !inListIds.has(p.id))
    .filter(
      (p) =>
        !query ||
        `${p.name} ${p.cuisine ?? ''} ${p.neighborhood ?? ''}`.toLowerCase().includes(query),
    )

  const detailsChanged =
    title.trim() !== list.title || description.trim() !== (list.description ?? '')

  async function run(action: () => Promise<unknown>) {
    try {
      await action()
    } catch (caught) {
      toast.show({ message: caught instanceof Error ? caught.message : 'Something went wrong.' })
    }
  }

  async function saveDetails(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setTitleError('A list needs a name.')
      return
    }
    setTitleError(undefined)
    await run(async () => {
      await lists.update(list.id, {
        title: title.trim(),
        description: description.trim() || undefined,
      })
      toast.show({ message: 'List saved' })
    })
  }

  async function handleDelete() {
    if (!window.confirm(`Delete “${list.title}”? The places stay in My Places.`)) return
    await run(async () => {
      await lists.remove(list.id)
      toast.show({ message: 'List deleted' })
      navigate('/lists', { replace: true })
    })
  }

  return (
    <>
      <PageHeader title="Edit list" backTo="/lists" backLabel="Lists" />

      <div className={styles.layout}>
        <form onSubmit={saveDetails} className={styles.card} noValidate>
          <TextField
            label="List name"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              setTitleError(undefined)
            }}
            error={titleError}
            autoComplete="off"
          />
          <TextAreaField
            label="Description"
            optional
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Who is this list for?"
          />
          <Button type="submit" variant="secondary" size="sm" disabled={!detailsChanged}>
            Save details
          </Button>
        </form>

        <section className={styles.card} aria-labelledby="share-heading">
          <h2 id="share-heading">Sharing</h2>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={list.isPublic}
              onChange={(event) =>
                void run(() => lists.update(list.id, { isPublic: event.target.checked }))
              }
            />
            <span>Anyone with the link can view this list</span>
          </label>
          {list.isPublic ? (
            <>
              <p className={styles.url}>{publicListUrl(list.id)}</p>
              <div className={styles.row}>
                <CopyLinkButton listId={list.id} />
                <Link to={`/lists/${list.id}`} className={styles.textLink}>
                  Preview public page
                </Link>
              </div>
              <p className={styles.hint}>{LINK_SCOPE_NOTE}</p>
            </>
          ) : (
            <p className={styles.hint}>This list is private. Turn sharing on to get a link.</p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="in-list-heading">
          <h2 id="in-list-heading">Places in this list ({inList.length})</h2>
          {inList.length === 0 ? (
            <p className={styles.hint}>Nothing here yet. Add places below.</p>
          ) : (
            <ul className={styles.places}>
              {inList.map((place) => (
                <li key={place.id} className={styles.placeRow}>
                  <span>
                    <Link to={`/places/${place.id}`}>{place.name}</Link>
                    <span className={styles.hint}>
                      {' '}
                      {[place.cuisine, place.neighborhood].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void run(() => lists.removePlace(list.id, place.id))}
                    aria-label={`Remove ${place.name} from this list`}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.card} aria-labelledby="add-heading">
          <h2 id="add-heading">Add places</h2>
          {allPlaces.length === 0 ? (
            <p className={styles.hint}>
              You haven't saved any places yet. Save some from <Link to="/">Discover</Link> first.
            </p>
          ) : (
            <>
              <TextField
                label="Search your places"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoComplete="off"
                type="search"
              />
              {candidates.length === 0 ? (
                <p className={styles.hint}>
                  {query
                    ? 'No places match that search.'
                    : 'Every saved place is already in this list.'}
                </p>
              ) : (
                <ul className={styles.places}>
                  {candidates.map((place) => (
                    <li key={place.id} className={styles.placeRow}>
                      <span>
                        {place.name}
                        <span className={styles.hint}>
                          {' '}
                          {[place.cuisine, place.neighborhood].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void run(() => lists.addPlace(list.id, place.id))}
                        aria-label={`Add ${place.name} to this list`}
                      >
                        Add
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <div>
          <Button variant="danger" size="sm" onClick={() => void handleDelete()}>
            Delete this list
          </Button>
        </div>
      </div>
    </>
  )
}
