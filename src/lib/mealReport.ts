import { supabase, type Participant } from './supabase'
import { roleLabel } from './roles'

export type MealReportRow = {
  full_name: string
  committee: string
  role: string
  fed: boolean
  checked_at: string | null
  checked_by_email: string | null
}

export async function loadMealReportRows(sessionId: string): Promise<MealReportRow[]> {
  const [{ data: participants }, { data: checkins }] = await Promise.all([
    supabase.from('participants').select('*').order('committee').order('full_name'),
    supabase
      .from('meal_checkins')
      .select('participant_id, checked_at, checked_by_email')
      .eq('meal_session_id', sessionId),
  ])

  const byParticipant = new Map((checkins ?? []).map((c) => [c.participant_id as string, c]))

  return ((participants as Participant[]) ?? []).map((p) => {
    const checkin = byParticipant.get(p.id)
    return {
      full_name: p.full_name,
      committee: p.committee ?? 'Sin comité',
      role: roleLabel(p),
      fed: !!checkin,
      checked_at: (checkin?.checked_at as string | undefined) ?? null,
      checked_by_email: (checkin?.checked_by_email as string | undefined) ?? null,
    }
  })
}
