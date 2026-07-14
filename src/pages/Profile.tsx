import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, type PublicProfile } from '../lib/supabase'
import { ROLE_COLOR_VARS, roleLabel } from '../lib/roles'
import pazmunLockup from '../assets/pazmun-lockup.png'

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
      {state.status === 'loading' && (
        <div className="skeleton-card" aria-label="Cargando credencial" role="status">
          <div className="skeleton-header" />
          <div className="skeleton-body">
            <div className="skeleton-line" style={{ width: '40%', marginBottom: 12 }} />
            <div className="skeleton-line" style={{ width: '80%', height: 22, marginBottom: 20 }} />
            <div className="skeleton-line" style={{ width: '100%', marginBottom: 10 }} />
            <div className="skeleton-line" style={{ width: '100%', marginBottom: 10 }} />
            <div className="skeleton-line" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {state.status === 'not-found' && (
        <div className="credential-message">
          <h1>Credencial no encontrada</h1>
          <p>Este código QR no corresponde a ningún participante registrado.</p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="credential-message">
          <h1>Error al cargar</h1>
          <p>{state.message}</p>
        </div>
      )}

      {state.status === 'ok' && (
        <div
          className="credential"
          style={{ '--role-color': ROLE_COLOR_VARS[state.profile.role] } as React.CSSProperties}
        >
          <div className="credential-stripe" />
          <div className="credential-main">
            <div className="credential-brand">
              <img src={pazmunLockup} alt="PAZMUN 2026" />
            </div>

            <div className="credential-body">
              <p className="credential-eyebrow">Credencial oficial · PAZMUN 2026</p>
              <h1 className="credential-name">{state.profile.full_name}</h1>
              <p className="credential-role-label">{roleLabel(state.profile)}</p>

              <dl className="credential-rows">
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

            <div className="credential-footer">
              <span>Universidad Católica Boliviana · Sede La Paz</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
