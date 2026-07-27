import type { MealSession } from './supabase'

function todayLocalISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Con las fechas del evento precargadas de antemano, created_at ya no sirve
// para saber "cuál es la comida de hoy" — todas se insertaron juntas. Se
// elige por session_date == hoy; si ninguna coincide (antes/después del
// evento, o una sesión de prueba) cae de vuelta a la más reciente creada.
export function pickCurrentSession(sessions: MealSession[]): MealSession | null {
  if (sessions.length === 0) return null
  const today = todayLocalISO()
  const todays = sessions.find((s) => s.session_date === today)
  if (todays) return todays
  return [...sessions].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
}
