import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars')
}

export const supabase = createClient(url, anonKey)

export type PublicProfile = {
  qr_code: string
  full_name: string
  role: 'delegado' | 'paje' | 'asesor' | 'autoridad'
  authority_role: string | null
  committee: string | null
  institution: string | null
  city: string | null
  photo_url: string | null
}
