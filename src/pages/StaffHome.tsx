import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type Participant } from '../lib/supabase'
import { roleLabel } from '../lib/roles'

export default function StaffHome() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Participant[]>([])
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    const term = query.trim()
    if (!term) return
    const { data } = await supabase
      .from('participants')
      .select('*')
      .ilike('full_name', `%${term}%`)
      .order('full_name')
      .limit(20)
    setResults((data as Participant[]) ?? [])
    setSearched(true)
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
            Cerrar sesión
          </button>
        </div>

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
          <button type="submit">Buscar</button>
        </form>

        {searched && results.length === 0 && (
          <p className="staff-home-hint">Sin resultados.</p>
        )}

        {results.length > 0 && (
          <ul className="staff-results">
            {results.map((p) => (
              <li key={p.id}>
                <Link to={`/p/${p.qr_code}`}>
                  <span className="staff-result-name">{p.full_name}</span>
                  <span className="staff-result-meta">
                    {roleLabel(p)}
                    {p.committee ? ` · ${p.committee}` : ''}
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
