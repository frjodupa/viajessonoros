import { supabase } from './supabase.js'
import { calendarHTML, classifyAges, DOMUS_PHONE, escapeHTML, MODES, PACKAGE_PRICES, money, reservationPrice, monthDate, todayMadrid, whatsappURL, friendlyError, addDays } from './domus-core.js'
import './domus-calendar.css'

const $ = id => document.getElementById(id)
let cursor = monthDate(todayMadrid()), config = null, request = 0
const form = $('booking'), button = $('domus-submit')
button.disabled = true
function renderAges() {
  const n = Number($('plazas').value), previous = [...document.querySelectorAll('[data-age]')].map(i => i.value), names = [...document.querySelectorAll('[data-person-name]')].map(i => i.value)
  if (!Number.isInteger(n) || n < 1 || n > (config?.max_participantes || 30)) { $('domus-ages').replaceChildren(); return }
  $('domus-ages').innerHTML = Array.from({ length: n }, (_, i) => `<div><label><span data-name-caption>Nombre de participante ${i + 1}</span><input data-person-name type="text" required maxlength="100" autocomplete="off" value="${escapeHTML(names[i] || '')}"></label><label>Edad de participante ${i + 1}<input data-age type="number" inputmode="numeric" min="0" max="120" step="1" required aria-describedby="domus-age-note" aria-label="Edad de participante ${i + 1}" value="${escapeHTML(previous[i] || '')}"></label></div>`).join('')
  refreshGroup()
}
function refreshGroup() {
  const fields = [...document.querySelectorAll('[data-age]')], ages = fields.map(i => Number(i.value))
  const valid = fields.length && fields.every(i => i.value !== '' && i.checkValidity())
  $('domus-group-hint').textContent = valid ? `Grupo orientativo: ${classifyAges(ages, config?.edad_adultos || 18)}. La organización confirmará la composición del grupo.` : ''
  const infant = $('modalidad').value === 'infantil'
  const minors = infant || (valid && ages.some(n => n < 18))
  document.querySelectorAll('[data-name-caption]').forEach((caption, i) => { caption.textContent = `${infant || (fields[i].value !== '' && ages[i] < 18) ? 'Nombre del niño/a' : 'Nombre de participante'} ${i + 1}` })
  $('domus-contact-label').textContent = minors ? 'Nombre del padre, madre o tutor' : 'Nombre de contacto'
  $('domus-phone-label').textContent = minors ? 'WhatsApp del padre, madre o tutor' : 'Teléfono o WhatsApp de contacto'
  $('domus-responsible-wrap').hidden = !minors
  $('domus-responsible').required = minors
}
function refreshPrice() {
  const mode = $('modalidad').value
  const direct = Object.hasOwn(PACKAGE_PRICES, mode)
  $('domus-package-wrap').hidden = direct
  if (direct) $('paquete').value = mode
  const unit = PACKAGE_PRICES[$('paquete').value], count = Number($('plazas').value)
  $('domus-unit-price').textContent = `Precio individual: ${money(unit)}`
  $('domus-total-price').textContent = Number.isInteger(count) && count >= 1 && count <= (config?.max_participantes || 30) ? `Importe total: ${money(reservationPrice($('paquete').value, count).importe_total)}` : 'Indica un número válido de participantes.'
}
$('plazas').addEventListener('input', () => { renderAges(); refreshPrice() })
$('domus-ages').addEventListener('input', refreshGroup)
$('modalidad').addEventListener('change', () => { refreshGroup(); refreshPrice() })
$('paquete').addEventListener('change', refreshPrice)
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
    refreshPrice()
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
  const names = [...document.querySelectorAll('[data-person-name]')].map(i => i.value.trim())
  const phone = v('telefono').replace(/[\s().-]/g, '').replace(/^00/, '+')
  if (n !== fields.length || ages.some((age, i) => fields[i].value === '' || !Number.isInteger(age) || age < 0 || age > 120)) { $('domus-booking-status').textContent = 'Indica una edad válida por participante.'; return }
  if (!/^\+?\d{9,15}$/.test(phone)) { $('domus-booking-status').textContent = 'Revisa el teléfono de contacto.'; return }
  if (names.length !== n || names.some(name => !name || name.length > 100)) { $('domus-booking-status').textContent = 'Indica el nombre real de cada participante.'; return }
  button.disabled = true
  $('domus-booking-status').textContent = 'Registrando la solicitud…'
  try {
    let key
    try { key = sessionStorage.getItem('domus.solicitud.clave') } catch {}
    key ||= form.dataset.requestKey || crypto.randomUUID()
    form.dataset.requestKey = key
    try { sessionStorage.setItem('domus.solicitud.clave', key) } catch {}
    const requestData = { clave: key, nombre: v('nombre'), telefono: phone, edades: ages, nombres: names, modalidad: v('modalidad'), paquete: v('paquete'), ...reservationPrice(v('paquete'), n), preferencias: v('horario'), observaciones: v('observaciones'), responsable_adulto: $('domus-responsible').checked }
    const { data: reference, error } = await supabase.rpc('domus_registrar', { p_solicitud: requestData }).abortSignal(AbortSignal.timeout(15000))
    if (error) throw error
    if (!reference) throw new Error('No se ha recibido confirmación de registro. Reintenta sin cambiar los datos.')
    const message = ['Hola, he registrado una solicitud para Talleres Domus.', `Referencia: ${reference}`, `Contacto: ${requestData.nombre} · ${phone}`, `Participantes: ${names.join(', ')}`, `Modalidad: ${MODES[requestData.modalidad]}`, `Paquete: ${MODES[requestData.paquete]}`, `Precio individual: ${money(requestData.precio_unitario)}`, `Importe total: ${money(requestData.importe_total)}`, `Preferencias: ${requestData.preferencias || 'Por confirmar'}`, 'La solicitud está pendiente. Fechas, horarios y sala se confirmarán con la organización.'].join('\n')
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
refreshPrice()
loadCalendar()
