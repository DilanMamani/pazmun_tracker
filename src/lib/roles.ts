import type { PublicProfile } from './supabase'

export const ROLE_LABELS: Record<PublicProfile['role'], string> = {
  delegado: 'Delegado/a',
  paje: 'Paje',
  asesor: 'Asesor/a',
  autoridad: 'Autoridad de Comité',
}

export const ROLE_COLOR_VARS: Record<PublicProfile['role'], string> = {
  delegado: 'var(--role-delegado)',
  paje: 'var(--role-paje)',
  asesor: 'var(--role-asesor)',
  autoridad: 'var(--role-autoridad)',
}

export function roleLabel(profile: Pick<PublicProfile, 'role' | 'authority_role'>) {
  if (profile.role === 'autoridad' && profile.authority_role) return profile.authority_role
  return ROLE_LABELS[profile.role]
}
