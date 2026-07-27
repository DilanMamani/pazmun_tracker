import type { MealSession } from './supabase'

// El cronograma tiene varias comidas por día (refrigerios + almuerzos), cada
// una con su propio horario. "La comida actual" es la que empezó más
// recientemente y todavía no fue reemplazada por la siguiente — así, si una
// comida se retrasa en la práctica, sigue siendo la actual hasta que
// arranca la próxima según el horario (no se cae a "ninguna" en el hueco
// entre el fin nominal de una y el inicio nominal de otra).
// Antes de que arranque la primera comida programada, se muestra esa
// primera como referencia de "lo que viene". Las sesiones creadas a mano sin
// horario (starts_at null) solo entran como último recurso.
export function pickCurrentSession(sessions: MealSession[]): MealSession | null {
  if (sessions.length === 0) return null
  const now = Date.now()
  const scheduled = sessions.filter((s): s is MealSession & { starts_at: string } => !!s.starts_at)

  const started = scheduled.filter((s) => new Date(s.starts_at).getTime() <= now)
  if (started.length > 0) {
    return started.sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())[0]
  }

  if (scheduled.length > 0) {
    return scheduled.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0]
  }

  return [...sessions].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
}
