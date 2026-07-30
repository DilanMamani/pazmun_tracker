import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type MealSession, type Participant } from '../lib/supabase'
import { loadMealStats, type CommitteeStat, type MealStats } from '../lib/mealStats'
import { pickCurrentSession } from '../lib/mealSessions'
import { loadMealReportRows } from '../lib/mealReport'
import { ROLE_COLOR_VARS, roleLabel } from '../lib/roles'
import { hasMeaningfulAnswer } from '../lib/textFilters'
import { useSession } from '../lib/useSession'
import { useMealCheckinsRealtime } from '../lib/useMealCheckinsRealtime'
import Icon from '../components/Icon'

type StatusFilter = 'all' | 'pending' | 'fed'

export default function StaffMeals() {
  const { staffRole } = useSession()
  const [sessions, setSessions] = useState<MealSession[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stats, setStats] = useState<MealStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [newSessionLabel, setNewSessionLabel] = useState('')
  const [creatingSession, setCreatingSession] = useState(false)
  const [committeeFilter, setCommitteeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [exporting, setExporting] = useState(false)

  async function loadSessions(selectId?: string) {
    const { data } = await supabase
      .from('meal_sessions')
      .select('id, label, created_at, starts_at, ends_at')
      .order('starts_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    const list = (data as MealSession[]) ?? []
    setSessions(list)
    setSelectedId(selectId ?? pickCurrentSession(list)?.id ?? null)
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

  async function handleExport() {
    const session = sessions.find((s) => s.id === selectedId)
    if (!session) return
    setExporting(true)
    try {
      const [rows, { exportMealReport }] = await Promise.all([
        loadMealReportRows(session.id),
        import('../lib/exportMealReport'),
      ])
      await exportMealReport(session.label, rows)
    } finally {
      setExporting(false)
    }
  }

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
          <div className="meal-report-row">
            <p className="staff-alert-count">
              {stats.fed} de {stats.total} alimentados
            </p>
            <button type="button" className="meal-report-button" onClick={handleExport} disabled={exporting}>
              <Icon name="download" />
              {exporting ? 'Generando…' : 'Descargar reporte'}
            </button>
          </div>

          <input
            type="search"
            className="committee-filter-input"
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
            placeholder="Filtrar por comité…"
          />

          <div className="status-filter" role="group" aria-label="Filtrar por estado">
            <button
              type="button"
              className={statusFilter === 'all' ? 'active' : undefined}
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </button>
            <button
              type="button"
              className={statusFilter === 'pending' ? 'active' : undefined}
              onClick={() => setStatusFilter('pending')}
            >
              Pendientes
            </button>
            <button
              type="button"
              className={statusFilter === 'fed' ? 'active' : undefined}
              onClick={() => setStatusFilter('fed')}
            >
              Alimentados
            </button>
          </div>

          {(() => {
            const term = committeeFilter.trim().toLowerCase()
            let filtered = term
              ? stats.byCommittee.filter((c) => c.committee.toLowerCase().includes(term))
              : stats.byCommittee

            if (statusFilter === 'pending') {
              filtered = filtered.filter((c) => c.pending.length > 0)
            } else if (statusFilter === 'fed') {
              filtered = filtered.filter((c) => c.fedMembers.length > 0)
            }

            if (filtered.length === 0) {
              return <p className="staff-home-hint">Ningún comité coincide con los filtros.</p>
            }
            return filtered.map((c) => <CommitteeGroup key={c.committee} stat={c} statusFilter={statusFilter} />)
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

function CommitteeGroup({ stat, statusFilter }: { stat: CommitteeStat; statusFilter: StatusFilter }) {
  // Empieza cerrado (con ~30 comités, todos abiertos es un scroll
  // interminable) y a partir de ahí el usuario controla el toggle — así un
  // refresh de tiempo real no se lo cierra en la cara mientras lo revisa.
  const [open, setOpen] = useState(false)

  const showPending = statusFilter !== 'fed'
  const showFed = statusFilter !== 'pending'

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
      {stat.pending.length === 0 && stat.fedMembers.length === 0 ? (
        <p className="staff-home-hint">Sin participantes.</p>
      ) : (
        <ul className="staff-results">
          {showPending && stat.pending.map((p) => <MemberRow key={p.id} p={p} fed={false} />)}
          {showFed && stat.fedMembers.map((p) => <MemberRow key={p.id} p={p} fed />)}
        </ul>
      )}
    </details>
  )
}

function MemberRow({ p, fed }: { p: Participant; fed: boolean }) {
  return (
    <li className={fed ? 'fed' : undefined}>
      <Link to={`/p/${p.qr_code}`}>
        <Icon name={fed ? 'check-circle' : 'circle'} className="staff-meal-icon" />
        <span
          className="role-dot"
          style={{ '--role-color': ROLE_COLOR_VARS[p.role] } as React.CSSProperties}
        />
        <span className="staff-result-text">
          <span className="staff-result-name">{p.full_name}</span>
          <span className="staff-result-meta">
            {roleLabel(p)}
            {fed && ' · Alimentado'}
            {hasMeaningfulAnswer(p.allergy) && <Icon name="alert" />}
          </span>
        </span>
      </Link>
    </li>
  )
}
