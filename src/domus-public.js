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
    success.setAttribute('tabindex', '-1')
    success.setAttribute('aria-live', 'polite')
    const heading = success.querySelector('h2, h3')
    if (heading) heading.textContent = '¡Solicitud registrada!'
    success.classList.add('domus-confirmation-prominent')
    let instruction = document.getElementById('domus-whatsapp-instruction')
    if (!instruction) {
      instruction = document.createElement('p')
      instruction.id = 'domus-whatsapp-instruction'
      instruction.className = 'domus-whatsapp-instruction'
      $('domus-whatsapp').before(instruction)
    }
    instruction.textContent = 'ÚLTIMO PASO: pulsa el botón para abrir WhatsApp y enviar tu petición. Tu plaza sigue pendiente hasta que recibas nuestra confirmación.'
    $('domus-whatsapp').textContent = 'ENVIAR PETICIÓN POR WHATSAPP'
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
    requestAnimationFrame(() => { success.scrollIntoView({ behavior: 'auto', block: 'start' }); success.focus({ preventScroll: true }) })
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

/* Confirmación de solicitud: siguiente paso y WhatsApp bien visibles. */
const confirmationStyle = document.createElement('style')
confirmationStyle.textContent = `
#domus-booking-success.domus-confirmation-prominent{max-width:920px!important;margin:24px auto!important;padding:clamp(22px,4vw,48px)!important;border:3px solid #a37e43!important;border-radius:22px!important;background:#fff9e9!important;box-shadow:0 10px 35px rgba(70,42,18,.16)!important;scroll-margin-top:24px}
#domus-booking-success.domus-confirmation-prominent h2,#domus-booking-success.domus-confirmation-prominent h3{font-size:clamp(27px,4vw,43px)!important;line-height:1.15!important;color:#3a245b!important;margin:0 0 20px!important}
#domus-whatsapp-instruction.domus-whatsapp-instruction{font-size:clamp(20px,2.7vw,29px)!important;font-weight:800!important;line-height:1.35!important;color:#352349!important;margin:20px 0 22px!important;max-width:36ch}
#domus-booking-success #domus-whatsapp{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:68px!important;padding:18px 20px!important;border-radius:16px!important;background:#206947!important;color:#fff!important;font-size:clamp(17px,2.3vw,23px)!important;font-weight:800!important;text-align:center!important;text-decoration:none!important;box-shadow:0 6px 14px rgba(32,105,71,.18)!important}
#domus-booking-success #domus-whatsapp:hover{background:#185739!important}
#domus-booking-success #domus-whatsapp:focus-visible{outline:4px solid #c0a45e!important;outline-offset:4px}
#domus-booking-success #domus-new-booking{font-size:16px!important;min-height:52px!important}
@media(max-width:520px){#domus-booking-success.domus-confirmation-prominent{margin-inline:10px!important;padding:22px 16px!important}}
`
document.head.appendChild(confirmationStyle)

/* Formulario premium: selects nativos SIEMPRE visibles, con flecha de apertura explícita. */
const domusPremiumCSS = document.createElement('style')
domusPremiumCSS.textContent = `
#booking{background:linear-gradient(160deg,#fffdf9 0%,#f9f2e9 100%)!important;border:1px solid #e2c8a4!important;border-radius:24px!important;box-shadow:0 15px 42px rgba(70,43,54,.09)!important;padding:clamp(18px,3vw,38px)!important}
#booking label{font-weight:750!important;color:#39254b!important}
#booking input,#booking textarea,#booking select{border:1.5px solid #c9b4cb!important;border-radius:13px!important;min-height:54px!important;background-color:#fff!important;font-size:16px!important;box-shadow:0 2px 9px rgba(54,31,63,.045)!important}
#booking select,#domus-horario-confirmado{appearance:none!important;-webkit-appearance:none!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='1' y='1' width='22' height='22' rx='7' fill='%233a245b'/%3E%3Cpath d='m7 10 5 5 5-5' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-size:32px 32px!important;background-position:right 12px center!important;padding-right:58px!important;cursor:pointer!important;font-weight:700!important;color:#352546!important}
#booking select:hover,#domus-horario-confirmado:hover{border-color:#8e6caa!important;background-color:#fbf8ff!important}
#booking select:focus-visible,#domus-horario-confirmado:focus-visible,#booking input:focus-visible{outline:3px solid #b090c0!important;outline-offset:2px!important}
#booking #modalidad,#booking #paquete{display:block!important;position:static!important;width:100%!important;height:auto!important;opacity:1!important;pointer-events:auto!important;clip-path:none!important;visibility:visible!important}
#domus-package-wrap[hidden]{display:none!important}
#booking button[type=submit]{font-size:18px!important;font-weight:800!important;min-height:58px!important;padding:15px 26px!important;border-radius:14px!important;box-shadow:0 8px 18px #39245425!important}
`
document.head.appendChild(domusPremiumCSS)
