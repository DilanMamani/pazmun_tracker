import { useEffect, useState } from 'react'
import { supabase, type Participant, type MealSession } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import { useMealCheckinsRealtime } from '../lib/useMealCheckinsRealtime'
import { hasMeaningfulAnswer } from '../lib/textFilters'
import Icon from './Icon'

type CheckinInfo = { checkedAt: string; email: string | null }

function formatCheckinTime(iso: string) {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StaffPanel({ participant }: { participant: Participant }) {
  const { staffRole, session } = useSession()
  const canEdit = staffRole === 'staff' || staffRole === 'admin'
  const [sessions, setSessions] = useState<MealSession[]>([])
  const [checkins, setCheckins] = useState<Map<string, CheckinInfo>>(new Map())
  const [pendingId, setPendingId] = useState<string | null>(null)

  const [notes, setNotes] = useState(participant.notes ?? '')
  const [notesSaveState, setNotesSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function loadSessions() {
    const [{ data: sessionData }, { data: checkinData }] = await Promise.all([
      supabase
        .from('meal_sessions')
        .select('id, label, created_at, starts_at, ends_at')
        .order('starts_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true }),
      supabase
        .from('meal_checkins')
        .select('meal_session_id, checked_at, checked_by_email')
        .eq('participant_id', participant.id),
    ])
    setSessions((sessionData as MealSession[]) ?? [])
    setCheckins(
      new Map(
        (checkinData ?? []).map((c) => [
          c.meal_session_id as string,
          { checkedAt: c.checked_at as string, email: c.checked_by_email as string | null },
        ]),
      ),
    )
  }

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant.id])

  useMealCheckinsRealtime(
    (payload) => {
      const { meal_session_id, checked_at, checked_by_email } = payload.new
      setCheckins((prev) =>
        new Map(prev).set(meal_session_id, { checkedAt: checked_at, email: checked_by_email }),
      )
    },
    { column: 'participant_id', value: participant.id },
  )

  async function handleCheckin(sessionId: string) {
    setPendingId(sessionId)
    const { error } = await supabase.rpc('staff_checkin_meal', {
      p_qr_code: participant.qr_code,
      p_meal_session_id: sessionId,
    })
    if (!error) {
      setCheckins((prev) =>
        new Map(prev).set(sessionId, {
          checkedAt: new Date().toISOString(),
          email: session?.user.email ?? null,
        }),
      )
    }
    setPendingId(null)
  }

  async function handleSaveNotes() {
    setNotesSaveState('saving')
    const { error } = await supabase.rpc('staff_update_notes', {
      p_qr_code: participant.qr_code,
      p_notes: notes || null,
    })
    setNotesSaveState(error ? 'error' : 'saved')
  }

  const notesDirty = notes !== (participant.notes ?? '')

  return (
    <div className="staff-panel">
      <p className="staff-panel-eyebrow">Solo staff</p>

      {hasMeaningfulAnswer(participant.allergy) ? (
        <div className="staff-alert">
          <strong>
            <Icon name="alert" />
            Alergia
          </strong>
          <span>{participant.allergy}</span>
        </div>
      ) : (
        <div className="staff-row">
          <dt>Alergia</dt>
          <dd className="staff-row-muted">No especificado</dd>
        </div>
      )}

      {hasMeaningfulAnswer(participant.diet) && (
        <div className="staff-row">
          <dt>Dieta</dt>
          <dd>{participant.diet}</dd>
        </div>
      )}

      <div className="staff-meals">
        <p className="staff-meals-label">Comidas</p>

        {sessions.length === 0 && (
          <p className="staff-home-hint">Todavía no hay comidas registradas.</p>
        )}

        <ul className="staff-meal-list">
          {sessions.map((s) => {
            const info = checkins.get(s.id)
            const done = !!info
            if (!canEdit) {
              return (
                <li key={s.id}>
                  <span className={done ? 'checked' : ''}>
                    <span className="staff-meal-name">
                      <Icon name={done ? 'check-circle' : 'circle'} className="staff-meal-icon" />
                      {s.label}
                    </span>
                    <span className="staff-meal-status">{done ? 'Alimentado' : 'Pendiente'}</span>
                  </span>
                  {info && (
                    <p className="staff-meal-by">
                      Marcado por {info.email ?? 'staff sin registrar'} · {formatCheckinTime(info.checkedAt)}
                    </p>
                  )}
                </li>
              )
            }
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={done ? 'checked' : ''}
                  disabled={done || pendingId === s.id}
                  onClick={() => handleCheckin(s.id)}
                >
                  <span className="staff-meal-name">
                    <Icon name={done ? 'check-circle' : 'circle'} className="staff-meal-icon" />
                    {s.label}
                  </span>
                  <span className="staff-meal-status">
                    {done ? 'Alimentado' : pendingId === s.id ? 'Marcando…' : 'Marcar'}
                  </span>
                </button>
                {info && (
                  <p className="staff-meal-by">
                    Marcado por {info.email ?? 'staff sin registrar'} · {formatCheckinTime(info.checkedAt)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <label className="staff-notes-label">
        Notas
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setNotesSaveState('idle')
          }}
          rows={3}
          placeholder="Sin notas"
          readOnly={!canEdit}
        />
      </label>

      {canEdit && (
        <div className="staff-panel-actions">
          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={!notesDirty || notesSaveState === 'saving'}
          >
            {notesSaveState === 'saving' ? 'Guardando…' : 'Guardar notas'}
          </button>
          {notesSaveState === 'saved' && !notesDirty && <span className="staff-save-ok">Guardado</span>}
          {notesSaveState === 'error' && <span className="staff-save-error">Error al guardar</span>}
        </div>
      )}
    </div>
  )
}
