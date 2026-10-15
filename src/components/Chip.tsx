import type { ReactNode } from 'react'
import styles from './Chip.module.css'

interface ChipProps {
  selected: boolean
  onToggle: () => void
  children: ReactNode
}

/** A toggle button styled as a pill. Screen readers hear "pressed / not pressed". */
export function Chip({ selected, onToggle, children }: ChipProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${selected ? styles.selected : ''}`}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {children}
    </button>
  )
}

interface ChipGroupProps {
  label: string
  children: ReactNode
  /** Scroll sideways on narrow screens instead of wrapping. */
  scroll?: boolean
}

export function ChipGroup({ label, children, scroll = false }: ChipGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`${styles.group} ${scroll ? styles.scroll : ''}`}
    >
      {children}
    </div>
  )
}
