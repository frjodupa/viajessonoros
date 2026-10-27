import { supabase } from './supabase.js'
import { calendarHTML, classifyAges, DOMUS_PHONE, escapeHTML, MODES, PACKAGE_PRICES, money, reservationPrice, monthDate, todayMadrid, whatsappURL, friendlyError, addDays } from './domus-core.js'
import './domus-calendar.css'

const $ = id => document.getElementById(id)
let cursor = monthDate(todayMadrid()), config = null, request = 0, publicClasses = []
const form = $('booking'), button = $('domus-submit')

/* Sólo se ofrecen fechas confirmadas publicadas; elegirlas no confirma la inscripción. */
const horarioActual = $('horario')
const horarioElegible = document.createElement('select')
horarioElegible.id = 'domus-horario-confirmado'
horarioElegible.setAttribute('aria-label', 'Elige una clase con día y hora confirmados')
const horarioLabel = document.createElement('label')
horarioLabel.textContent = 'Clases con fecha y horario confirmados (90 minutos)'
horarioLabel.appendChild(horarioElegible)
const horarioAviso = document.createElement('p')
horarioAviso.style.fontSize = '13px'
horarioAviso.textContent = 'Si todavía no hay una clase adecuada, puedes dejar tu preferencia de horario. Las plazas están pendientes de confirmación.'
horarioLabel.appendChild(horarioAviso)
horarioActual?.closest('label')?.before(horarioLabel)
function renderHorarioElegible(clases = []) {
 const selected = horarioElegible.value
 horarioElegible.replaceChildren(new Option('Prefiero proponer otro horario', ''))
 for (const c of clases) {
  const ini = new Date(c.inicio), fin = new Date(c.fin)
  if (!Number.isFinite(ini.getTime()) || !Number.isFinite(fin.getTime()) || fin-ini !== 90*60000 || ini <= new Date() || !(c.libres > 0)) continue
  const label = new Intl.DateTimeFormat('es-ES', {timeZone:'Europe/Madrid',weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'}).format(ini)
  const end = new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}).format(fin)
  horarioElegible.add(new Option(label + '–' + end + ' · ' + (c.grupo_tipo || 'Grupo') + ' · ' + (c.sala || 'Sala por confirmar'), c.id + '|' + label + '–' + end))
 }
 if ([...horarioElegible.options].some(o=>o.value===selected)) horarioElegible.value=selected
 horarioAviso.textContent=horarioElegible.options.length>1?'Selecciona una clase publicada. La plaza se confirmará después por la organización.':'Todavía no hay fechas publicadas de 90 minutos. Indica tu disponibilidad debajo.'
}

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
    publicClasses = data.clases
    $('plazas').max = String(config.max_participantes)
    refreshPrice()
    button.disabled = false
    $('domus-public-calendar').innerHTML = calendarHTML(data.clases, cursor)
    renderHorarioElegible(data.clases)
    $('domus-calendar-status').textContent = data.clases.length ? 'Estas clases están confirmadas y publicadas por la organización. Las inscripciones requieren confirmación individual.' : 'Todavía no hay clases públicas confirmadas este mes. Puedes solicitar plaza y proponer tus horarios.'
  } catch (error) {
    if (current === request) $('domus-calendar-status').textContent = `No se ha podido consultar el calendario. ${friendlyError(error)}`
  }
}
document.addEventListener('click', event => {
 const reserve = event.target.closest('[data-domus-reserve]')
 if (!reserve) return
 const cls = publicClasses.find(c => c.id === reserve.dataset.domusReserve && c.libres > 0)
 if (!cls) return
 const option = [...horarioElegible.options].find(o => o.value.startsWith(cls.id+'|'))
 if (option) horarioElegible.value = option.value
 const modality = $('modalidad')
 if (modality && cls.tipo === 'ninos') modality.value = 'infantil'
 if (modality && cls.tipo === 'adultos') modality.value = 'taller'
 refreshGroup()
 form.scrollIntoView({behavior:'smooth',block:'start'})
 horarioElegible.focus({preventScroll:true})
})
form.addEventListener('submit', async event => {
  event.preventDefault()
  if (!config || button.disabled || !form.reportValidity()) return
  const v = id => $(id).value.trim(), fields = [...document.querySelectorAll('[data-age]')]
  const ages = fields.map(i => Number(i.value)), n = Number(v('plazas'))
  const names = [...document.querySelectorAll('[data-person-name]')].map(i => i.value.trim())
  const elegido = publicClasses.find(c => horarioElegible.value.startsWith(c.id+'|'))
  if (elegido && Number(v('plazas')) > elegido.libres) { $('domus-booking-status').textContent = 'No quedan plazas suficientes en esa clase. Actualiza el calendario o elige otra opción.'; return }
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
    const requestData = { clave: key, clase_id: elegido?.id || null, nombre: v('nombre'), telefono: phone, edades: ages, nombres: names, modalidad: v('modalidad'), paquete: v('paquete'), ...reservationPrice(v('paquete'), n), preferencias: horarioElegible.value ? 'Clase solicitada: '+horarioElegible.value.split('|').slice(1).join('|')+' (referencia '+horarioElegible.value.split('|')[0]+'). '+v('horario') : v('horario'), observaciones: v('observaciones'), responsable_adulto: $('domus-responsible').checked }
    const { data: reference, error } = await supabase.rpc('domus_registrar', { p_solicitud: requestData }).abortSignal(AbortSignal.timeout(15000))
    if (error) throw error
    if (!reference) throw new Error('No se ha recibido confirmación de registro. Reintenta sin cambiar los datos.')
    const message = ['Hola, he registrado una solicitud para Talleres Domus.', `Referencia: ${reference}`, `Contacto: ${requestData.nombre} · ${phone}`, `Participantes: ${names.join(', ')}`, `Modalidad: ${MODES[requestData.modalidad]}`, `Paquete: ${MODES[requestData.paquete]}`, `Precio individual: ${money(requestData.precio_unitario)}`, `Importe total: ${money(requestData.importe_total)}`, `Preferencias: ${requestData.preferencias || 'Por confirmar'}`, elegido ? 'Has elegido una clase publicada. La plaza queda provisionalmente asignada al grupo; la confirmación final llegará desde la organización.' : 'La solicitud está pendiente. Fechas, horarios y sala se confirmarán con la organización.'].join('\n')
    $('domus-whatsapp').href = whatsappURL(DOMUS_PHONE, message)
    $('domus-reference').textContent = `Solicitud registrada: ${reference}. ${elegido ? 'Asignación provisional a la clase seleccionada.' : 'Pendiente de asignación de grupo.'} Pendiente de confirmación.`
    $('domus-booking-success').hidden = false
    loadCalendar()
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


/* Acceso visible para compartir la página pública de los talleres, sin enlazarla desde la landing. */
function installShareButton() {
  if (document.getElementById('domus-share-public')) return
  const share = document.createElement('button')
  share.id = 'domus-share-public'
  share.type = 'button'
  share.textContent = 'Compartir taller'
  share.setAttribute('aria-label', 'Compartir la página de Talleres Domus')
  Object.assign(share.style, {
    position: 'fixed', right: '18px', bottom: '18px', zIndex: '40',
    background: '#3a245b', color: '#fff', border: '1px solid #d7bc88',
    borderRadius: '999px', padding: '14px 21px', minHeight: '48px',
    boxShadow: '0 8px 25px rgba(43,26,56,.25)', cursor: 'pointer',
    fontFamily: 'Montserrat, system-ui, sans-serif', fontWeight: '700',
    fontSize: '14px', maxWidth: 'calc(100vw - 36px)'
  })
  share.addEventListener('click', async () => {
    const url = new URL('/talleres-domus/', location.origin).href
    const title = 'Talleres Domus Pan Drums · Viajes Sonoros'
    const text = 'Descubre los talleres de iniciación a los Drums de Domus Pan Drums en Cáceres. Información e inscripciones: ' + url
    try {
      if (navigator.share) { await navigator.share({ title, text, url }); return }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        const original = share.textContent
        share.textContent = '¡Enlace copiado!'
        share.addEventListener('blur', () => { share.textContent = original }, { once: true })
        return
      }
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer')
    } catch (error) {
      if (error?.name !== 'AbortError') window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer')
    }
  })
  document.body.appendChild(share)
}
installShareButton()
