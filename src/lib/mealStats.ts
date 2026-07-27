import { supabase, type Participant } from './supabase'

export type CommitteeStat = {
  committee: string
  total: number
  fed: number
  pending: Participant[]
  fedMembers: Participant[]
}

export type RoleStat = {
  role: Participant['role']
  count: number
}

export type MealStats = {
  total: number
  fed: number
  byCommittee: CommitteeStat[]
  byRole: RoleStat[]
}

export async function loadMealStats(sessionId: string): Promise<MealStats> {
  const [{ data: participants }, { data: checkins }] = await Promise.all([
    supabase.from('participants').select('*').order('full_name'),
    supabase.from('meal_checkins').select('participant_id').eq('meal_session_id', sessionId),
  ])
  const fedIds = new Set((checkins ?? []).map((c) => c.participant_id as string))
  const all = (participants as Participant[]) ?? []

  const groups = new Map<string, Participant[]>()
  for (const p of all) {
    const key = p.committee ?? 'Sin comité'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)?.push(p)
  }

  const byCommittee = Array.from(groups.entries())
    .map(([committee, members]) => ({
      committee,
      total: members.length,
      fed: members.filter((m) => fedIds.has(m.id)).length,
      pending: members.filter((m) => !fedIds.has(m.id)),
      fedMembers: members.filter((m) => fedIds.has(m.id)),
    }))
    .sort((a, b) => b.total - b.fed - (a.total - a.fed))

  const roleCounts = new Map<Participant['role'], number>()
  for (const p of all) {
    roleCounts.set(p.role, (roleCounts.get(p.role) ?? 0) + 1)
  }
  const byRole = Array.from(roleCounts.entries())
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)

  return { total: all.length, fed: fedIds.size, byCommittee, byRole }
}
