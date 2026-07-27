import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type MealSession } from '../lib/supabase'
import { loadMealStats, type MealStats } from '../lib/mealStats'
import { useMealCheckinsRealtime } from '../lib/useMealCheckinsRealtime'
import { ROLE_COLOR_VARS, ROLE_LABELS } from '../lib/roles'
import DonutChart from '../components/DonutChart'

export default function StaffDashboard() {
  const [latestSession, setLatestSession] = useState<MealSession | null>(null)
  const [stats, setStats] = useState<MealStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: sessions } = await supabase
        .from('meal_sessions')
        .select('id, label, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      const session = (sessions?.[0] as MealSession) ?? null
      setLatestSession(session)
      if (!session) {
        setLoading(false)
        return
      }
      setStats(await loadMealStats(session.id))
      setLoading(false)
    }
    load()
  }, [])

  useMealCheckinsRealtime(
    () => {
      if (latestSession) loadMealStats(latestSession.id).then(setStats)
    },
    latestSession ? { column: 'meal_session_id', value: latestSession.id } : undefined,
  )

  return (
    <div className="staff-home">
      <h1>Dashboard</h1>

      {loading && (
        <div className="staff-loading-rows">
          <div className="skeleton-line" style={{ width: '60%', height: 20 }} />
          <div className="skeleton-line" style={{ width: '100%', height: 60 }} />
          <div className="skeleton-line" style={{ width: '100%', height: 60 }} />
        </div>
      )}

      {!loading && !latestSession && (
        <p className="staff-home-hint">Todavía no hay comidas registradas.</p>
      )}

      {!loading && latestSession && stats && (
        <>
          <p className="staff-home-hint">Última comida: {latestSession.label}</p>

          <div className="stat-cards">
            <div className="stat-card">
              <p className="stat-card-value">{stats.total}</p>
              <p className="stat-card-label">Participantes</p>
            </div>
            <div className="stat-card">
              <p className="stat-card-value">
                {stats.fed}/{stats.total}
              </p>
              <p className="stat-card-label">Alimentados</p>
            </div>
          </div>

          <div className="dashboard-charts">
            <div className="dashboard-chart-card">
              <p className="staff-meals-label">Progreso de comida</p>
              <DonutChart
                centerValue={stats.total ? `${Math.round((stats.fed / stats.total) * 100)}%` : '0%'}
                centerLabel="alimentados"
                segments={[
                  { label: 'Alimentados', value: stats.fed, color: 'var(--role-paje)' },
                  { label: 'Pendientes', value: stats.total - stats.fed, color: 'var(--border-strong)' },
                ]}
              />
            </div>

            <div className="dashboard-chart-card">
              <p className="staff-meals-label">Participantes por rol</p>
              <DonutChart
                centerValue={String(stats.total)}
                centerLabel="total"
                segments={stats.byRole.map((r) => ({
                  label: ROLE_LABELS[r.role],
                  value: r.count,
                  color: ROLE_COLOR_VARS[r.role],
                }))}
              />
            </div>
          </div>

          <Link to="/staff/comidas" className="staff-entry-link committee-see-all">
            Ver detalle por comité en Comidas →
          </Link>
        </>
      )}
    </div>
  )
}
