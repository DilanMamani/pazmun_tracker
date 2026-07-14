import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, type StaffRole } from './supabase'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setStaffRole(null)
      return
    }
    supabase
      .from('staff_profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setStaffRole((data?.role as StaffRole) ?? null))
  }, [session])

  return { session, loading, staffRole }
}
