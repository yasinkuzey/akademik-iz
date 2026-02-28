import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate URL - must start with http/https
const isValidUrl = (url: string | undefined) => url && url.startsWith('http')

const supabaseUrl = isValidUrl(envUrl) ? envUrl : (import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co')
const supabaseAnonKey = envKey || (import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-key')

if (!isValidUrl(envUrl) && !import.meta.env.VITE_SUPABASE_URL) {
    console.error('CRITICAL: VITE_SUPABASE_URL is invalid or missing!', envUrl)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        flowType: 'pkce',
        detectSessionInUrl: false, // Prevent race condition with manual exchange in AuthCallback
        autoRefreshToken: true,
        persistSession: true,
    },
})

export type Json = Record<string, unknown>
