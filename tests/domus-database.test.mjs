import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createTestDB, OTHER } from './domus-test-db.mjs'

test('Base de datos Domus: integridad, privacidad y aislamiento del sistema oficial', async t => {
  const { db, asRole } = await createTestDB()
  t.after(() => db.close())
  const submit = payload => asRole('anon', 'select public.domus_registrar($1::jsonb) as id', [JSON.stringify(payload)])
  const payload = { clave: randomUUID(), nombre: 'Contacto sintético', telefono: '600000001', edades: [8, 35], modalidad: 'bono4', preferencias: 'Sábados', observaciones: 'Solo prueba', responsable_adulto: true }
  let reservation, people, groupA, groupB, room, roomB, first
  const createClass = data => asRole('authenticated', 'select public.domus_guardar_clase($1::jsonb) as id', [JSON.stringify({ fecha: '2026-11-07', hora_inicio: '18:00', hora_fin: '19:30', grupo_id: groupA, sala_id: room, estado: 'confirmada', publico: false, ...data })])
  await t.test('Registro anónimo atómico; estado pendiente e idempotencia real', async () => {
    const a = await submit(payload), b = await submit(payload)
    reservation = a.rows[0].id
    assert.equal(b.rows[0].id, reservation)
    const rows = await db.query('select * from domus_reservas')
    assert.equal(rows.rows.length, 1); assert.equal(rows.rows[0].estado, 'pendiente')
    people = (await db.query('select * from domus_participantes order by orden')).rows
    assert.deepEqual(people.map(p => p.edad), [8, 35])
    await assert.rejects(submit({ ...payload, nombre: 'Otro contacto' }), /ya se registró/)
  })
  await t.test('No se puede inyectar estado confirmado desde el formulario', async () => {
    const result = await submit({ ...payload, clave: randomUUID(), edades: [25], estado: 'confirmada', publico: true })
    const r = await db.query('select estado from domus_reservas where id=$1', [result.rows[0].id])
    assert.equal(r.rows[0].estado, 'pendiente')
  })
  await t.test('Edades individuales, contacto adulto, teléfono y límites validados en servidor', async () => {
    for (const changes of [{ edades: [] }, { edades: [8], responsable_adulto: false }, { edades: [null] }, { edades: ['8'] }, { edades: [-1] }, { edades: [121] }, { edades: [8.5] }, { edades: Array(31).fill(20) }, { telefono: 'inválido' }, { modalidad: 'cualquiera' }]) {
      await assert.rejects(submit({ ...payload, clave: randomUUID(), ...changes }))
    }
    assert.equal((await db.query('select count(*)::int as n from domus_reservas')).rows[0].n, 2)
  })
  await t.test('Anon y otra cuenta no pueden leer ni administrar datos personales', async () => {
    for (const table of ['domus_reservas', 'domus_participantes', 'domus_grupos', 'domus_grupos_participantes', 'domus_clases', 'domus_salas', 'domus_config']) {
      await assert.rejects(asRole('anon', `select * from ${table}`), /permission denied/)
      assert.equal((await asRole('authenticated', `select * from ${table}`, [], OTHER)).rows.length, 0)
    }
    await assert.rejects(asRole('authenticated', 'select domus_admin_datos()', [], OTHER), /restringido/)
    await assert.rejects(asRole('anon', 'select domus_admin_datos()'), /permission denied/)
    await assert.rejects(asRole('authenticated', "insert into domus_grupos(nombre,tipo,modalidad) values('No permitido','adultos','taller')", [], OTHER), /row-level security/)
  })
  await t.test('Creación y edición de grupos con estados separados de la reserva', async () => {
    room = (await db.query('select id from domus_salas')).rows[0].id
    groupA = (await asRole('authenticated', "insert into domus_grupos(nombre,tipo,modalidad,sala_id) values('Grupo sintético A','mixto','bono',$1) returning id", [room])).rows[0].id
    groupB = (await asRole('authenticated', "insert into domus_grupos(nombre,tipo,modalidad) values('Grupo sintético B','adultos','taller') returning id")).rows[0].id
    await asRole('authenticated', "update domus_grupos set estado='confirmado',edad_min=5,edad_max=80 where id=$1", [groupA])
    assert.equal((await db.query('select estado from domus_reservas where id=$1', [reservation])).rows[0].estado, 'pendiente')
  })
  await t.test('Asignar, pertenecer a dos grupos y mover conserva reserva e historial', async () => {
    const assign = (from, to) => asRole('authenticated', 'select domus_mover_participante($1,$2,$3)', [people[0].id, from, to])
    await assign(null, groupA); await assign(null, groupA)
    await assign(null, groupB)
    assert.equal((await db.query('select count(*)::int as n from domus_grupos_participantes where activo')).rows[0].n, 2)
    await assign(groupA, groupB)
    assert.equal((await db.query('select activo from domus_grupos_participantes where grupo_id=$1', [groupA])).rows[0].activo, false)
    assert.equal((await db.query('select reserva_id from domus_participantes where id=$1', [people[0].id])).rows[0].reserva_id, reservation)
    await assert.rejects(asRole('authenticated', 'update domus_participantes set reserva_id=$1 where id=$2', [randomUUID(), people[0].id]), /reserva original/)
    await assign(null, groupA)
  })
  await t.test('Primera clase y duración en hora de Cáceres', async () => {
    first = (await createClass({ publico: true, primera: true, nota_publica: 'Trae ropa cómoda', notas: 'Nota privada sintética' })).rows[0].id
    const row = (await db.query('select * from domus_clases where id=$1', [first])).rows[0]
    assert.equal(new Date(row.inicio).toISOString(), '2026-11-07T17:00:00.000Z')
    assert.equal((new Date(row.fin) - new Date(row.inicio)) / 60000, 90)
    await assert.rejects(createClass({ fecha: '2026-11-08', primera: true }), /domus_primera_clase/)
  })
  await t.test('Restricciones excluyentes: sala/grupo, pendientes, extremos contiguos y cancelaciones', async () => {
    await assert.rejects(createClass({ grupo_id: groupB, hora_inicio: '19:00', hora_fin: '20:00' }), /domus_sala_sin_solapamiento/)
    roomB = (await asRole('authenticated', "insert into domus_salas(nombre) values('Sala sintética B') returning id")).rows[0].id
    await assert.rejects(createClass({ sala_id: roomB, hora_inicio: '18:30' }), /domus_grupo_sin_solapamiento/)
    await assert.rejects(createClass({ grupo_id: groupB, estado: 'pendiente', hora_inicio: '18:30' }), /domus_sala_sin_solapamiento/)
    await createClass({ hora_inicio: '19:30', hora_fin: '21:00', estado: 'pendiente' })
    await createClass({ grupo_id: groupB, estado: 'cancelada', hora_inicio: '18:30' })
    await assert.rejects(createClass({ fecha: '2026-11-09', estado: 'pendiente', publico: true }), /check constraint/)
    await assert.rejects(createClass({ fecha: '2026-11-09', hora_fin: '17:00' }), /check constraint/)
    await assert.rejects(createClass({ fecha: '2027-03-28', hora_inicio: '02:30', hora_fin: '04:00' }), /Hora inexistente/)
  })
  await t.test('La sala ocupada bloquea horarios y nunca es pública', async () => {
    await createClass({ fecha: '2026-11-10', grupo_id: null, estado: 'ocupada' })
    await assert.rejects(createClass({ fecha: '2026-11-10', hora_inicio: '18:15' }), /domus_sala_sin_solapamiento/)
    await assert.rejects(createClass({ fecha: '2026-11-11', grupo_id: null, estado: 'ocupada', publico: true }), /check constraint/)
  })
  await t.test('Calendario público: solo publicación explícita, clase y grupo confirmados, sin PII', async () => {
    await createClass({ fecha: '2026-11-12', grupo_id: groupB, publico: true })
    const result = await asRole('anon', "select domus_calendario('2026-11-01','2026-11-30') as data")
    assert.equal(result.rows[0].data.clases.length, 1)
    const c = result.rows[0].data.clases[0]
    assert.equal(c.id, first)
    assert.deepEqual(Object.keys(c).sort(), ['fin', 'id', 'inicio', 'lugar', 'nota_publica', 'primera', 'profesor', 'sala'])
    assert(!JSON.stringify(result.rows).includes('600000001')); assert(!JSON.stringify(result.rows).includes('Nota privada'))
    assert(!JSON.stringify(result.rows).includes('Contacto sintético')); assert(!JSON.stringify(result.rows).includes('edad":'))
    await assert.rejects(asRole('anon', "select domus_calendario('2026-01-01','2028-01-01')"), /Intervalo inválido/)
  })
  await t.test('Aplazar y editar la clase actualiza la misma fila y evita sobrescribir otra edición', async () => {
    const before = (await db.query('select * from domus_clases where id=$1', [first])).rows[0]
    await createClass({ id: first, actualizado_en: before.actualizado_en, fecha: '2026-11-14', estado: 'pendiente', publico: false, primera: true })
    assert.equal((await db.query('select count(*)::int as n from domus_clases where id=$1', [first])).rows[0].n, 1)
    await assert.rejects(createClass({ id: first, actualizado_en: before.actualizado_en, fecha: '2026-11-15' }), /otro dispositivo/)
    assert.equal((await asRole('anon', "select domus_calendario('2026-11-01','2026-11-30') as data")).rows[0].data.clases.length, 0)
  })
  await t.test('Cancelar un grupo cancela clases y retira su publicación', async () => {
    await asRole('authenticated', "update domus_grupos set estado='cancelado' where id=$1", [groupA])
    const rows = (await db.query('select * from domus_clases where grupo_id=$1', [groupA])).rows
    assert(rows.every(c => c.estado === 'cancelada' && !c.publico))
    await assert.rejects(asRole('authenticated', 'select domus_mover_participante($1,null,$2)', [people[1].id, groupA]), /grupo disponible/)
  })
  await t.test('Integridad del número de edades y acceso al panel privado', async () => {
    await assert.rejects(asRole('authenticated', 'update domus_reservas set numero_participantes=3 where id=$1', [reservation]), /una edad por participante/)
    await assert.rejects(asRole('authenticated', 'update domus_reservas set responsable_adulto=false where id=$1', [reservation]), /adulto responsable/)
    const data = (await asRole('authenticated', 'select domus_admin_datos() as data')).rows[0].data
    assert(data.participantes.length > 0)
    assert(!JSON.stringify(data.reservas).includes('huella'))
  })
  await t.test('Sistema A intacto; todas las relaciones nuevas son solo Domus', async () => {
    assert.equal((await db.query('select * from experiencias')).rows[0].titulo, 'Experiencia sintética protegida')
    assert.equal((await db.query('select count(*)::int as n from reservas_whatsapp')).rows[0].n, 1)
    const foreignKeys = (await db.query("select confrelid::regclass::text as target from pg_constraint where contype='f' and conrelid::regclass::text like 'domus_%'")).rows
    assert(foreignKeys.every(r => r.target.startsWith('domus_')))
    const rls = (await db.query("select relname,relrowsecurity from pg_class where relname in ('domus_config','domus_reservas','domus_participantes','domus_grupos','domus_grupos_participantes','domus_clases','domus_salas')")).rows
    assert.equal(rls.length, 7); assert(rls.every(r => r.relrowsecurity))
  })
  await t.test('La reversión rechaza borrar datos de talleres ya existentes', async () => {
    const rollback = await readFile(new URL('../supabase/domus-rollback.sql', import.meta.url), 'utf8')
    await assert.rejects(db.exec(rollback), /Reversión detenida/)
    await db.exec('rollback')
    assert((await db.query('select count(*)::int as n from domus_reservas')).rows[0].n > 0)
  })
})
test('Reversión de una instalación Domus vacía conserva el sistema A', async () => {
  const { db } = await createTestDB()
  try {
    const rollback = await readFile(new URL('../supabase/domus-rollback.sql', import.meta.url), 'utf8')
    await db.exec(rollback)
    assert.equal((await db.query("select to_regclass('public.domus_reservas') as table_name")).rows[0].table_name, null)
    assert.equal((await db.query('select count(*)::int as n from reservas_whatsapp')).rows[0].n, 1)
  } finally { await db.close() }
})
