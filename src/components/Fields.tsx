import { useId } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import styles from './Fields.module.css'

interface FieldShellProps {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode
}

function FieldShell({ label, hint, error, optional, children }: FieldShellProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optional ? <span className={styles.optional}> (optional)</span> : null}
      </label>
      {children({ inputId: id, describedBy })}
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

type CommonProps = Omit<FieldShellProps, 'children'>

export function TextField({
  label,
  hint,
  error,
  optional,
  ...input
}: CommonProps & ComponentPropsWithRef<'input'>) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional}>
      {({ inputId, describedBy }) => (
        <input
          id={inputId}
          className={styles.control}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          {...input}
        />
      )}
    </FieldShell>
  )
}

export function TextAreaField({
  label,
  hint,
  error,
  optional,
  ...input
}: CommonProps & ComponentPropsWithRef<'textarea'>) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional}>
      {({ inputId, describedBy }) => (
        <textarea
          id={inputId}
          className={`${styles.control} ${styles.textarea}`}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          rows={3}
          {...input}
        />
      )}
    </FieldShell>
  )
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  children,
  ...input
}: CommonProps & ComponentPropsWithRef<'select'>) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional}>
      {({ inputId, describedBy }) => (
        <select
          id={inputId}
          className={styles.control}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          {...input}
        >
          {children}
        </select>
      )}
    </FieldShell>
  )
}
