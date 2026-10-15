import { createContext, useContext } from 'react'

export interface QuickSaveValue {
  openQuickSave: () => void
}

export const QuickSaveContext = createContext<QuickSaveValue | null>(null)

export function useQuickSave(): QuickSaveValue {
  const value = useContext(QuickSaveContext)
  if (!value) throw new Error('useQuickSave must be used inside <QuickSaveProvider>')
  return value
}
