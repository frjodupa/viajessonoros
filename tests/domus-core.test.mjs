import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { calendarHTML, classifyAges, groupMessage, madridParts, overlaps, whatsappURL } from '../src/domus-core.js'

test('Edades orientativas configurables y grupos mixtos', () => {
  assert.equal(classifyAges([8, 12]), 'Niños'); assert.equal(classifyAges([8, 35]), 'Mixto')
  assert.equal(classifyAges([17], 18), 'Niños'); assert.equal(classifyAges([17], 16), 'Adultos')
})
const group = { id: 'g1', nombre: 'Grupo de prueba', estado: 'confirmado', profesor: 'José Duque', sala_id: 's1' }
const contact = { nombre: 'Contacto de prueba', telefono: '600000001', estado: 'pendiente' }
const config = { profesor: 'José Duque', lugar: 'Maltravieso, Calle San José, 18 — Cáceres' }
const classes = [{ id: 'c1', grupo_id: 'g1', sala_id: 's1', estado: 'confirmada', inicio: '2026-11-07T17:00:00Z', fin: '2026-11-07T18:30:00Z', primera: true, nota_publica: 'Ropa cómoda', notas: 'EDAD Y DATOS PRIVADOS' }, { id: 'c2', grupo_id: 'g1', estado: 'pendiente', inicio: '2026-11-14T17:00:00Z', fin: '2026-11-14T18:30:00Z' }]
const rooms = [{ id: 's1', nombre: 'Sala de prueba', direccion: config.lugar }]
test('Inscripción y ubicación pueden comunicarse antes de formar un grupo', () => {
  for (const kind of ['inscripcion', 'ubicacion']) {
    const text = groupMessage({ kind, contact, group: null, classes, rooms, config })
    assert(text.includes('Contacto de prueba')); assert(text.includes('Maltravieso')); assert(!text.includes('Grupo:'))
  }
  assert.throws(() => groupMessage({ kind: 'calendario', contact, group: null, classes, rooms, config }), /Selecciona un grupo/)
})
test('WhatsApp individual: siete comunicaciones, solo fechas confirmadas y ningún dato de otra familia', () => {
  for (const kind of ['inscripcion', 'formado', 'calendario', 'primera', 'ubicacion', 'cambio', 'cancelacion']) {
    const selectedClass = kind === 'cancelacion' ? { ...classes[0], estado: 'cancelada' } : classes[0]
    const text = groupMessage({ kind, contact, group, classes, rooms, config, selectedClass })
    assert(text.includes('Contacto de prueba')); assert(text.includes('José Duque')); assert(!text.includes('EDAD Y DATOS PRIVADOS'))
    assert(!text.includes('14 de noviembre')); assert(!text.includes('600000001'))
    const url = new URL(whatsappURL(contact.telefono, text)); assert.equal(url.pathname, '/34600000001'); assert.equal(url.searchParams.get('text'), text)
  }
  const pending = groupMessage({ kind: 'inscripcion', contact, group, classes, rooms, config })
  assert(pending.includes('pendiente')); assert(!pending.includes('consta como confirmada'))
  assert.throws(() => groupMessage({ kind: 'formado', contact, group: { ...group, estado: 'en_formacion' }, classes, rooms, config }), /todavía no está confirmado/)
})
test('Calendario Domus: colores, fines de semana, navegación, semana y listado', () => {
  const publicHTML = calendarHTML(classes.slice(0, 1), '2026-11-01')
  assert(publicHTML.includes('weekend')); assert(publicHTML.includes('2026-11-30')); assert(!publicHTML.includes('Grupo de prueba'))
  assert(calendarHTML(classes, '2026-11-07', 'week', true, [group], rooms).includes('data-class="c1"'))
  assert(calendarHTML(classes, '2026-11-01', 'list').includes('7 de noviembre'))
  assert.equal(madridParts('2027-07-01T16:00:00Z').time, '18:00')
  assert.equal(overlaps(classes[0], { ...classes[0], inicio: classes[0].fin, fin: '2026-11-07T20:00:00Z' }), false)
})
test('Página independiente conserva imágenes y el código Domus no usa las tablas generales', async () => {
  const html = await readFile(new URL('../public/talleres-domus/index.html', import.meta.url), 'utf8')
  assert.equal((html.match(/<img /g) || []).length, 10)
  assert(!html.includes('localStorage')); assert(!html.includes('plannerForm')); assert(!html.includes('60 min'))
  assert(html.includes('Las edades se solicitan únicamente para organizar adecuadamente los grupos y las clases.'))
  for (const path of ['../src/domus-admin.js', '../src/domus-public.js']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert(!/\.from\(['"](?:experiencias|reservas_whatsapp)['"]\)/.test(source))
  }
})
