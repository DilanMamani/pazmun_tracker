import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, type Participant, type PublicProfile } from '../lib/supabase'
import { ROLE_COLOR_VARS, roleLabel } from '../lib/roles'
import { useSession } from '../lib/useSession'
import pazmunLockup from '../assets/pazmun-lockup.png'
import Avatar from '../components/Avatar'
import StaffPanel from '../components/StaffPanel'

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ok'; profile: PublicProfile | Participant; staff: boolean }

export default function Profile() {
  const { code } = useParams<{ code: string }>()
  const { session, loading: sessionLoading } = useSession()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    if (!code || sessionLoading) return
    let cancelled = false
    const staff = !!session

    const query = staff
      ? supabase.from('participants').select('*').eq('qr_code', code).maybeSingle()
      : supabase.from('public_profile').select('*').eq('qr_code', code).maybeSingle()

    query.then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setState({ status: 'error', message: error.message })
      } else if (!data) {
        setState({ status: 'not-found' })
      } else {
        setState({ status: 'ok', profile: data as PublicProfile | Participant, staff })
      }
    })

    return () => {
      cancelled = true
    }
  }, [code, session, sessionLoading])

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
        <div className="profile-stack">
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

                <div className="credential-identity">
                  <Avatar src={state.profile.photo_url} name={state.profile.full_name} />
                  <div>
                    <h1 className="credential-name">{state.profile.full_name}</h1>
                    <p className="credential-role-label">{roleLabel(state.profile)}</p>
                  </div>
                </div>

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

          {state.staff && <StaffPanel participant={state.profile as Participant} />}

          {!state.staff && (
            <Link to="/staff/login" className="staff-entry-link">
              Acceso de staff
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
