import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type Participant, type MealSession } from '../lib/supabase'
import { ROLE_COLOR_VARS, roleLabel } from '../lib/roles'
import Icon from '../components/Icon'

export default function StaffHome() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Participant[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)

  const [latestSession, setLatestSession] = useState<MealSession | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [fedCount, setFedCount] = useState(0)
  const [loadingAlert, setLoadingAlert] = useState(true)
  const [pending, setPending] = useState<Participant[] | null>(null)
  const [loadingPending, setLoadingPending] = useState(false)

  useEffect(() => {
    async function loadAlert() {
      setLoadingAlert(true)
      const { data: sessions } = await supabase
        .from('meal_sessions')
        .select('id, label, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      const session = (sessions?.[0] as MealSession) ?? null
      setLatestSession(session)
      if (!session) {
        setLoadingAlert(false)
        return
      }

      const [{ count: total }, { count: fed }] = await Promise.all([
        supabase.from('participants').select('id', { count: 'exact', head: true }),
        supabase
          .from('meal_checkins')
          .select('id', { count: 'exact', head: true })
          .eq('meal_session_id', session.id),
      ])
      setTotalCount(total ?? 0)
      setFedCount(fed ?? 0)
      setLoadingAlert(false)
    }
    loadAlert()
  }, [])

  async function handleShowPending() {
    if (!latestSession) return
    setLoadingPending(true)
    const { data: checkins } = await supabase
      .from('meal_checkins')
      .select('participant_id')
      .eq('meal_session_id', latestSession.id)
    const fedIds = new Set((checkins ?? []).map((c) => c.participant_id as string))

    const { data: all } = await supabase
      .from('participants')
      .select('*')
      .order('full_name')
    setPending(((all as Participant[]) ?? []).filter((p) => !fedIds.has(p.id)))
    setLoadingPending(false)
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    const term = query.trim()
    if (!term) return
    setSearching(true)
    const { data } = await supabase
      .from('participants')
      .select('*')
      .ilike('full_name', `%${term}%`)
      .order('full_name')
      .limit(20)
    setResults((data as Participant[]) ?? [])
    setSearched(true)
    setSearching(false)
  }

  return (
    <div className="profile-page">
      <div className="staff-home">
        <div className="staff-home-header">
          <p className="credential-eyebrow">Panel de staff · PAZMUN 2026</p>
          <button
            type="button"
            className="staff-link-button"
            onClick={() => supabase.auth.signOut()}
          >
            <Icon name="logout" />
            Cerrar sesión
          </button>
        </div>

        {loadingAlert && (
          <div className="staff-loading-rows">
            <div className="skeleton-line" style={{ width: '60%' }} />
            <div className="skeleton-line" style={{ width: '40%', height: 20 }} />
          </div>
        )}

        {!loadingAlert && latestSession && (
          <div className="staff-alert-card">
            <p className="staff-meals-label">Última comida: {latestSession.label}</p>
            <p className="staff-alert-count">
              {fedCount} de {totalCount} alimentados
            </p>
            {pending === null ? (
              <button type="button" className="staff-link-button" onClick={handleShowPending}>
                {loadingPending ? 'Cargando…' : 'Ver pendientes'}
              </button>
            ) : (
              <ul className="staff-results">
                {pending.map((p) => (
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
                          {p.committee ? ` · ${p.committee}` : ''}
                          {p.allergy && <Icon name="alert" />}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                {pending.length === 0 && <p className="staff-home-hint">Todos alimentados.</p>}
              </ul>
            )}
          </div>
        )}

        <h1>Buscar participante</h1>
        <p className="staff-home-hint">
          Escanea la credencial de un participante o busca su nombre.
        </p>

        <form onSubmit={handleSearch} className="staff-search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre del participante"
          />
          <button type="submit" disabled={searching}>
            <Icon name="search" />
            {searching ? 'Buscando…' : 'Buscar'}
          </button>
        </form>

        {searched && results.length === 0 && (
          <p className="staff-home-hint">Sin resultados.</p>
        )}

        {results.length > 0 && (
          <ul className="staff-results">
            {results.map((p) => (
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
                      {p.committee ? ` · ${p.committee}` : ''}
                      {p.allergy && <Icon name="alert" />}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
