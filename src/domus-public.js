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
  syncVisualSelects()
}

/* Selectores táctiles accesibles, sincronizados con los select originales y su lógica. */
const visualGroups = []
function installVisualSelect(id) {
  const select = $(id)
  if (!select || !select.options.length) return
  const originalLabel = select.closest('label')
  const container = document.createElement('div')
  container.className = 'domus-choice-grid'
  container.setAttribute('role', 'group')
  container.setAttribute('aria-label', id === 'modalidad' ? 'Selecciona modalidad de taller' : 'Selecciona el bono de clases')
  const choices = [...select.options].filter(option => option.value && !option.disabled)
  for (const option of choices) {
    const choice = document.createElement('button')
    choice.type = 'button'
    choice.className = 'domus-choice'
    choice.dataset.value = option.value
    const label = option.textContent.trim()
    const match = label.match(/(\\d+[,.]?\\d*)\\s*€/)
    const price = match ? match[0] : ''
    const description = label.replace(price, '').replace(/^[·\\s]+|[·\\s]+$/g, '').trim()
    const lead = document.createElement('strong')
    lead.textContent = description || label
    choice.appendChild(lead)
    if (price) {
      const amount = document.createElement('span')
      amount.textContent = price
      choice.appendChild(amount)
    }
    choice.addEventListener('click', () => {
      select.value = option.value
      select.dispatchEvent(new Event('change', { bubbles: true }))
      syncVisualSelects()
    })
    container.appendChild(choice)
  }
  select.classList.add('domus-select-accessible')
  originalLabel?.after(container)
  visualGroups.push({ select, container })
}
function syncVisualSelects() {
  for (const { select, container } of visualGroups) {
    container.hidden = Boolean(select.closest('[hidden]'))
    for (const choice of container.querySelectorAll('button')) {
      const active = choice.dataset.value === select.value
      choice.classList.toggle('selected', active)
      choice.setAttribute('aria-pressed', String(active))
    }
  }
}
const visualStyle = document.createElement('style')
visualStyle.textContent = `
.domus-select-accessible{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;clip-path:inset(50%)!important}
.domus-choice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:12px;margin:8px 0 19px}
.domus-choice-grid[hidden]{display:none!important}
.domus-choice{min-height:76px;padding:15px 18px;border:2px solid #ddcbd9;border-radius:15px;background:#fffaf5;color:#3d2a4f;display:flex;flex-direction:column;gap:5px;align-items:flex-start;justify-content:center;text-align:left;cursor:pointer;font-family:inherit;box-shadow:0 2px 7px #4226570d}
.domus-choice strong{font-size:clamp(15px,1.5vw,18px);line-height:1.35}
.domus-choice span{font-weight:800;font-size:19px;color:#906e3d}
.domus-choice:hover{border-color:#9b7aaa;background:#faf4fd}
.domus-choice.selected{border-color:#3a245b;background:#ede7f4;box-shadow:inset 0 0 0 1px #3a245b}
.domus-choice.selected:before{content:'✓ Seleccionado';font-size:12px;color:#31684b;font-weight:800}
.domus-choice:focus-visible{outline:3px solid #a77b43;outline-offset:2px}
@media(max-width:580px){.domus-choice-grid{grid-template-columns:1fr 1fr;gap:8px}.domus-choice{padding:12px;min-height:84px}.domus-choice strong{font-size:14px}.domus-choice span{font-size:17px}}
`
document.head.appendChild(visualStyle)
installVisualSelect('modalidad')
installVisualSelect('paquete')
syncVisualSelects()

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
    syncVisualSelects()
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
    const { data: reference, error } = await supabase.rpc('domus_registrar_con_referencia', { p_solicitud: requestData }).abortSignal(AbortSignal.timeout(15000))
    if (error) throw error
    if (!reference?.id || !reference?.codigo) throw new Error('No se ha recibido la referencia de reserva. Reintenta sin cambiar los datos.')
    const code = reference.codigo
    const message = ['Hola, he registrado una solicitud para Talleres Domus.', `Referencia: ${code}`, `Contacto: ${requestData.nombre} · ${phone}`, `Participantes: ${names.join(', ')}`, `Modalidad: ${MODES[requestData.modalidad]}`, `Paquete: ${MODES[requestData.paquete]}`, `Precio individual: ${money(requestData.precio_unitario)}`, `Importe total: ${money(requestData.importe_total)}`, `Preferencias: ${requestData.preferencias || 'Por confirmar'}`, elegido ? 'Has elegido una clase publicada. La plaza queda provisionalmente asignada al grupo; la confirmación final llegará desde la organización.' : 'La solicitud está pendiente. Fechas, horarios y sala se confirmarán con la organización.'].join('\n')
    $('domus-whatsapp').href = whatsappURL(DOMUS_PHONE, message)
    $('domus-reference').textContent = `Solicitud registrada: ${code}. ${elegido ? 'Asignación provisional a la clase seleccionada.' : 'Pendiente de asignación de grupo.'} Pendiente de confirmación.`
    const success = $('domus-booking-success')
    success.hidden = false
    success.setAttribute('role', 'status')
    success.setAttribute('aria-live', 'polite')
    $('domus-whatsapp').textContent = 'Enviar consulta por WhatsApp'
    // El registro se ha guardado; WhatsApp es opcional y no confirma su entrega.
    // Cada nueva solicitud recibe una clave distinta para evitar reutilizar la anterior.
    try { sessionStorage.removeItem('domus.solicitud.clave') } catch {}
    delete form.dataset.requestKey
    form.reset()
    $('domus-ages').replaceChildren()
    renderAges()
    refreshGroup()
    refreshPrice()
    button.disabled = false
    $('domus-booking-status').textContent = ''
    form.hidden = false
    loadCalendar()
    if (!document.getElementById('domus-new-booking')) {
      const next = document.createElement('button')
      next.type = 'button'
      next.id = 'domus-new-booking'
      next.textContent = 'Realizar otra reserva'
      next.style.cssText = 'margin:12px 0;padding:12px 18px;border:1px solid #ae8fbd;border-radius:12px;background:#fff;color:#3a245b;font-weight:700;cursor:pointer'
      next.addEventListener('click', () => {
        success.hidden = true
        form.scrollIntoView({ behavior: 'smooth', block: 'start' })
        form.querySelector('input:not([type=hidden])')?.focus({ preventScroll: true })
      })
      success.appendChild(next)
    }
    success.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
  share.textContent = 'Compartir por WhatsApp'
  share.addEventListener('click', () => {
    const url = new URL('/talleres-domus/', location.origin).href
    const text = 'Descubre los talleres de iniciación a los Drums de Domus Pan Drums en Cáceres. Información e inscripciones: ' + url
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer')
  })
  document.body.appendChild(share)
}
installShareButton()
