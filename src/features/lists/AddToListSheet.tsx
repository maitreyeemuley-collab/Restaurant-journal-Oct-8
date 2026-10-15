import { useState } from 'react'
import type { FormEvent } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Fields'
import { QueryBoundary } from '../../components/StateViews'
import { useRepositories } from '../../data/repositoryContext'
import type { Place } from '../../data/types'
import { useRepoQuery } from '../../data/useRepoQuery'
import styles from './AddToListSheet.module.css'

interface AddToListSheetProps {
  place: Place
  open: boolean
  onClose: () => void
}

/** Tick a list to add this place to it, untick to remove it. Changes save immediately. */
export function AddToListSheet({ place, open, onClose }: AddToListSheetProps) {
  const { lists } = useRepositories()
  const [newTitle, setNewTitle] = useState('')
  const [error, setError] = useState<string | undefined>()

  const { state, refetch } = useRepoQuery(async () => {
    const [allLists, items] = await Promise.all([lists.list(), lists.listAllItems()])
    const containing = new Set(items.filter((i) => i.placeId === place.id).map((i) => i.listId))
    return { allLists, containing }
  }, [lists, place.id])

  async function toggle(listId: string, isIn: boolean) {
    setError(undefined)
    try {
      if (isIn) await lists.removePlace(listId, place.id)
      else await lists.addPlace(listId, place.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't update that list.")
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    setError(undefined)
    try {
      const list = await lists.create({ title })
      await lists.addPlace(list.id, place.id)
      setNewTitle('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't create that list.")
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={`Add ${place.name} to a list`}>
      <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading your lists">
        {({ allLists, containing }) => (
          <div className={styles.body}>
            {allLists.length === 0 ? (
              <p className={styles.empty}>
                You don't have any lists yet. Make your first one below.
              </p>
            ) : (
              <ul className={styles.list}>
                {allLists.map((list) => {
                  const isIn = containing.has(list.id)
                  return (
                    <li key={list.id}>
                      <label className={styles.item}>
                        <input
                          type="checkbox"
                          checked={isIn}
                          onChange={() => void toggle(list.id, isIn)}
                        />
                        <span>{list.title}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}

            <form onSubmit={handleCreate} className={styles.create}>
              <TextField
                label="New list"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="e.g. Date night spots"
                autoComplete="off"
              />
              <Button type="submit" variant="secondary" disabled={!newTitle.trim()}>
                Create and add
              </Button>
            </form>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
            <Button onClick={onClose}>Done</Button>
          </div>
        )}
      </QueryBoundary>
    </BottomSheet>
  )
}
