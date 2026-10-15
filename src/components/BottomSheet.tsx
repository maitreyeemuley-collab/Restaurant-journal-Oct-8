import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { CloseIcon } from './icons'
import styles from './BottomSheet.module.css'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Bottom sheet on phones, centered dialog on wide screens.
 * Built on the native <dialog> element, which traps focus, closes on Escape and
 * restores focus to the opener for free.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    // Clicking the backdrop is a mouse-only shortcut: keyboard users have Escape (native
    // <dialog> behavior) and the Close button, so no key handler is needed here.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> itself, not on its content.
        if (event.target === ref.current) onClose()
      }}
    >
      {open ? (
        <div className={styles.inner}>
          <div className={styles.header}>
            <h2>{title}</h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  )
}
