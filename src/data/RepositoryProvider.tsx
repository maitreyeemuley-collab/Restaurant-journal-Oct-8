import { useState } from 'react'
import type { ReactNode } from 'react'
import { createLocalRepositories } from './local/repositories'
import { supabase } from './supabase/client'
import { createSupabaseRepositories } from './supabase'
import { RepositoryContext } from './repositoryContext'
import type { Repositories } from './repository'

interface RepositoryProviderProps {
  children: ReactNode
  /** Tests (or a future Supabase build) can pass their own implementations. */
  repositories?: Repositories
}

/**
 * The ONE place where data implementations are chosen: Supabase when the env vars are set,
 * otherwise the localStorage demo back end (also what the tests use).
 */
export function RepositoryProvider({ children, repositories }: RepositoryProviderProps) {
  const [value] = useState<Repositories>(
    () =>
      repositories ?? (supabase ? createSupabaseRepositories(supabase) : createLocalRepositories()),
  )
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
}
