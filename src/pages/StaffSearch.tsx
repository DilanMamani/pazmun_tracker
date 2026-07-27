import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, type Participant } from '../lib/supabase'
import { ROLE_COLOR_VARS, roleLabel } from '../lib/roles'
import { hasMeaningfulAnswer } from '../lib/textFilters'
import Icon from '../components/Icon'
import QrScannerOverlay from '../components/QrScannerOverlay'

export default function StaffSearch() {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Participant[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)

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
    <div className="staff-home">
      <h1>Buscar participante</h1>
      <p className="staff-home-hint">
        Escanea la credencial de un participante o busca su nombre.
      </p>

      <button type="button" className="qr-scan-button" onClick={() => setScanning(true)}>
        <Icon name="qr" />
        Escanear QR
      </button>

      {scanning && (
        <QrScannerOverlay
          onDecode={(pathname) => {
            setScanning(false)
            navigate(pathname)
          }}
          onClose={() => setScanning(false)}
        />
      )}

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

      {searched && results.length === 0 && <p className="staff-home-hint">Sin resultados.</p>}

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
                    {hasMeaningfulAnswer(p.allergy) && <Icon name="alert" />}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
