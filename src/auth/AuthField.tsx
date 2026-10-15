import { useId } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import styles from './AuthField.module.css'

type AuthFieldProps = {
  /** Announced to screen readers; shown visually as the placeholder (matches the design). */
  label: string
  hint?: string
  error?: string
  /** Something that sits inside the field on the right, like the password Show button. */
  trailing?: ReactNode
} & Omit<ComponentPropsWithRef<'input'>, 'id'>

/**
 * Text field for the sign-in card. The design shows the field name as placeholder text only, so
 * the real <label> is visually hidden: screen readers still get a proper label.
 */
export function AuthField({ label, hint, error, trailing, className, ...input }: AuthFieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <div className={styles.control}>
        <input
          id={id}
          className={`${styles.input} ${trailing ? styles.withTrailing : ''}`}
          placeholder={label}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          {...input}
        />
        {trailing}
      </div>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
