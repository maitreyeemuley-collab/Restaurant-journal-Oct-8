import { createContext, useContext } from 'react'

export interface ToastOptions {
  message: string
  /** Button that runs a callback (e.g. Undo). */
  action?: { label: string; onClick: () => void }
  /** Link to another screen (e.g. View). */
  link?: { label: string; to: string }
}

export interface ToastContextValue {
  show: (options: ToastOptions) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside <ToastProvider>')
  return value
}
