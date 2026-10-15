import { useRepositories } from '../data/repositoryContext'
import { Button } from './Button'
import { useToast } from './toastContext'
import styles from './DemoDataFooter.module.css'

/** Demo-only: puts the sample places back. Disappears when a real back end has no reset. */
export function DemoDataFooter() {
  const { resetDemoData } = useRepositories()
  const toast = useToast()
  if (!resetDemoData) return null

  async function handleReset() {
    if (
      !window.confirm('Replace everything with the sample Seattle data? Your changes will be lost.')
    )
      return
    try {
      await resetDemoData?.()
      toast.show({ message: 'Sample data restored' })
    } catch (caught) {
      toast.show({
        message: caught instanceof Error ? caught.message : "We couldn't reset the data.",
      })
    }
  }

  return (
    <footer className={styles.footer}>
      <p>This is a demo. Your places are saved only in this browser.</p>
      <Button variant="ghost" size="sm" onClick={() => void handleReset()}>
        Reset demo data
      </Button>
    </footer>
  )
}
