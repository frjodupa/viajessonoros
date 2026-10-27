// Run against domus-browser-server.mjs only, with a fresh browser profile.
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const binary = process.env.DOMUS_CHROME_BIN, artifacts = process.env.DOMUS_ARTIFACT_DIR
if (!binary || !artifacts) throw new Error('Set an isolated Chrome binary and artifact directory')
const origin = 'http://127.0.0.1:18745'
const browser = spawn(binary, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--remote-debugging-pipe', `--user-data-dir=${path.join(artifacts, 'browser-profile')}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] })
let sequence = 0, buffer = '', pending = new Map(), events = []
browser.stderr.on('data', data => fs.appendFileSync(path.join(artifacts, 'browser-stderr.log'), data))
browser.stdio[4].on('data', chunk => {
  buffer += chunk
  let index
  while ((index = buffer.indexOf('\0')) >= 0) {
    const text = buffer.slice(0, index); buffer = buffer.slice(index + 1)
    if (!text) continue
    const message = JSON.parse(text)
    if (message.id) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(message.error) : task.resolve(message.result) }
    else events.push(message)
  }
})
function call(method, params = {}, sessionId) { return new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); browser.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0') }) }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const result = { checks: [], sizes: [], errors: [] }
let session
const command = (method, params) => call(method, params, session)
async function evaluate(expression) {
  const data = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
  if (data.exceptionDetails) throw new Error(JSON.stringify(data.exceptionDetails))
  return data.result.value
}
async function waitFor(expression, label) { for (let i = 0; i < 100; i++) { try { if (await evaluate(expression)) return } catch (error) { if (!/Cannot read properties of null|Execution context|Cannot find context/.test(error.message)) throw error } await sleep(100) } throw new Error(`Timed out: ${label || expression}; ` + await evaluate('document.body.innerText.slice(0,1400)')) }
async function navigate(route) { await command('Page.navigate', { url: origin + route }); await waitFor(`location.href===${JSON.stringify(origin + route)}&&document.readyState==="complete"`, 'page load') }
async function set(selector, value) { await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)throw Error('Missing selector');${typeof value === 'boolean' ? `n.checked=${value}` : `n.value=${JSON.stringify(String(value))}`};n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));return true})()`) }
async function click(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click();true`) }
async function submit(selector) { await evaluate(`(()=>{const f=document.querySelector(${JSON.stringify(selector)});f.requestSubmit(f.querySelector('button[type="submit"]'));return true})()`) }
async function state() { return (await fetch(`${origin}/__test/state`)).json() }
async function waitState(fn, label) { for (let i = 0; i < 100; i++) { if (fn(await state())) return; await sleep(100) } throw new Error(`Timed out DB: ${label}`) }
async function screenshot(name, width, height) {
  await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  await evaluate('window.scrollTo(0,0);true')
  await sleep(150)
  const overflow = await evaluate('document.documentElement.scrollWidth>innerWidth')
  assert.equal(overflow, false, `Overflow ${name}`)
  result.sizes.push({ name, width, overflow })
  const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  fs.writeFileSync(path.join(artifacts, `${name}.png`), Buffer.from(shot.data, 'base64'))
}
async function main() {
  assert.equal((await (await fetch(`${origin}/__test/reset`, { method: 'POST' })).json()).syntheticDatabaseReset, true)
  const context = await call('Target.createBrowserContext')
  const target = await call('Target.createTarget', { url: 'about:blank', browserContextId: context.browserContextId })
  session = (await call('Target.attachToTarget', { targetId: target.targetId, flatten: true })).sessionId
  await command('Page.enable'); await command('Runtime.enable'); await command('Network.enable')
  await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: artifacts, browserContextId: context.browserContextId, eventsEnabled: true })
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await navigate('/talleres-domus/')
  await waitFor('!document.getElementById("domus-submit").disabled', 'public API ready')
  const images = await evaluate('(async()=>{await Promise.all([...document.images].map(async i=>{i.loading="eager";try{await i.decode()}catch{}}));return [...document.images].map(i=>({ok:i.complete&&i.naturalWidth>0,alt:i.alt}))})()')
  fs.writeFileSync(path.join(artifacts, 'image-results.json'), JSON.stringify(images, null, 2))
  assert.equal(images.length, 10); assert(images.every(i => i.ok))
  result.checks.push('10 imágenes decodificadas por Chrome')
  await screenshot('public-desktop', 1440, 1000); await screenshot('public-mobile', 390, 844)
  await set('#nombre', 'Contacto sintético navegador'); await set('#telefono', '600000009'); await set('#plazas', 3)
  assert.equal(await evaluate('document.querySelectorAll("[data-age]").length'), 3)
  await evaluate(`[8,12,35].forEach((age,i)=>{const n=document.querySelectorAll('[data-age]')[i];n.value=age;n.dispatchEvent(new Event('input',{bubbles:true}))});true`)
  assert.equal(await evaluate('document.getElementById("domus-responsible").required'), true)
  await set('#domus-responsible', true); await set('#modalidad', 'bono4'); await set('#horario', 'Sábados por la tarde')
  await submit('#booking'); await waitFor('!document.getElementById("domus-booking-success").hidden', 'registration saved')
  let data = await state(); assert.equal(data.reservas.length, 1); assert.equal(data.participantes.length, 3)
  assert.equal(new URL(await evaluate('document.getElementById("domus-whatsapp").href')).pathname, '/34610056859')
  result.checks.push('Formulario con tres edades, contacto adulto y reserva real en PostgreSQL sintético')
  await navigate('/talleres-domus/admin.html#grupos'); await waitFor('!document.getElementById("domus-login").hidden', 'private login')
  await set('#domus-password', 'solo-pruebas-domus'); await submit('#domus-login'); await waitFor('!document.getElementById("domus-private").hidden', 'authorized administration')
  await evaluate('window.confirm=()=>true;true')
  await click('[data-tab=mensajes]'); await set('#domus-message-contact', (await state()).reservas[0].id); await click('#domus-prepare-message')
  assert((await evaluate('document.getElementById("domus-message-preview").value')).includes('pendiente'))
  assert(!(await evaluate('document.getElementById("domus-message-preview").value')).includes('Grupo:'))
  result.checks.push('Comunicación de una solicitud pendiente antes de crear o asignar un grupo')
  const room = (await state()).salas[0].id
  for (const name of ['Grupo sintético A', 'Grupo sintético B']) {
    await click('#domus-new-group'); await set('#domus-group-form [name=nombre]', name); await set('#domus-group-form [name=tipo]', 'mixto'); await set('#domus-group-form [name=modalidad]', 'bono'); await set('#domus-group-form [name=estado]', 'confirmado'); await set('#domus-group-form [name=sala_id]', room)
    await submit('#domus-group-form'); await waitFor('document.getElementById("domus-group-form").hidden', 'group saved')
  }
  data = await state(); const groupA = data.grupos.find(g => g.nombre.endsWith(' A')).id, groupB = data.grupos.find(g => g.nombre.endsWith(' B')).id
  await click(`[data-edit-group="${groupA}"]`); await set('#domus-group-form [name=horarios]', 'Sábados 18:00'); await submit('#domus-group-form'); await waitFor('document.getElementById("domus-group-form").hidden', 'group edited')
  await waitState(s => s.grupos.find(g => g.id === groupA).horarios === 'Sábados 18:00', 'group edit persisted')
  await click('[data-tab=reservas]')
  for (const p of data.participantes) {
    await evaluate(`document.querySelector('[data-person="${p.id}"]').closest('details').open=true;true`)
    await set(`[data-person="${p.id}"] [data-destination]`, groupA); await click(`[data-assign="${p.id}"]`)
    await waitState(s => s.miembros.some(m => m.participante_id === p.id && m.grupo_id === groupA && m.activo), 'participant assigned')
    await waitFor('document.getElementById("domus-notice").textContent.includes("actualizados")', 'assignment refresh')
  }
  const person = data.participantes[0]
  await set(`[data-person="${person.id}"] [data-destination]`, groupB); await set(`[data-person="${person.id}"] [data-source]`, groupA); await click(`[data-assign="${person.id}"]`)
  await waitState(s => s.miembros.some(m => m.participante_id === person.id && m.grupo_id === groupB && m.activo), 'participant moved')
  await waitFor('document.getElementById("domus-notice").textContent.includes("actualizados")')
  assert.equal((await state()).participantes.find(p => p.id === person.id).reserva_id, person.reserva_id)
  await set(`[data-person="${person.id}"] [data-destination]`, groupA); await click(`[data-assign="${person.id}"]`)
  await waitState(s => s.miembros.filter(m => m.participante_id === person.id && m.activo).length === 2, 'multiple memberships')
  await waitFor('document.getElementById("domus-notice").textContent.includes("actualizados")')
  result.checks.push('Dos grupos, asignación, traslado y pertenencia múltiple sin perder la reserva')
  const rid = person.reserva_id
  await set(`[data-reservation-form="${rid}"] [name=estado]`, 'confirmada'); await submit(`[data-reservation-form="${rid}"]`)
  await waitState(s => s.reservas.find(r => r.id === rid).estado === 'confirmada', 'reservation state edited'); await waitFor('document.getElementById("domus-notice").textContent.includes("actualizados")')
  await set(`[data-person-form="${person.id}"] [name=nombre]`, 'Persona sintética editada'); await set(`[data-person-form="${person.id}"] [name=edad]`, 9); await submit(`[data-person-form="${person.id}"]`)
  await waitState(s => s.participantes.find(p => p.id === person.id).edad === 9, 'participant edited'); await waitFor('document.getElementById("domus-notice").textContent.includes("actualizados")')
  assert.equal((await state()).participantes.find(p => p.id === person.id).reserva_id, rid)
  result.checks.push('Edición de grupo, reserva y participante sin duplicar registros')
  await click('#domus-new-class')
  for (const [name, val] of Object.entries({ grupo_id: groupA, sala_id: room, fecha: '2026-11-07', hora_inicio: '18:00', hora_fin: '19:30', estado: 'confirmada', primera: true, publico: true, nota_publica: 'Trae ropa cómoda' })) await set(`#domus-class-form [name=${name}]`, val)
  await submit('#domus-class-form'); await waitFor('document.getElementById("domus-class-form").hidden', 'first class saved')
  const first = (await state()).clases[0].id
  await click('#domus-new-class')
  for (const [name, val] of Object.entries({ grupo_id: groupB, sala_id: room, fecha: '2026-11-07', hora_inicio: '19:00', hora_fin: '20:00', estado: 'pendiente' })) await set(`#domus-class-form [name=${name}]`, val)
  assert((await evaluate('document.getElementById("domus-class-feedback").textContent')).includes('solapamiento'))
  await submit('#domus-class-form'); await waitFor('document.getElementById("domus-notice").textContent.includes("solapa")', 'overlap rejected')
  assert.equal((await state()).clases.length, 1)
  await set('#domus-class-form [name=fecha]', '2026-11-08'); await submit('#domus-class-form'); await waitFor('document.getElementById("domus-class-form").hidden')
  result.checks.push('Primera clase pública; conflicto rechazado por PostgreSQL; clase pendiente separada')
  const adminSession = session
  const publicContext = await call('Target.createBrowserContext')
  const publicTarget = await call('Target.createTarget', { url: 'about:blank', browserContextId: publicContext.browserContextId })
  session = (await call('Target.attachToTarget', { targetId: publicTarget.targetId, flatten: true })).sessionId
  await command('Page.enable'); await command('Runtime.enable')
  await navigate('/talleres-domus/'); await waitFor('!document.getElementById("domus-submit").disabled'); await click('#domus-next')
  await waitFor('document.getElementById("domus-calendar-status").textContent.includes("Estas clases")')
  const publicText = await evaluate('document.getElementById("domus-public-calendar").textContent')
  assert(publicText.includes('18:00')); assert(!publicText.includes('19:00')); assert(!publicText.includes('Grupo sintético')); assert(!publicText.includes('600000009'))
  await call('Target.closeTarget', { targetId: publicTarget.targetId })
  session = adminSession
  result.checks.push('Calendario anónimo: misma clase guardada en agenda, sin pendientes ni datos personales')
  await click('#domus-calendar-next')
  for (const view of ['week', 'list', 'month']) { await set('#domus-calendar-view', view); assert((await evaluate('document.getElementById("domus-calendar").innerHTML')).length > 100) }
  await screenshot('admin-desktop', 1440, 1000); await screenshot('admin-tablet', 820, 1180); await screenshot('admin-mobile', 390, 844)
  // Capture the actual generated blobs: macOS isolation can refuse Chrome's
  // native temporary download files outside the dedicated task directory.
  await evaluate(`(()=>{window.__domusBlobs=new Map();window.__domusExports={};const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=create(blob);window.__domusBlobs.set(url,blob);return url};const original=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download&&window.__domusBlobs.has(this.href))window.__domusExports[this.download]=window.__domusBlobs.get(this.href);return original.call(this)};return true})()`)
  await click('#domus-export-csv'); await click('#domus-export-ics')
  for (const name of ['calendario-domus.csv', 'calendario-domus.ics']) {
    const content = await evaluate(`(async()=>{const b=window.__domusExports[${JSON.stringify(name)}];return b?await b.text():null})()`)
    assert.equal(typeof content, 'string'); fs.writeFileSync(path.join(artifacts, name), content)
  }
  await sleep(200)
  fs.writeFileSync(path.join(artifacts, 'download-events.json'), JSON.stringify(events.filter(e=>e.method.startsWith('Browser.download')), null, 2))
  assert(fs.readFileSync(path.join(artifacts, 'calendario-domus.csv'), 'utf8').includes('Grupo sintético A'))
  assert(fs.readFileSync(path.join(artifacts, 'calendario-domus.ics'), 'utf8').includes('STATUS:TENTATIVE'))
  assert(!fs.readFileSync(path.join(artifacts, 'calendario-domus.ics'), 'utf8').includes('600000009'))
  await evaluate('window.print=()=>{window.__printed=true};true'); await click('#domus-print-calendar'); assert.equal(await evaluate('window.__printed'), true)
  assert(!(await evaluate('document.getElementById("domus-print").textContent')).includes('600000009'))
  const pdf = await command('Page.printToPDF', { printBackground: true, preferCSSPageSize: true }); fs.writeFileSync(path.join(artifacts, 'calendario-domus.pdf'), Buffer.from(pdf.data, 'base64'))
  result.checks.push('Vistas mensual/semanal/listado, contenido real de CSV/ICS e impresión PDF sin datos de participantes')
  result.downloadLimit = 'Chrome inicia las descargas; el sandbox de macOS puede cancelar los temporales nativos. Los archivos reales generados se capturan y validan desde sus Blob.'
  await click('[data-tab=mensajes]'); await set('#domus-message-group', groupA)
  await set('#domus-message-contact', (await state()).reservas[0].id)
  for (const kind of ['inscripcion', 'formado', 'calendario', 'primera', 'ubicacion', 'cambio']) {
    await set('#domus-message-kind', kind)
    if (kind === 'cambio') await set('#domus-message-class', first)
    await click('#domus-prepare-message')
    assert.equal(await evaluate('document.getElementById("domus-message-link").hidden'), false, `WhatsApp ${kind}`)
    const url = new URL(await evaluate('document.getElementById("domus-message-link").href'))
    assert.equal(url.pathname, '/34600000009'); assert(!url.searchParams.get('text').includes('12 años'))
  }
  result.checks.push('Seis mensajes individuales preparados sin abrir ni enviar WhatsApp')
  await click('[data-tab=agenda]'); await click(`[data-class="${first}"]`); await click(`[data-postpone="${first}"]`)
  await set('#domus-class-form [name=fecha]', '2026-11-14'); await submit('#domus-class-form'); await waitFor('document.getElementById("domus-class-form").hidden')
  assert.equal((await state()).clases.find(c => c.id === first).estado, 'pendiente')
  await click(`[data-class="${first}"]`); await set('#domus-class-form [name=estado]', 'confirmada'); await set('#domus-class-form [name=publico]', true); await submit('#domus-class-form'); await waitFor('document.getElementById("domus-class-form").hidden')
  await click(`[data-class="${first}"]`); await click(`[data-cancel-class="${first}"]`); await waitState(s => s.clases.find(c => c.id === first).estado === 'cancelada', 'cancel class'); await waitFor('document.getElementById("domus-notice").textContent.includes("actualizados")')
  await click('[data-tab=mensajes]'); await set('#domus-message-group', groupA); await set('#domus-message-contact', (await state()).reservas[0].id); await set('#domus-message-kind', 'cancelacion'); await set('#domus-message-class', first); await click('#domus-prepare-message')
  assert((await evaluate('document.getElementById("domus-message-preview").value')).includes('CANCELADA'))
  result.checks.push('Aplazamiento sobre la misma clase, reconfirmación, cancelación y séptimo mensaje')
  await click('#domus-logout'); await waitFor('document.getElementById("domus-private").hidden')
  assert(!(await evaluate('document.body.innerText')).includes('Contacto sintético navegador'))
  assert.equal(await evaluate('document.getElementById("domus-print").childElementCount'), 0)
  result.checks.push('Cierre de sesión retira datos privados')
  await navigate('/talleres-domus/'); await waitFor('!document.getElementById("domus-submit").disabled'); await click('#domus-next')
  await waitFor('document.getElementById("domus-calendar-status").textContent.includes("Todavía")')
  assert(!(await evaluate('document.getElementById("domus-public-calendar").textContent')).includes('18:00'))
  result.checks.push('El calendario público refleja cancelaciones y oculta las clases pendientes')
  result.errors = events.filter(event => event.method === 'Runtime.exceptionThrown').map(event => event.params.exceptionDetails.text)
  assert.deepEqual(result.errors, [])
  fs.writeFileSync(path.join(artifacts, 'browser-results.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
  await call('Browser.close')
}
const timeout = setTimeout(() => { browser.kill(); console.error('Browser test timeout'); process.exit(2) }, 90000)
main().then(() => clearTimeout(timeout)).catch(error => { clearTimeout(timeout); fs.writeFileSync(path.join(artifacts, 'browser-failure.json'), JSON.stringify({ message: error.message, events: events.filter(x => x.method === 'Runtime.exceptionThrown') }, null, 2)); console.error(error); browser.kill(); process.exitCode = 1 })
