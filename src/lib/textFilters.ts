const NEGATIVE_ANSWERS = new Set([
  '',
  'na',
  'no',
  'nop',
  'ninguna',
  'ninguno',
  'no ninguna',
  'no ninguno',
  'sin alergias',
  'sin alergia',
  'ninguna alergia',
  'no tengo',
  'no tengo alergias',
  'no aplica',
])

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\//g, '')
    .replace(/[.,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Los formularios de inscripción son texto libre: mucha gente sin alergia
// escribió "N/A", "No.", "Ningúna", etc. en vez de dejarlo vacío. Sin este
// filtro, esas respuestas disparan la alerta roja de alergia igual que una
// alergia real.
export function hasMeaningfulAnswer(value: string | null | undefined): boolean {
  if (!value) return false
  return !NEGATIVE_ANSWERS.has(normalize(value))
}
