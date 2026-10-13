import { jsPDF } from 'jspdf'

// Creates a real PDF locally; attendee data never leaves the browser.
export function createBookingPdf(rows, summaries) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16, width = 178, bottom = 278
  let y = margin
  const clean = value => String(value ?? '').replace(/[\r\n\t]+/g, ' ')
  function text(value, { size = 10, bold = false, gap = 3 } = {}) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(clean(value), width)
    const height = size * 0.44
    for (const line of lines) {
      if (y + height > bottom) { doc.addPage(); y = margin }
      doc.text(line, margin, y)
      y += height
    }
    y += gap
  }
  text('Viajes Sonoros', { size: 19, bold: true })
  text('Listado de reservas', { size: 13 })
  text('Reservas canceladas excluidas de los totales. Disponibilidad calculada sobre plazas confirmadas.', { size: 9 })
  for (const summary of summaries) {
    if (y + 40 > bottom) { doc.addPage(); y = margin }
    text(summary.title + ' · ' + summary.date, { size: 13, bold: true })
    text(summary.detail)
    text(summary.contribution)
    for (const row of rows.filter(row => String(row.experiencia_id) === summary.id)) {
      const amount = row.importe_total == null ? 'Por comprobar' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(row.importe_total))
      // Each attendee stays together unless an unusually long name exceeds a page.
      if (y + 30 > bottom) { doc.addPage(); y = margin }
      doc.setDrawColor(210); doc.line(margin, y, margin + width, y); y += 6
      text(row.nombre, { bold: true, size: 11 })
      text('Teléfono: ' + row.telefono + ' · Plazas: ' + row.plazas + ' · Aportación: ' + amount)
      text('Reserva: ' + row.estado + ' · Pago: ' + row.pago_estado, { size: 9 })
    }
    y += 6
  }
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text('Viajes Sonoros · Página ' + page + ' de ' + pages, margin, 289)
  }
  doc.setProperties({ title: 'Viajes Sonoros - Listado de reservas' })
  return doc
}
