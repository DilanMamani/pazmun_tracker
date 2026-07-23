import { useEffect, useState, type FormEvent } from 'react'
import { supabase, type Participant, type MealSession } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import Icon from './Icon'

export default function StaffPanel({ participant }: { participant: Participant }) {
  const { staffRole } = useSession()
  const canEdit = staffRole === 'staff' || staffRole === 'admin'
  const [sessions, setSessions] = useState<MealSession[]>([])
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set())
  const [pendingId, setPendingId] = useState<string | null>(null)

  const [notes, setNotes] = useState(participant.notes ?? '')
  const [notesSaveState, setNotesSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [newSessionLabel, setNewSessionLabel] = useState('')
  const [creatingSession, setCreatingSession] = useState(false)

  async function loadSessions() {
    const [{ data: sessionData }, { data: checkinData }] = await Promise.all([
      supabase.from('meal_sessions').select('id, label, created_at').order('created_at'),
      supabase.from('meal_checkins').select('meal_session_id').eq('participant_id', participant.id),
    ])
    setSessions((sessionData as MealSession[]) ?? [])
    setCheckedInIds(new Set((checkinData ?? []).map((c) => c.meal_session_id as string)))
  }

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant.id])

  async function handleCheckin(sessionId: string) {
    setPendingId(sessionId)
    const { error } = await supabase.rpc('staff_checkin_meal', {
      p_qr_code: participant.qr_code,
      p_meal_session_id: sessionId,
    })
    if (!error) setCheckedInIds((prev) => new Set(prev).add(sessionId))
    setPendingId(null)
  }

  async function handleCreateSession(e: FormEvent) {
    e.preventDefault()
    const label = newSessionLabel.trim()
    if (!label) return
    setCreatingSession(true)
    const { error } = await supabase.rpc('staff_create_meal_session', { p_label: label })
    setCreatingSession(false)
    if (!error) {
      setNewSessionLabel('')
      loadSessions()
    }
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

      {participant.allergy && (
        <div className="staff-alert">
          <strong>
            <Icon name="alert" />
            Alergia
          </strong>
          <span>{participant.allergy}</span>
        </div>
      )}

      {participant.diet && (
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
            const done = checkedInIds.has(s.id)
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
              </li>
            )
          })}
        </ul>

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
