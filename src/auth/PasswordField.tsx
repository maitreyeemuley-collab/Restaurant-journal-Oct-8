import { useState } from 'react'
import type { ComponentPropsWithRef } from 'react'
import { AuthField } from './AuthField'
import styles from './PasswordField.module.css'

type PasswordFieldProps = {
  label: string
  hint?: string
  error?: string
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'id'>

/** Password input with a Show / Hide button (44px tap target). The button's name follows its state. */
export function PasswordField({ label, hint, error, ...input }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <AuthField
      label={label}
      hint={hint}
      error={error}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      spellCheck={false}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      }
      {...input}
    />
  )
}
