import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate URL - must start with http/https
const isValidUrl = (url: string | undefined) => url && url.startsWith('http')

const supabaseUrl = isValidUrl(envUrl) ? envUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = envKey || 'placeholder-key'

if (!isValidUrl(envUrl)) {
    console.error('CRITICAL: VITE_SUPABASE_URL is invalid or missing!', envUrl)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Json = Record<string, unknown>
