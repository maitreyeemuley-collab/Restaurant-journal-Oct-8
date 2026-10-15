import { createContext, useContext } from 'react'
import type { Repositories } from './repository'

export const RepositoryContext = createContext<Repositories | null>(null)

export function useRepositories(): Repositories {
  const value = useContext(RepositoryContext)
  if (!value) throw new Error('useRepositories must be used inside <RepositoryProvider>')
  return value
}
