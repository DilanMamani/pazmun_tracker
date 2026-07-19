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
  assignment: string | null
}

export type Participant = PublicProfile & {
  id: string
  diet: string | null
  allergy: string | null
  notes: string | null
}

export type StaffRole = 'staff' | 'admin'

export type MealSession = {
  id: string
  label: string
  created_at: string
}

export type MealCheckin = {
  id: string
  participant_id: string
  meal_session_id: string
  checked_at: string
}
