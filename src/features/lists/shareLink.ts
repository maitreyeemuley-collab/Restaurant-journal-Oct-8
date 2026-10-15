/**
 * Shareable link for a public list.
 *
 * In Supabase mode the list lives in the database, so anyone with the link can open it, signed
 * in or not. In local demo mode it lives only in THIS browser's localStorage, so the link only
 * works on this device and browser (see `LINK_SCOPE_NOTE`).
 */
import { isSupabaseConfigured } from '../../data/supabase/client'

/** Honest wording about who can open a shared link, for the active back end. */
export const LINK_SCOPE_NOTE = isSupabaseConfigured
  ? 'Anyone with this link can view the list, even without an account.'
  : 'This is a demo: the link only works in this browser. It will work for anyone once lists are saved online.'

export function publicListUrl(listId: string): string {
  return `${window.location.origin}/lists/${encodeURIComponent(listId)}`
}

/** Copies text; falls back to a hidden textarea where the Clipboard API is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      document.body.removeChild(area)
    }
  }
}
