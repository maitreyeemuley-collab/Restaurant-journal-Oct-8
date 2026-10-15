import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { QuickSaveContext } from './quickSaveContext'
import { QuickSaveSheet } from './QuickSaveSheet'

export function QuickSaveProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openQuickSave = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])
  const value = useMemo(() => ({ openQuickSave }), [openQuickSave])

  return (
    <QuickSaveContext.Provider value={value}>
      {children}
      <QuickSaveSheet open={open} onClose={close} />
    </QuickSaveContext.Provider>
  )
}
