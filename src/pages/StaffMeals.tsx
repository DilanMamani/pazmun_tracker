import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type MealSession } from '../lib/supabase'
import { loadMealStats, type CommitteeStat, type MealStats } from '../lib/mealStats'
import { ROLE_COLOR_VARS, roleLabel } from '../lib/roles'
import { useSession } from '../lib/useSession'
import { useMealCheckinsRealtime } from '../lib/useMealCheckinsRealtime'
import Icon from '../components/Icon'

export default function StaffMeals() {
  const { staffRole } = useSession()
  const [sessions, setSessions] = useState<MealSession[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stats, setStats] = useState<MealStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [newSessionLabel, setNewSessionLabel] = useState('')
  const [creatingSession, setCreatingSession] = useState(false)
  const [committeeFilter, setCommitteeFilter] = useState('')

  async function loadSessions(selectId?: string) {
    const { data } = await supabase
      .from('meal_sessions')
      .select('id, label, created_at')
      .order('created_at', { ascending: false })
    const list = (data as MealSession[]) ?? []
    setSessions(list)
    setSelectedId(selectId ?? list[0]?.id ?? null)
  }

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setStats(null)
      return
    }
    let cancelled = false
    setLoadingStats(true)
    loadMealStats(selectedId).then((result) => {
      if (!cancelled) {
        setStats(result)
        setLoadingStats(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  useMealCheckinsRealtime(
    () => {
      if (selectedId) loadMealStats(selectedId).then(setStats)
    },
    selectedId ? { column: 'meal_session_id', value: selectedId } : undefined,
  )

  async function handleCreateSession(e: FormEvent) {
    e.preventDefault()
    const label = newSessionLabel.trim()
    if (!label) return
    setCreatingSession(true)
    const { data, error } = await supabase.rpc('staff_create_meal_session', { p_label: label })
    setCreatingSession(false)
    if (!error) {
      setNewSessionLabel('')
      loadSessions(data as string)
    }
  }

  return (
    <div className="staff-home">
      <h1>Comidas</h1>

      {sessions.length === 0 && (
        <p className="staff-home-hint">Todavía no hay comidas registradas.</p>
      )}

      {sessions.length > 0 && (
        <select
          className="staff-session-select"
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      )}

      {loadingStats && (
        <div className="staff-loading-rows">
          <div className="skeleton-line" style={{ width: '40%', height: 20 }} />
          <div className="skeleton-line" style={{ width: '100%', height: 60 }} />
        </div>
      )}

      {!loadingStats && stats && (
        <>
          <p className="staff-alert-count">
            {stats.fed} de {stats.total} alimentados
          </p>

          <input
            type="search"
            className="committee-filter-input"
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
            placeholder="Filtrar por comité…"
          />

          {(() => {
            const term = committeeFilter.trim().toLowerCase()
            const filtered = term
              ? stats.byCommittee.filter((c) => c.committee.toLowerCase().includes(term))
              : stats.byCommittee

            if (filtered.length === 0) {
              return <p className="staff-home-hint">Ningún comité coincide con "{committeeFilter}".</p>
            }
            return filtered.map((c) => <CommitteeGroup key={c.committee} stat={c} />)
          })()}
        </>
      )}

      {staffRole === 'admin' && (
        <form className="staff-new-session" onSubmit={handleCreateSession}>
          <input
            type="text"
            value={newSessionLabel}
            onChange={(e) => setNewSessionLabel(e.target.value)}
            placeholder="Nueva comida (ej. Día 2 - Almuerzo)"
          />
          <button type="submit" disabled={creatingSession || !newSessionLabel.trim()}>
            <Icon name="add" />
            Agregar
          </button>
        </form>
      )}
    </div>
  )
}

function CommitteeGroup({ stat }: { stat: CommitteeStat }) {
  // Empieza cerrado (con ~30 comités, todos abiertos es un scroll
  // interminable) y a partir de ahí el usuario controla el toggle — así un
  // refresh de tiempo real no se lo cierra en la cara mientras lo revisa.
  const [open, setOpen] = useState(false)

  return (
    <details
      className="committee-group"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <span>{stat.committee}</span>
        <span className="committee-group-count">
          {stat.fed}/{stat.total}
        </span>
      </summary>
      {stat.pending.length === 0 ? (
        <p className="staff-home-hint">Todos alimentados.</p>
      ) : (
        <ul className="staff-results">
          {stat.pending.map((p) => (
            <li key={p.id}>
              <Link to={`/p/${p.qr_code}`}>
                <span
                  className="role-dot"
                  style={{ '--role-color': ROLE_COLOR_VARS[p.role] } as React.CSSProperties}
                />
                <span className="staff-result-text">
                  <span className="staff-result-name">{p.full_name}</span>
                  <span className="staff-result-meta">
                    {roleLabel(p)}
                    {p.allergy && <Icon name="alert" />}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}
