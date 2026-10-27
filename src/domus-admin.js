import { supabase } from './supabase.js'
import { CLASS_STATES, GROUP_STATES, MODES, escapeHTML as e, calendarHTML, classifyAges, formatClass, formatDate, groupMessage, madridParts, monthDate, todayMadrid, addDays, whatsappURL, friendlyError } from './domus-core.js'
import './domus-calendar.css'
import './domus-admin.css'

const $ = id => document.getElementById(id)
let db = null, cursor = todayMadrid(), loading = 0, messageReady = false
const field = (form, name) => form.elements.namedItem(name)
const value = (form, name) => field(form, name).value.trim()
const notice = (text, error = false) => { $('domus-notice').textContent = text; $('domus-notice').classList.toggle('is-error', error) }
const options = (rows, placeholder, label = row => row.nombre) => `<option value="">${e(placeholder)}</option>${rows.map(row => `<option value="${e(row.id)}">${e(label(row))}</option>`).join('')}`
function setOptions(select, html) { const old = select.value; select.innerHTML = html; if ([...select.options].some(o => o.value === old)) select.value = old }
const groupName = id => db.grupos.find(g => g.id === id)?.nombre || 'Sin grupo'
const roomName = id => db.salas.find(r => r.id === id)?.nombre || 'Sala por confirmar'
const activeMembers = id => db.miembros.filter(m => m.grupo_id === id && m.activo)
const activeGroups = () => db.grupos.filter(g => !['cancelado', 'finalizado'].includes(g.estado))
function switchTab(tab) {
  if (!db) return
  if (!['reservas', 'grupos', 'agenda', 'mensajes', 'salas'].includes(tab)) tab = 'agenda'
  document.querySelectorAll('[data-section]').forEach(section => { section.hidden = section.dataset.section !== tab })
  document.querySelectorAll('[data-tab]').forEach(button => { if (button.dataset.tab === tab) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current') })
  history.replaceState(null, '', `#${tab}`)
}
function showLogin(message) {
  loading++
  db = null
  $('domus-private').hidden = true
  $('domus-logout').hidden = true
  $('domus-login').hidden = false
  for (const id of ['domus-reservations', 'domus-groups', 'domus-rooms', 'domus-calendar', 'domus-metrics']) $(id).replaceChildren()
  $('domus-print').replaceChildren()
  for (const selector of ['#domus-group-form [name=sala_id]', '#domus-class-form [name=grupo_id]', '#domus-class-form [name=sala_id]', '#domus-calendar-group', '#domus-calendar-room']) document.querySelector(selector).replaceChildren()
  for (const id of ['domus-message-contact', 'domus-message-group', 'domus-message-class']) $(id).replaceChildren()
  $('domus-message-preview').value = ''
  clearMessage()
  for (const form of $('domus-private').querySelectorAll('form')) form.reset()
  notice(message)
}
async function load() {
  const token = ++loading
  notice('Consultando el módulo privado de Domus…')
  const auth = await supabase.auth.getUser()
  if (token !== loading) return
  if (auth.error || !auth.data?.user) { showLogin('Inicia sesión para gestionar los Talleres Domus.'); return }
  const { data, error } = await supabase.rpc('domus_admin_datos').abortSignal(AbortSignal.timeout(15000))
  if (token !== loading) return
  if (error) {
    if (error.code === '42501') { showLogin('Esta cuenta no tiene acceso administrativo a Talleres Domus.'); return }
    throw error
  }
  db = data
  if (!db?.config) throw new Error('No se ha recibido la configuración de Domus.')
  $('domus-login').hidden = true
  $('domus-password').value = ''
  $('domus-private').hidden = false
  $('domus-logout').hidden = false
  render()
  switchTab(location.hash.slice(1) || 'agenda')
  notice('Datos de Talleres Domus actualizados. Las reservas y experiencias generales se gestionan por separado.')
}
async function perform(button, work) {
  if (button?.disabled) return
  if (button) button.disabled = true
  try { await work(); await load() }
  catch (error) { notice(friendlyError(error), true) }
  finally { if (button) button.disabled = false }
}
async function check(query) { const { data, error } = await query; if (error) throw error; return data }
async function updateRow(table, id, changes, previous) {
  let query = supabase.from(table).update(changes).eq('id', id)
  if (previous) query = query.eq('actualizado_en', previous)
  const row = await check(query.select('id').maybeSingle())
  if (!row) throw new Error('El registro cambió en otro dispositivo. Actualiza antes de volver a guardar.')
}
function fill(form, row) {
  form.reset()
  for (const [key, val] of Object.entries(row)) {
    const node = field(form, key)
    if (node) { if (node.type === 'checkbox') node.checked = Boolean(val); else node.value = val ?? '' }
  }
}
function render() {
  const now = new Date().toISOString()
  const metrics = [[db.grupos.filter(g => g.estado === 'en_formacion').length, 'Grupos en formación'], [db.grupos.filter(g => ['confirmado', 'activo'].includes(g.estado)).length, 'Grupos confirmados / activos'], [db.participantes.filter(p => db.reservas.some(r => r.id === p.reserva_id && !['cancelada', 'aplazada'].includes(r.estado))).length, 'Participantes inscritos'], [db.clases.filter(c => c.estado === 'confirmada' && c.inicio >= now).length, 'Próximas clases confirmadas'], [db.clases.filter(c => c.estado === 'ocupada' && c.fin >= now).length, 'Ocupaciones de sala']]
  $('domus-metrics').innerHTML = metrics.map(([n, label]) => `<article><strong>${n}</strong><span>${label}</span></article>`).join('')
  const allGroups = options(db.grupos, 'Sin grupo / ocupación de sala')
  const allRooms = options(db.salas, 'Selecciona una sala', r => `${r.nombre}${r.activa ? '' : ' (inactiva)'}`)
  setOptions(field($('domus-class-form'), 'grupo_id'), allGroups)
  setOptions(field($('domus-class-form'), 'sala_id'), allRooms)
  setOptions(field($('domus-group-form'), 'sala_id'), options(db.salas.filter(r => r.activa), 'Por confirmar'))
  setOptions($('domus-calendar-group'), options(db.grupos, 'Todos los grupos'))
  setOptions($('domus-calendar-room'), options(db.salas, 'Todas las salas'))
  setOptions($('domus-message-group'), options(db.grupos, 'Sin grupo (inscripción o ubicación)'))
  fill($('domus-config-form'), db.config)
  renderReservations()
  renderGroups()
  renderCalendar()
  renderRooms()
  renderMessageContacts()
}
function renderReservations() {
  if (!db) return
  const search = $('domus-search').value.trim().toLocaleLowerCase('es'), state = $('domus-reservation-filter').value
  const rows = db.reservas.filter(r => (state === 'all' || state === r.estado) && `${r.nombre} ${r.telefono}`.toLocaleLowerCase('es').includes(search))
  $('domus-reservations').innerHTML = rows.length ? rows.map(r => {
    const people = db.participantes.filter(p => p.reserva_id === r.id).sort((a, b) => a.orden - b.orden)
    return `<article class="domus-record" id="reserva-${e(r.id)}"><h3>${e(r.nombre)}</h3><p>Contacto: ${e(r.telefono)} · ${r.numero_participantes} participante(s) · ${e(MODES[r.modalidad])}</p><p>Estado de la inscripción: <strong>${e(r.estado)}</strong> · ${e(classifyAges(people.map(p => p.edad), db.config.edad_adultos))} (orientativo)</p><p>Preferencias: ${e(r.preferencias || 'Por confirmar')}</p>${r.observaciones ? `<p>Observaciones privadas: ${e(r.observaciones)}</p>` : ''}<small>Referencia: ${e(r.id)}</small><details><summary>Editar contacto y estado de la reserva</summary><form data-reservation-form="${e(r.id)}"><div class="domus-fields"><label>Nombre de contacto<input name="nombre" required minlength="2" maxlength="100" value="${e(r.nombre)}"></label><label>Teléfono<input name="telefono" type="tel" required value="${e(r.telefono)}"></label><label>Estado de la reserva<select name="estado">${['pendiente', 'confirmada', 'aplazada', 'cancelada'].map(s => `<option ${s === r.estado ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label class="domus-check wide"><input name="responsable_adulto" type="checkbox" ${r.responsable_adulto ? 'checked' : ''}>La inscripción y las comunicaciones de menores están a cargo de un adulto responsable</label></div><button type="submit">Guardar reserva Domus</button></form></details><details><summary>Participantes, edades y asignación de grupos</summary>${people.map(p => {
      const memberships = db.miembros.filter(m => m.participante_id === p.id && m.activo)
      return `<div class="domus-person" data-person="${e(p.id)}"><form data-person-form="${e(p.id)}"><div class="domus-fields"><label>Nombre o referencia del participante<input name="nombre" required maxlength="100" value="${e(p.nombre)}"></label><label>Edad<input name="edad" required type="number" min="0" max="120" value="${p.edad}"></label></div><button type="submit" class="secondary">Guardar participante</button></form><p>Grupos: ${memberships.map(m => e(groupName(m.grupo_id))).join(', ') || 'Sin asignar'}</p><div class="domus-fields"><label>Grupo de destino<select data-destination>${options(activeGroups(), 'Selecciona un grupo')}</select></label><label>Asignación<select data-source><option value="">Añadir al grupo manteniendo las asignaciones actuales</option>${memberships.map(m => `<option value="${e(m.grupo_id)}">Mover desde ${e(groupName(m.grupo_id))}</option>`).join('')}</select></label></div><button type="button" data-assign="${e(p.id)}" ${['cancelada', 'aplazada'].includes(r.estado) ? 'disabled' : ''}>Asignar participante</button><p><small>Se conserva su inscripción original. Una persona puede pertenecer a varios grupos.</small></p></div>`
    }).join('')}</details></article>`
  }).join('') : '<p>No hay solicitudes que coincidan con el filtro.</p>'
}
function renderGroups() {
  $('domus-groups').innerHTML = db.grupos.length ? db.grupos.map(g => {
    const members = activeMembers(g.id), classes = db.clases.filter(c => c.grupo_id === g.id)
    return `<article class="domus-record"><h3>${e(g.nombre)}</h3><p>${e({ ninos: 'Niños', adultos: 'Adultos', mixto: 'Mixto' }[g.tipo])} · ${e(g.modalidad)} · <strong>${e(GROUP_STATES[g.estado])}</strong></p><p>${members.length} participante(s) asignado(s) · Profesor: ${e(g.profesor)}</p><p>Inicio: ${g.fecha_inicio ? e(formatDate(g.fecha_inicio)) : 'Por confirmar'} · Sala habitual: ${e(roomName(g.sala_id))}</p><p>Horario: ${e(g.horarios || 'Por confirmar')}</p><small>Identificador: ${e(g.id)}</small><div class="domus-actions"><button type="button" data-edit-group="${e(g.id)}">Editar grupo</button><button type="button" class="secondary" data-group-calendar="${e(g.id)}">Ver clases</button><button type="button" class="secondary" data-group-message="${e(g.id)}">Preparar WhatsApp</button></div><details><summary>Personas inscritas y clases (${classes.length})</summary>${members.length ? members.map(m => {
      const p = db.participantes.find(p => p.id === m.participante_id), r = db.reservas.find(r => r.id === p.reserva_id)
      return `<div class="domus-person"><strong>${e(p.nombre)} · ${p.edad} años</strong><p>Contacto: ${e(r.nombre)} · ${e(r.telefono)} · Reserva ${e(r.estado)}</p><small>Reserva original: ${e(r.id)}</small><div class="domus-actions"><button type="button" class="secondary" data-open-reservation="${e(r.id)}">Ver inscripción original</button><button type="button" class="secondary" data-remove-member="${e(p.id)}" data-group="${e(g.id)}">Retirar de este grupo</button></div></div>`
    }).join('') : '<p>Todavía no hay participantes asignados.</p>'}${classes.map(c => `<p>${e(formatClass(c))} · ${e(CLASS_STATES[c.estado])}${c.primera ? ' · Primera clase' : ''}</p>`).join('')}</details></article>`
  }).join('') : '<p>No hay grupos. Crea el primero y asigna las personas inscritas desde Reservas.</p>'
}
function filteredClasses() { return db.clases.filter(c => (!$('domus-calendar-group').value || c.grupo_id === $('domus-calendar-group').value) && (!$('domus-calendar-room').value || c.sala_id === $('domus-calendar-room').value)) }
function periodClasses() {
  const week = $('domus-calendar-view').value === 'week'
  const day = new Date(`${cursor}T12:00:00Z`).getUTCDay()
  const start = week ? addDays(cursor, -((day + 6) % 7)) : monthDate(cursor)
  const end = week ? addDays(start, 7) : monthDate(cursor, 1)
  return filteredClasses().filter(c => { const day = madridParts(c.inicio).date; return day >= start && day < end })
}
function renderCalendar() {
  const view = $('domus-calendar-view').value
  $('domus-period').textContent = view === 'week' ? `Semana del ${formatDate(addDays(cursor, -((new Date(`${cursor}T12:00:00Z`).getUTCDay() + 6) % 7)))}` : new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${monthDate(cursor)}T12:00:00Z`))
  $('domus-calendar').innerHTML = calendarHTML(filteredClasses(), cursor, view, true, db.grupos, db.salas)
}
function openGroup(id = '') {
  switchTab('grupos')
  const form = $('domus-group-form'), group = db.grupos.find(g => g.id === id)
  fill(form, group || { id: '', profesor: db.config.profesor, tipo: 'adultos', estado: 'en_formacion', modalidad: 'taller' })
  $('domus-group-heading').textContent = group ? 'Editar grupo' : 'Nuevo grupo'
  form.hidden = false
  form.scrollIntoView({ block: 'start', behavior: 'smooth' })
}
function openClass(id = '', busy = false, postpone = false) {
  switchTab('agenda')
  const form = $('domus-class-form'), row = db.clases.find(c => c.id === id)
  const defaults = { id: '', grupo_id: $('domus-calendar-group').value, sala_id: $('domus-calendar-room').value || db.salas.find(r => r.activa)?.id || '', fecha: cursor, hora_inicio: '18:00', hora_fin: '19:30', estado: busy ? 'ocupada' : 'pendiente', primera: false, publico: false }
  const data = row ? { ...row, fecha: madridParts(row.inicio).date, hora_inicio: madridParts(row.inicio).time, hora_fin: madridParts(row.fin).time } : defaults
  if (postpone) { data.fecha = ''; data.estado = 'pendiente'; data.publico = false }
  fill(form, data)
  $('domus-class-heading').textContent = postpone ? 'Aplazar clase: indica la nueva fecha' : row ? 'Editar clase' : busy ? 'Marcar sala ocupada' : 'Nueva clase'
  const old = form.querySelector('[data-class-actions]'); if (old) old.remove()
  if (row && row.estado !== 'cancelada') {
    const actions = document.createElement('div'); actions.dataset.classActions = ''; actions.className = 'domus-actions'
    actions.innerHTML = `<button type="button" class="secondary" data-postpone="${e(row.id)}">Aplazar clase</button><button type="button" class="secondary" data-cancel-class="${e(row.id)}">Cancelar clase</button>`
    form.append(actions)
  }
  form.hidden = false
  classFeedback()
  form.scrollIntoView({ block: 'start', behavior: 'smooth' })
}
function classPayload(row) { return { ...row, fecha: madridParts(row.inicio).date, hora_inicio: madridParts(row.inicio).time, hora_fin: madridParts(row.fin).time } }
function classFeedback() {
  if (!db) return
  const form = $('domus-class-form'), state = value(form, 'estado'), publish = field(form, 'publico')
  publish.disabled = state !== 'confirmada'
  if (publish.disabled) publish.checked = false
  const date = value(form, 'fecha'), start = value(form, 'hora_inicio'), end = value(form, 'hora_fin'), room = value(form, 'sala_id'), group = value(form, 'grupo_id')
  field(form, 'grupo_id').required = !['ocupada', 'cancelada'].includes(state)
  const minutes = text => { const [h, m] = text.split(':').map(Number); return h * 60 + m }
  const duration = minutes(end) - minutes(start)
  const conflict = date && start && end && db.clases.some(c => c.id !== value(form, 'id') && state !== 'cancelada' && c.estado !== 'cancelada' && (c.sala_id === room || (group && c.grupo_id === group)) && `${date}T${start}` < `${madridParts(c.fin).date}T${madridParts(c.fin).time}` && `${madridParts(c.inicio).date}T${madridParts(c.inicio).time}` < `${date}T${end}`)
  $('domus-class-feedback').textContent = conflict ? 'Posible solapamiento con otra clase u ocupación de la sala o del grupo. La base de datos rechazará el conflicto.' : duration > 0 ? `Duración: ${duration} minutos. El horario se validará al guardar.` : 'La finalización debe ser posterior al inicio en el mismo día.'
  $('domus-class-feedback').classList.toggle('is-conflict', Boolean(conflict))
}
function renderRooms() { $('domus-rooms').innerHTML = db.salas.map(r => `<article class="domus-record"><h3>${e(r.nombre)}</h3><p>${e(r.direccion)} · ${r.activa ? 'Activa' : 'Inactiva'}</p><button type="button" class="secondary" data-edit-room="${e(r.id)}">Editar sala</button></article>`).join('') }
function clearMessage() { messageReady = false; $('domus-message-link').hidden = true; $('domus-message-link').removeAttribute('href'); $('domus-message-status').textContent = '' }
function renderMessageContacts() {
  clearMessage()
  $('domus-message-preview').value = ''
  if (!db) return
  const id = $('domus-message-group').value
  const people = db.miembros.filter(m => m.grupo_id === id).map(m => m.participante_id)
  const ids = new Set(db.participantes.filter(p => people.includes(p.id)).map(p => p.reserva_id))
  $('domus-message-contact').innerHTML = options(db.reservas.filter(r => !id || ids.has(r.id)), 'Selecciona un contacto', r => `${r.nombre} · ${r.telefono} · ${r.estado}`)
  $('domus-message-class').innerHTML = options(db.clases.filter(c => c.grupo_id === id), 'Selecciona una sesión', c => `${formatClass(c)} · ${CLASS_STATES[c.estado]}`)
}
function updateMessageLink() {
  const contact = db?.reservas.find(r => r.id === $('domus-message-contact').value)
  if (!messageReady || !contact || !$('domus-message-preview').value.trim()) { clearMessage(); return }
  try { $('domus-message-link').href = whatsappURL(contact.telefono, $('domus-message-preview').value); $('domus-message-link').hidden = false }
  catch (error) { clearMessage(); $('domus-message-status').textContent = error.message }
}
function download(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type })), link = document.createElement('a')
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function exportCSV() {
  const cell = v => { let s = String(v ?? ''); if (/^[=+@\-\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"` }
  const rows = [['Grupo', 'Fecha', 'Inicio', 'Final', 'Estado', 'Sala', 'Lugar', 'Profesor', 'Primera clase', 'Información pública'], ...periodClasses().map(c => { const g = db.grupos.find(g => g.id === c.grupo_id), room = db.salas.find(r => r.id === c.sala_id); return [g?.nombre || 'Sala ocupada', madridParts(c.inicio).date, madridParts(c.inicio).time, madridParts(c.fin).time, CLASS_STATES[c.estado], room?.nombre, room?.direccion, g?.profesor || db.config.profesor, c.primera ? 'Sí' : 'No', c.nota_publica] })]
  download('\uFEFF' + rows.map(row => row.map(cell).join(';')).join('\r\n'), 'calendario-domus.csv', 'text/csv;charset=utf-8')
}
function exportICS() {
  const esc = v => String(v || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const time = s => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Viajes Sonoros//Talleres Domus//ES', 'CALSCALE:GREGORIAN']
  for (const c of periodClasses()) { const g = db.grupos.find(g => g.id === c.grupo_id), room = db.salas.find(r => r.id === c.sala_id); lines.push('BEGIN:VEVENT', `UID:${c.id}@domus.viajessonoros.es`, `DTSTAMP:${time(c.actualizado_en)}`, `DTSTART:${time(c.inicio)}`, `DTEND:${time(c.fin)}`, `SUMMARY:${esc(g?.nombre || 'Sala ocupada')}`, `LOCATION:${esc([room?.nombre, room?.direccion].filter(Boolean).join(' · '))}`, `DESCRIPTION:${esc([CLASS_STATES[c.estado], c.primera ? 'Primera clase' : '', `Profesor: ${g?.profesor || db.config.profesor}`, c.nota_publica].filter(Boolean).join('\n'))}`, `STATUS:${c.estado === 'confirmada' ? 'CONFIRMED' : c.estado === 'cancelada' ? 'CANCELLED' : 'TENTATIVE'}`, 'END:VEVENT') }
  lines.push('END:VCALENDAR')
  // Fold by UTF-8 octets, preserving multibyte characters (RFC 5545).
  const folded = lines.map(line => { let out = '', bytes = 0; for (const ch of line) { const size = new TextEncoder().encode(ch).length; if (bytes + size > 74) { out += '\r\n '; bytes = 1 } out += ch; bytes += size } return out })
  download(folded.join('\r\n') + '\r\n', 'calendario-domus.ics', 'text/calendar;charset=utf-8')
}
function printCalendar() {
  const rows = periodClasses()
  $('domus-print').innerHTML = `<h1>Calendario de Talleres Domus</h1><p>${e($('domus-period').textContent)} · Hora de Cáceres</p><table><thead><tr><th>Grupo</th><th>Fecha y hora</th><th>Estado</th><th>Sala y lugar</th><th>Profesor</th></tr></thead><tbody>${rows.map(c => `<tr><td>${e(groupName(c.grupo_id))}${c.primera ? ' · Primera clase' : ''}</td><td>${e(formatClass(c))}</td><td>${e(CLASS_STATES[c.estado])}</td><td>${e(roomName(c.sala_id))}<br>${e(db.salas.find(r => r.id === c.sala_id)?.direccion || db.config.lugar)}</td><td>${e(db.grupos.find(g => g.id === c.grupo_id)?.profesor || db.config.profesor)}</td></tr>`).join('')}</tbody></table>${rows.length ? '' : '<p>No hay clases en este periodo.</p>'}`
  window.print()
}

$('domus-login').onsubmit = async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true
  try { await check(supabase.auth.signInWithPassword({ email: $('domus-email').value.trim(), password: $('domus-password').value })); await load() }
  catch (error) { notice(friendlyError(error), true) }
  finally { button.disabled = false }
}
$('domus-logout').onclick = async () => { try { await check(supabase.auth.signOut()); showLogin('Sesión cerrada. Los datos privados se han retirado de esta pantalla.') } catch (error) { notice(friendlyError(error), true) } }
$('domus-reload').onclick = () => load().catch(error => notice(friendlyError(error), true))
$('domus-search').oninput = renderReservations
$('domus-reservation-filter').onchange = renderReservations
$('domus-new-group').onclick = () => openGroup()
$('domus-new-class').onclick = () => openClass()
$('domus-new-busy').onclick = () => openClass('', true)
$('domus-class-form').addEventListener('input', classFeedback)
field($('domus-class-form'), 'grupo_id').addEventListener('change', () => { const group = db.grupos.find(g => g.id === value($('domus-class-form'), 'grupo_id')); if (group?.sala_id) field($('domus-class-form'), 'sala_id').value = group.sala_id; classFeedback() })
for (const id of ['domus-calendar-group', 'domus-calendar-room', 'domus-calendar-view']) $(id).onchange = renderCalendar
for (const [id, direction] of [['domus-calendar-prev', -1], ['domus-calendar-next', 1]]) $(id).onclick = () => { cursor = $('domus-calendar-view').value === 'week' ? addDays(cursor, direction * 7) : monthDate(cursor, direction); renderCalendar() }
$('domus-calendar-today').onclick = () => { cursor = todayMadrid(); renderCalendar() }
$('domus-export-csv').onclick = exportCSV
$('domus-export-ics').onclick = exportICS
$('domus-print-calendar').onclick = printCalendar
$('domus-reset-room').onclick = () => $('domus-room-form').reset()
$('domus-message-group').onchange = renderMessageContacts
for (const id of ['domus-message-contact', 'domus-message-class', 'domus-message-kind']) $(id).onchange = () => { clearMessage(); $('domus-message-preview').value = '' }
$('domus-prepare-message').onclick = () => {
  clearMessage()
  try {
    const group = db.grupos.find(g => g.id === $('domus-message-group').value), contact = db.reservas.find(r => r.id === $('domus-message-contact').value)
    if (!contact) throw new Error('Selecciona el contacto adulto destinatario.')
    $('domus-message-preview').value = groupMessage({ kind: $('domus-message-kind').value, contact, group, classes: db.clases, rooms: db.salas, config: db.config, selectedClass: db.clases.find(c => c.id === $('domus-message-class').value) })
    messageReady = true; updateMessageLink(); $('domus-message-status').textContent = 'Revisa el texto y abre WhatsApp para confirmar su envío.'
  } catch (error) { $('domus-message-status').textContent = error.message }
}
$('domus-message-preview').oninput = updateMessageLink
$('domus-copy-message').onclick = async () => { try { if (!messageReady) throw new Error('Prepara primero un mensaje.'); await navigator.clipboard.writeText($('domus-message-preview').value); $('domus-message-status').textContent = 'Mensaje copiado. El envío sigue pendiente de tu confirmación en WhatsApp.' } catch (error) { $('domus-message-status').textContent = error.message } }
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button || !db) return
  const d = button.dataset
  if (d.tab) switchTab(d.tab)
  if (d.close) $(d.close).hidden = true
  if (d.editGroup) openGroup(d.editGroup)
  if (d.class) openClass(d.class)
  if (d.postpone) openClass(d.postpone, false, true)
  if (d.groupCalendar) { switchTab('agenda'); $('domus-calendar-group').value = d.groupCalendar; renderCalendar() }
  if (d.groupMessage) { switchTab('mensajes'); $('domus-message-group').value = d.groupMessage; renderMessageContacts() }
  if (d.editRoom) { fill($('domus-room-form'), db.salas.find(r => r.id === d.editRoom)); $('domus-room-form').scrollIntoView({ block: 'start' }) }
  if (d.openReservation) { switchTab('reservas'); $('domus-search').value = ''; $('domus-reservation-filter').value = 'all'; renderReservations(); $(`reserva-${d.openReservation}`)?.scrollIntoView({ block: 'start' }) }
  if (d.assign) perform(button, async () => { const wrap = button.closest('[data-person]'), target = wrap.querySelector('[data-destination]').value; if (!target) throw new Error('Selecciona un grupo de destino.'); await check(supabase.rpc('domus_mover_participante', { p_participante: d.assign, p_desde: wrap.querySelector('[data-source]').value || null, p_hacia: target })) })
  if (d.removeMember && confirm('¿Retirar a esta persona del grupo? Su inscripción original se conservará.')) perform(button, () => check(supabase.from('domus_grupos_participantes').update({ activo: false }).eq('participante_id', d.removeMember).eq('grupo_id', d.group)))
  if (d.cancelClass && confirm('¿Cancelar esta clase y retirarla del calendario público?')) perform(button, async () => { const row = db.clases.find(c => c.id === d.cancelClass); await check(supabase.rpc('domus_guardar_clase', { p_clase: { ...classPayload(row), estado: 'cancelada', publico: false } })); $('domus-class-form').hidden = true })
})
document.addEventListener('submit', event => {
  const form = event.target
  const formId = form.getAttribute('id')
  if (!db || formId === 'domus-login') return
  event.preventDefault()
  const button = event.submitter
  perform(button, async () => {
    if (formId === 'domus-group-form') {
      const payload = Object.fromEntries(['nombre', 'tipo', 'modalidad', 'estado', 'horarios', 'profesor', 'observaciones'].map(k => [k, value(form, k)]))
      payload.fecha_inicio = value(form, 'fecha_inicio') || null; payload.sala_id = value(form, 'sala_id') || null
      for (const k of ['edad_min', 'edad_max']) payload[k] = value(form, k) === '' ? null : Number(value(form, k))
      const id = value(form, 'id')
      if (payload.estado === 'cancelado' && id && !confirm('Cancelar el grupo también cancelará sus clases. ¿Continuar?')) return
      if (id) await updateRow('domus_grupos', id, payload, value(form, 'actualizado_en')); else await check(supabase.from('domus_grupos').insert(payload))
      form.hidden = true
    } else if (formId === 'domus-class-form') {
      const payload = Object.fromEntries(['id', 'actualizado_en', 'grupo_id', 'sala_id', 'fecha', 'hora_inicio', 'hora_fin', 'estado', 'nota_publica', 'notas'].map(k => [k, value(form, k)]))
      payload.primera = field(form, 'primera').checked; payload.publico = field(form, 'publico').checked
      await check(supabase.rpc('domus_guardar_clase', { p_clase: payload })); form.hidden = true
    } else if (formId === 'domus-room-form') {
      const payload = { nombre: value(form, 'nombre'), direccion: value(form, 'direccion'), activa: field(form, 'activa').checked }, id = value(form, 'id')
      if (id) await updateRow('domus_salas', id, payload); else await check(supabase.from('domus_salas').insert(payload))
      form.reset()
    } else if (formId === 'domus-config-form') {
      await check(supabase.from('domus_config').update({ lugar: value(form, 'lugar'), profesor: value(form, 'profesor'), edad_adultos: Number(value(form, 'edad_adultos')), max_participantes: Number(value(form, 'max_participantes')) }).eq('id', true))
    } else if (form.dataset.reservationForm) {
      const r = db.reservas.find(r => r.id === form.dataset.reservationForm)
      await updateRow('domus_reservas', r.id, { nombre: value(form, 'nombre'), telefono: value(form, 'telefono').replace(/[\s().-]/g, '').replace(/^00/, '+'), estado: value(form, 'estado'), responsable_adulto: field(form, 'responsable_adulto').checked }, r.actualizado_en)
    } else if (form.dataset.personForm) {
      await updateRow('domus_participantes', form.dataset.personForm, { nombre: value(form, 'nombre'), edad: Number(value(form, 'edad')) })
    }
  })
})
supabase.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') showLogin('Sesión cerrada.') })
load().catch(error => notice(friendlyError(error), true))
