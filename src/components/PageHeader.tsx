import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon } from './icons'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  actions?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  actions,
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <title>{`${title} · Restaurant Journal`}</title>
      {backTo ? (
        <Link to={backTo} className={styles.back}>
          <ArrowLeftIcon size={20} />
          {backLabel}
        </Link>
      ) : null}
      <div className={styles.row}>
        <div>
          <h1>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  )
}
