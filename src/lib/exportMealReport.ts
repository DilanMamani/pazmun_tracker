import writeExcelFile from 'write-excel-file/browser'
import type { MealReportRow } from './mealReport'

const header = (text: string) => ({ value: text, fontWeight: 'bold' as const })

function safeFilename(label: string) {
  const stripped = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
  return stripped || 'reporte'
}

export async function exportMealReport(sessionLabel: string, rows: MealReportRow[]) {
  const columns = [
    {
      header: header('Nombre'),
      cell: (r: MealReportRow) => ({ value: r.full_name }),
      width: 30,
    },
    {
      header: header('Comité'),
      cell: (r: MealReportRow) => ({ value: r.committee }),
      width: 30,
    },
    {
      header: header('Rol'),
      cell: (r: MealReportRow) => ({ value: r.role }),
      width: 18,
    },
    {
      header: header('Alimentado'),
      cell: (r: MealReportRow) => ({ value: r.fed ? 'Sí' : 'No' }),
      width: 12,
    },
    {
      header: header('Marcado por'),
      cell: (r: MealReportRow) => ({ value: r.checked_by_email ?? '' }),
      width: 28,
    },
    {
      header: header('Hora'),
      cell: (r: MealReportRow) =>
        r.checked_at
          ? { value: new Date(r.checked_at), type: Date, format: 'dd/mm/yyyy hh:mm' }
          : { value: '' },
      width: 18,
    },
  ]

  await writeExcelFile(rows, { columns }).toFile(`${safeFilename(sessionLabel)}.xlsx`)
}
