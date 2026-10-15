import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

interface CommonProps {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

const classes = ({ variant = 'primary', size = 'md', fullWidth }: CommonProps): string =>
  [styles.button, styles[variant], styles[size], fullWidth ? styles.full : ''].join(' ')

export function Button({
  variant,
  size,
  fullWidth,
  type = 'button',
  className,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={[classes({ variant, size, fullWidth, children: null }), className ?? ''].join(' ')}
      {...rest}
    />
  )
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...rest
}: CommonProps & LinkProps) {
  return (
    <Link
      className={[classes({ variant, size, fullWidth, children: null }), className ?? ''].join(' ')}
      {...rest}
    />
  )
}
