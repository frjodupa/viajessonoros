export const DOMUS_PHONE = '34610056859'
export const ZONE = 'Europe/Madrid'
export const CLASS_STATES = { pendiente: 'Pendiente', confirmada: 'Confirmada', ocupada: 'Sala ocupada', cancelada: 'Cancelada' }
export const GROUP_STATES = { en_formacion: 'En formación', confirmado: 'Confirmado', activo: 'Activo', finalizado: 'Finalizado', cancelado: 'Cancelado' }
export const MODES = { clase_suelta: 'Clase suelta · 30 € / 90 min', bono4: 'Bono 4 clases · 100 €', bono8: 'Bono 8 clases · 180 €', infantil: 'Taller infantil', taller: 'Taller' }
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export function madridParts(instant = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(instant))
  const get = type => parts.find(p => p.type === type)?.value
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` }
}
export const todayMadrid = () => madridParts().date
export function addDays(date, n) { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
export function monthDate(date, offset = 0) { const d = new Date(`${date.slice(0, 7)}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + offset); return d.toISOString().slice(0, 10) }
export const formatDate = date => new Intl.DateTimeFormat('es-ES', { timeZone: ZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date.slice(0, 10)}T12:00:00Z`))
export const formatClass = row => `${formatDate(madridParts(row.inicio).date)} · ${madridParts(row.inicio).time}–${madridParts(row.fin).time}`
export function classifyAges(ages, adultAge = 18) {
  if (!ages.length) return 'Por determinar'
  return ages.every(n => n < adultAge) ? 'Niños' : ages.every(n => n >= adultAge) ? 'Adultos' : 'Mixto'
}
export function phoneDigits(raw) {
  let digits = String(raw ?? '').trim().replace(/[\s().-]/g, '')
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`
  if (!/^\+?\d{9,15}$/.test(digits)) throw new Error('Introduce un teléfono válido con prefijo internacional si no es español.')
  digits = digits.replace(/^\+/, '')
  return digits.length === 9 ? `34${digits}` : digits
}
export const whatsappURL = (phone, message) => `https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(message)}`
export function confirmedClasses(classes, groupId) { return classes.filter(c => c.grupo_id === groupId && c.estado === 'confirmada').sort((a, b) => a.inicio.localeCompare(b.inicio)) }
export function groupMessage({ kind, contact, group, classes, rooms, config, selectedClass }) {
  if (!group && !['inscripcion', 'ubicacion'].includes(kind)) throw new Error('Selecciona un grupo para esta comunicación.')
  const confirmed = group ? confirmedClasses(classes, group.id) : []
  const titles = { inscripcion: 'Inscripción en Talleres Domus', formado: 'Grupo de Talleres Domus formado', calendario: 'Calendario de Talleres Domus', primera: 'Recordatorio de la primera clase', cambio: 'Cambio de horario', cancelacion: 'Cancelación de sesión', ubicacion: 'Ubicación del taller' }
  if (!titles[kind]) throw new Error('Selecciona una comunicación.')
  if (['formado', 'calendario', 'primera'].includes(kind) && !['confirmado', 'activo'].includes(group.estado)) throw new Error('El grupo todavía no está confirmado.')
  if (['cambio', 'cancelacion'].includes(kind) && (!selectedClass || selectedClass.grupo_id !== group.id)) throw new Error('Selecciona la sesión afectada.')
  if (kind === 'cancelacion' && selectedClass.estado !== 'cancelada') throw new Error('Cancela primero la sesión en la agenda.')
  if (kind === 'cambio' && selectedClass.estado !== 'confirmada') throw new Error('Guarda y confirma el nuevo horario antes de comunicarlo.')
  const lines = [`Hola, ${contact.nombre}.`, titles[kind], ...(group ? [`Grupo: ${group.nombre}`] : []), `Profesor: ${group?.profesor || config.profesor}`]
  if (kind === 'inscripcion') lines.push(contact.estado === 'confirmada' ? 'Tu inscripción consta como confirmada.' : 'Hemos recibido tu solicitud. La inscripción sigue pendiente de confirmación.')
  if (kind === 'formado') lines.push('El grupo está formado. Estas son las clases confirmadas:')
  let list = confirmed
  if (kind === 'primera') {
    list = confirmed.filter(c => c.primera).slice(0, 1)
    if (!list.length) throw new Error('No hay una primera clase confirmada.')
  }
  if (['cambio', 'cancelacion'].includes(kind)) list = [selectedClass]
  if (!['inscripcion', 'ubicacion'].includes(kind)) {
    if (!list.length) lines.push('Todavía no hay fechas confirmadas.')
    for (const c of list) {
      const room = rooms.find(r => r.id === c.sala_id)
      lines.push(`${kind === 'cancelacion' ? 'CANCELADA · ' : ''}${c.primera ? 'Primera clase · ' : ''}${formatClass(c)}`, `Sala: ${room?.nombre || 'Por confirmar'}`, `Lugar: ${room?.direccion || config.lugar}`)
      if (c.nota_publica) lines.push(c.nota_publica)
    }
  }
  if (['inscripcion', 'ubicacion'].includes(kind)) lines.push(`Lugar: ${rooms.find(r => r.id === group?.sala_id)?.direccion || config.lugar}`)
  lines.push('Contacto de Viajes Sonoros: 610 056 859. Los horarios se indican en hora de Cáceres.')
  return lines.join('\n')
}
export function overlaps(a, b) { return a.estado !== 'cancelada' && b.estado !== 'cancelada' && a.inicio < b.fin && b.inicio < a.fin && (a.sala_id === b.sala_id || (a.grupo_id && a.grupo_id === b.grupo_id)) }
export function calendarHTML(classes, cursor, view = 'month', admin = false, groups = [], rooms = []) {
  let from, to
  if (view === 'week') { const day = new Date(`${cursor}T12:00:00Z`).getUTCDay(); from = addDays(cursor, -((day + 6) % 7)); to = addDays(from, 7) }
  else { from = monthDate(cursor); to = monthDate(cursor, 1) }
  const filtered = classes.filter(c => { const d = madridParts(c.inicio).date; return d >= from && d < to }).sort((a, b) => a.inicio.localeCompare(b.inicio))
  const e = escapeHTML
  const item = c => {
    const state = admin ? c.estado : 'confirmada'
    const group = admin ? groups.find(g => g.id === c.grupo_id)?.nombre : 'Taller Domus'
    const room = admin ? rooms.find(r => r.id === c.sala_id)?.nombre : c.sala
    const inner = `<strong>${e(madridParts(c.inicio).time)}–${e(madridParts(c.fin).time)}</strong> ${e(group || 'Ocupación de sala')}<span>${e(CLASS_STATES[state])}${c.primera ? ' · Primera clase' : ''}${admin && c.publico ? ' · Publicación activada' : ''}</span><small>${e(room || '')}</small>`
    return admin ? `<button type="button" class="domus-slot ${e(state)}" data-class="${e(c.id)}">${inner}</button>` : `<div class="domus-slot ${e(state)}">${inner}${c.nota_publica ? `<small>${e(c.nota_publica)}</small>` : ''}</div>`
  }
  if (view === 'list') return filtered.length ? `<ol class="domus-calendar-list">${filtered.map(c => `<li><h3>${e(formatDate(madridParts(c.inicio).date))}</h3>${item(c)}</li>`).join('')}</ol>` : '<p class="domus-empty">No hay clases en este mes.</p>'
  const cells = []
  if (view === 'month') { const offset = (new Date(`${from}T12:00:00Z`).getUTCDay() + 6) % 7; for (let i = 0; i < offset; i++) cells.push('<div class="domus-day domus-day-empty" aria-hidden="true"></div>') }
  for (let date = from; date < to; date = addDays(date, 1)) {
    const day = new Date(`${date}T12:00:00Z`).getUTCDay(), weekend = day === 0 || day === 6
    cells.push(`<div class="domus-day${weekend ? ' weekend' : ''}${date === todayMadrid() ? ' today' : ''}"><time datetime="${date}"><span class="domus-mobile-date">${e(new Intl.DateTimeFormat('es-ES', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)))} </span>${Number(date.slice(8))}</time>${filtered.filter(c => madridParts(c.inicio).date === date).map(item).join('')}</div>`)
  }
  return `<div class="domus-weekdays" aria-hidden="true">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<span>${d}</span>`).join('')}</div><div class="domus-calendar-grid">${cells.join('')}</div>`
}
export function friendlyError(error) {
  if (error?.code === '23P01') return 'Ese horario se solapa con otra clase u ocupación de la sala o del grupo. Elige otra hora o sala.'
  if (error?.code === '23505') return 'Ya existe ese registro. Actualiza la agenda antes de repetir la operación.'
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error?.code)) return 'El módulo Domus todavía no está activado en la base de datos. La migración requiere revisión y autorización.'
  if (error?.code === '42501') return 'No tienes permiso para esta operación.'
  return error?.message || 'No se ha podido completar la operación. Comprueba la conexión y actualiza los datos.'
}
