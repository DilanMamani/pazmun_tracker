import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, type PublicProfile } from '../lib/supabase'

const ROLE_LABELS: Record<PublicProfile['role'], string> = {
  delegado: 'Delegado/a',
  paje: 'Paje',
  asesor: 'Asesor/a',
  autoridad: 'Autoridad de Comité',
}

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ok'; profile: PublicProfile }

export default function Profile() {
  const { code } = useParams<{ code: string }>()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    if (!code) return
    let cancelled = false

    supabase
      .from('public_profile')
      .select('*')
      .eq('qr_code', code)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setState({ status: 'error', message: error.message })
        } else if (!data) {
          setState({ status: 'not-found' })
        } else {
          setState({ status: 'ok', profile: data as PublicProfile })
        }
      })

    return () => {
      cancelled = true
    }
  }, [code])

  return (
    <div className="profile-page">
      {state.status === 'loading' && <p className="profile-status">Cargando…</p>}

      {state.status === 'not-found' && (
        <div className="profile-card profile-card--error">
          <h1>Credencial no encontrada</h1>
          <p>Este código QR no corresponde a ningún participante registrado.</p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="profile-card profile-card--error">
          <h1>Error al cargar</h1>
          <p>{state.message}</p>
        </div>
      )}

      {state.status === 'ok' && (
        <div className="profile-card">
          <p className="profile-event">PAZMUN 2026</p>
          <h1 className="profile-name">{state.profile.full_name}</h1>
          <p className="profile-role">
            {state.profile.role === 'autoridad' && state.profile.authority_role
              ? state.profile.authority_role
              : ROLE_LABELS[state.profile.role]}
          </p>

          <dl className="profile-details">
            {state.profile.committee && (
              <div>
                <dt>Comité</dt>
                <dd>{state.profile.committee}</dd>
              </div>
            )}
            {state.profile.institution && (
              <div>
                <dt>Institución</dt>
                <dd>{state.profile.institution}</dd>
              </div>
            )}
            {state.profile.city && (
              <div>
                <dt>Ciudad</dt>
                <dd>{state.profile.city}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
