import { useState } from 'react'
import { supabase, type Participant, type FoodStatus } from '../lib/supabase'

export default function StaffPanel({ participant }: { participant: Participant }) {
  const [foodStatus, setFoodStatus] = useState<FoodStatus>(participant.food_status)
  const [notes, setNotes] = useState(participant.notes ?? '')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const dirty = foodStatus !== participant.food_status || notes !== (participant.notes ?? '')

  async function handleSave() {
    setSaveState('saving')
    const { error } = await supabase.rpc('staff_update_food_status', {
      p_qr_code: participant.qr_code,
      p_food_status: foodStatus,
      p_notes: notes || null,
    })
    setSaveState(error ? 'error' : 'saved')
  }

  return (
    <div className="staff-panel">
      <p className="staff-panel-eyebrow">Solo staff</p>

      {participant.allergy && (
        <div className="staff-alert">
          <strong>Alergia</strong>
          <span>{participant.allergy}</span>
        </div>
      )}

      {participant.diet && (
        <div className="staff-row">
          <dt>Dieta</dt>
          <dd>{participant.diet}</dd>
        </div>
      )}

      <div className="staff-row">
        <dt>Estado de alimentación</dt>
        <dd>
          <div className="staff-toggle" role="group" aria-label="Estado de alimentación">
            {(['Pendiente', 'Alimentado'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={foodStatus === option ? 'active' : ''}
                onClick={() => {
                  setFoodStatus(option)
                  setSaveState('idle')
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </dd>
      </div>

      <label className="staff-notes-label">
        Notas
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setSaveState('idle')
          }}
          rows={3}
          placeholder="Sin notas"
        />
      </label>

      <div className="staff-panel-actions">
        <button type="button" onClick={handleSave} disabled={!dirty || saveState === 'saving'}>
          {saveState === 'saving' ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {saveState === 'saved' && !dirty && <span className="staff-save-ok">Guardado</span>}
        {saveState === 'error' && <span className="staff-save-error">Error al guardar</span>}
      </div>
    </div>
  )
}
