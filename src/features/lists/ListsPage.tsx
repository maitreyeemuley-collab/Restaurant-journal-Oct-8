import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Fields'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, QueryBoundary } from '../../components/StateViews'
import { Tag } from '../../components/StatusBadge'
import { useRepositories } from '../../data/repositoryContext'
import { useRepoQuery } from '../../data/useRepoQuery'
import styles from './ListsPage.module.css'

export function ListsPage() {
  const { lists } = useRepositories()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [creating, setCreating] = useState(false)

  const { state, refetch } = useRepoQuery(async () => {
    const [allLists, items] = await Promise.all([lists.list(), lists.listAllItems()])
    const counts = new Map<string, number>()
    for (const item of items) counts.set(item.listId, (counts.get(item.listId) ?? 0) + 1)
    return { allLists, counts }
  }, [lists])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Give your list a name first.')
      return
    }
    setCreating(true)
    setError(undefined)
    try {
      const list = await lists.create({ title })
      navigate(`/lists/${list.id}/edit`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't create that list.")
      setCreating(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Lists"
        subtitle="Curate places for any occasion and share them with a link."
      />

      <form onSubmit={handleCreate} className={styles.create} noValidate>
        <TextField
          label="New list"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setError(undefined)
          }}
          error={error}
          placeholder="e.g. Visitors' first weekend in Seattle"
          autoComplete="off"
        />
        <Button type="submit" disabled={creating}>
          Create list
        </Button>
      </form>

      <QueryBoundary state={state} onRetry={refetch} loadingLabel="Loading your lists">
        {({ allLists, counts }) =>
          allLists.length === 0 ? (
            <EmptyState title="No lists yet">
              Make one above, like “Date night spots”, then add places from the list editor.
            </EmptyState>
          ) : (
            <ul className={styles.grid}>
              {allLists.map((list) => {
                const count = counts.get(list.id) ?? 0
                return (
                  <li key={list.id} className={styles.card}>
                    <h2>
                      <Link to={`/lists/${list.id}/edit`} className={styles.link}>
                        {list.title}
                      </Link>
                    </h2>
                    {list.description ? <p className={styles.desc}>{list.description}</p> : null}
                    <div className={styles.meta}>
                      <span>
                        {count} {count === 1 ? 'place' : 'places'}
                      </span>
                      <Tag>{list.isPublic ? 'Public link' : 'Private'}</Tag>
                    </div>
                  </li>
                )
              })}
            </ul>
          )
        }
      </QueryBoundary>
    </>
  )
}
