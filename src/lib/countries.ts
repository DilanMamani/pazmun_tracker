// Spanish country names as they appear in the Asignaciones roster -> ISO
// 3166-1 alpha-2, for flag emoji. `assignment` also holds non-country values
// (Bolivian institutions for the Nacional committee, ICJ litigant-team
// labels, press outlets) which just render as plain text.
const COUNTRY_CODES: Record<string, string> = {
  'Alemania': 'DE',
  'Arabia Saudita': 'SA',
  'Australia': 'AU',
  'Bahréin': 'BH',
  'Bangladesh': 'BD',
  'Bolivia': 'BO',
  'Brasil': 'BR',
  'Bélgica': 'BE',
  'Canadá': 'CA',
  'Chad': 'TD',
  'China (República Popular de)': 'CN',
  'Colombia': 'CO',
  'Corea del Norte': 'KP',
  'Corea del Sur': 'KR',
  'Croacia': 'HR',
  'Cuba': 'CU',
  'Dinamarca': 'DK',
  'Egipto': 'EG',
  'El Salvador': 'SV',
  'Emiratos Árabes Unidos': 'AE',
  'Eritrea': 'ER',
  'España': 'ES',
  'Estados Unidos': 'US',
  'Estonia': 'EE',
  'Etiopía': 'ET',
  'Filipinas': 'PH',
  'Finlandia': 'FI',
  'Francia': 'FR',
  'Grecia': 'GR',
  'Guatemala': 'GT',
  'Hungría': 'HU',
  'India': 'IN',
  'Indonesia': 'ID',
  'Irlanda': 'IE',
  'Irán': 'IR',
  'Israel': 'IL',
  'Italia': 'IT',
  'Japón': 'JP',
  'Letonia': 'LV',
  'Liberia': 'LR',
  'Mali': 'ML',
  'Mauritania': 'MR',
  'México': 'MX',
  'Nigeria': 'NG',
  'Noruega': 'NO',
  'Pakistán': 'PK',
  'Panamá': 'PA',
  'Países Bajos': 'NL',
  'Perú': 'PE',
  'Polonia': 'PL',
  'Portugal': 'PT',
  'Reino Unido': 'GB',
  'República Checa': 'CZ',
  'República Democrática del Congo': 'CD',
  'Ruanda': 'RW',
  'Rumanía': 'RO',
  'Rusia': 'RU',
  'Serbia': 'RS',
  'Singapur': 'SG',
  'Somalia': 'SO',
  'Sudáfrica': 'ZA',
  'Sudán': 'SD',
  'Sudán del Sur': 'SS',
  'Suecia': 'SE',
  'Suiza': 'CH',
  'Tanzania': 'TZ',
  'Turquía': 'TR',
  'Ucrania': 'UA',
}

function flagEmoji(iso2: string) {
  return String.fromCodePoint(...[...iso2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

// `assignment` can be a bare country ("Francia") or a compound label that
// names one ("Demandante Agente 1 Croacia") — match either way.
export function assignmentFlag(assignment: string): string | null {
  if (COUNTRY_CODES[assignment]) return flagEmoji(COUNTRY_CODES[assignment])
  for (const [name, code] of Object.entries(COUNTRY_CODES)) {
    if (assignment.includes(name)) return flagEmoji(code)
  }
  return null
}
