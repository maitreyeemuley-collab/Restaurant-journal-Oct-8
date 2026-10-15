import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * The browser-side Supabase client, or null when the env vars aren't set (the app then runs on
 * the local demo back end). Only the public anon key belongs here: row-level security in the
 * database is what keeps people's data private.
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

export const isSupabaseConfigured = supabase !== null
