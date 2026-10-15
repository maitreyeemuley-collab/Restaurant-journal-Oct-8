import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { CheckIcon, LinkIcon } from '../../components/icons'
import { copyText, publicListUrl } from './shareLink'

type CopyState = 'idle' | 'copied' | 'failed'

export function CopyLinkButton({ listId }: { listId: string }) {
  const [copy, setCopy] = useState<CopyState>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function handleClick() {
    const ok = await copyText(publicListUrl(listId))
    setCopy(ok ? 'copied' : 'failed')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopy('idle'), 3000)
  }

  return (
    <>
      <Button variant="secondary" onClick={() => void handleClick()}>
        {copy === 'copied' ? <CheckIcon size={18} /> : <LinkIcon size={18} />}
        {copy === 'copied' ? 'Link copied' : copy === 'failed' ? 'Copy failed' : 'Copy link'}
      </Button>
      <span className="visually-hidden" role="status" aria-live="polite">
        {copy === 'copied'
          ? 'Link copied to clipboard'
          : copy === 'failed'
            ? 'Could not copy the link'
            : ''}
      </span>
    </>
  )
}
