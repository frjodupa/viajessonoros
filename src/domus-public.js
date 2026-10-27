import { supabase } from './supabase.js'
import { calendarHTML, classifyAges, DOMUS_PHONE, escapeHTML, MODES, monthDate, todayMadrid, whatsappURL, friendlyError, addDays } from './domus-core.js'
import './domus-calendar.css'

const $ = id => document.getElementById(id)
let cursor = monthDate(todayMadrid()), config = null, request = 0
const form = $('booking'), button = $('domus-submit')
button.disabled = true
function renderAges() {
  const n = Number($('plazas').value), previous = [...document.querySelectorAll('[data-age]')].map(i => i.value)
  if (!Number.isInteger(n) || n < 1 || n > (config?.max_participantes || 30)) { $('domus-ages').replaceChildren(); return }
  $('domus-ages').innerHTML = Array.from({ length: n }, (_, i) => `<label>Edad de participante ${i + 1}<input data-age type="number" inputmode="numeric" min="0" max="120" step="1" required aria-describedby="domus-age-note" aria-label="Edad de participante ${i + 1}" value="${escapeHTML(previous[i] || '')}"></label>`).join('')
  refreshGroup()
}
function refreshGroup() {
  const fields = [...document.querySelectorAll('[data-age]')], ages = fields.map(i => Number(i.value))
  const valid = fields.length && fields.every(i => i.value !== '' && i.checkValidity())
  $('domus-group-hint').textContent = valid ? `Grupo orientativo: ${classifyAges(ages, config?.edad_adultos || 18)}. La organización confirmará la composición del grupo.` : ''
  const minors = valid && ages.some(n => n < 18)
  $('domus-responsible-wrap').hidden = !minors
  $('domus-responsible').required = minors
}
$('plazas').addEventListener('input', renderAges)
$('domus-ages').addEventListener('input', refreshGroup)
$('domus-prev').onclick = () => { cursor = monthDate(cursor, -1); loadCalendar() }
$('domus-next').onclick = () => { cursor = monthDate(cursor, 1); loadCalendar() }
$('domus-calendar-retry').onclick = loadCalendar
async function loadCalendar() {
  const current = ++request
  $('domus-calendar-label').textContent = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${cursor}T12:00:00Z`))
  $('domus-calendar-status').textContent = 'Consultando clases confirmadas…'
  $('domus-public-calendar').replaceChildren()
  try {
    const { data, error } = await supabase.rpc('domus_calendario', { p_desde: cursor, p_hasta: addDays(monthDate(cursor, 1), -1) }).abortSignal(AbortSignal.timeout(12000))
    if (current !== request) return
    if (error) throw error
    if (!data?.config || !Array.isArray(data.clases)) throw new Error('No se ha podido consultar la agenda de talleres.')
    config = data.config
    $('plazas').max = String(config.max_participantes)
    button.disabled = false
    $('domus-public-calendar').innerHTML = calendarHTML(data.clases, cursor)
    $('domus-calendar-status').textContent = data.clases.length ? 'Estas clases están confirmadas y publicadas por la organización. Las inscripciones requieren confirmación individual.' : 'Todavía no hay clases públicas confirmadas este mes. Puedes solicitar plaza y proponer tus horarios.'
  } catch (error) {
    if (current === request) $('domus-calendar-status').textContent = `No se ha podido consultar el calendario. ${friendlyError(error)}`
  }
}
form.addEventListener('submit', async event => {
  event.preventDefault()
  if (!config || button.disabled || !form.reportValidity()) return
  const v = id => $(id).value.trim(), fields = [...document.querySelectorAll('[data-age]')]
  const ages = fields.map(i => Number(i.value)), n = Number(v('plazas'))
  const phone = v('telefono').replace(/[\s().-]/g, '').replace(/^00/, '+')
  if (n !== fields.length || ages.some((age, i) => fields[i].value === '' || !Number.isInteger(age) || age < 0 || age > 120)) { $('domus-booking-status').textContent = 'Indica una edad válida por participante.'; return }
  if (!/^\+?\d{9,15}$/.test(phone)) { $('domus-booking-status').textContent = 'Revisa el teléfono de contacto.'; return }
  button.disabled = true
  $('domus-booking-status').textContent = 'Registrando la solicitud…'
  try {
    let key
    try { key = sessionStorage.getItem('domus.solicitud.clave') } catch {}
    key ||= form.dataset.requestKey || crypto.randomUUID()
    form.dataset.requestKey = key
    try { sessionStorage.setItem('domus.solicitud.clave', key) } catch {}
    const { data: reference, error } = await supabase.rpc('domus_registrar', { p_solicitud: { clave: key, nombre: v('nombre'), telefono: phone, edades: ages, modalidad: v('modalidad'), preferencias: v('horario'), observaciones: v('observaciones'), responsable_adulto: $('domus-responsible').checked } }).abortSignal(AbortSignal.timeout(15000))
    if (error) throw error
    if (!reference) throw new Error('No se ha recibido confirmación de registro. Reintenta sin cambiar los datos.')
    const message = ['Hola, he registrado una solicitud para Talleres Domus.', `Referencia: ${reference}`, `Contacto: ${v('nombre')} · ${phone}`, `Participantes: ${n}`, `Modalidad: ${MODES[v('modalidad')]}`, `Preferencias: ${v('horario') || 'Por confirmar'}`, 'La solicitud está pendiente. Fechas, horarios y sala se confirmarán con la organización.'].join('\n')
    $('domus-whatsapp').href = whatsappURL(DOMUS_PHONE, message)
    $('domus-reference').textContent = `Solicitud registrada: ${reference}. Pendiente de confirmación.`
    $('domus-booking-success').hidden = false
    form.hidden = true
    try { sessionStorage.removeItem('domus.solicitud.clave') } catch {}
    // Open only after a real successful registration and an explicit click.
    $('domus-whatsapp').focus()
  } catch (error) {
    $('domus-booking-status').textContent = `${friendlyError(error)} No se ha confirmado la inscripción. Puedes reintentar; la misma solicitud no se duplicará.`
    button.disabled = false
  }
})
renderAges()
loadCalendar()
