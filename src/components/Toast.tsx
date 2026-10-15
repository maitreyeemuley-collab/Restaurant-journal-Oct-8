import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './Toast.module.css'
import { ToastContext } from './toastContext'
import type { ToastOptions } from './toastContext'

const DURATION_MS = 6000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const dismiss = useCallback(() => setToast(null), [])

  const show = useCallback((options: ToastOptions) => {
    window.clearTimeout(timer.current)
    setToast(options)
    timer.current = window.setTimeout(() => setToast(null), DURATION_MS)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toast ? (
          <div className={styles.toast}>
            <span>{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.action?.onClick()
                  dismiss()
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
            {toast.link ? (
              <Link to={toast.link.to} className={styles.action} onClick={dismiss}>
                {toast.link.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  )
}
