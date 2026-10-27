// Local-only test adapter. No Supabase credentials or production connections.
// Exercises the real frontend and SQL functions through a small PostgREST fixture.
import { createServer } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { createTestDB, ADMIN } from './domus-test-db.mjs'
const { db, asRole } = await createTestDB()
const port = Number(process.env.DOMUS_TEST_PORT || 18745)
if (process.env.VITE_SUPABASE_URL !== `http://127.0.0.1:${port}/__db`) throw new Error('Test URL must be the isolated local adapter')
const user = { id: ADMIN, aud: 'authenticated', role: 'authenticated', email: 'info@viajessonoros.es', email_confirmed_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [] }
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: ADMIN, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fixture-signature`
const rpc = {
  domus_registrar: [['p_solicitud', 'jsonb']], domus_calendario: [['p_desde', 'date'], ['p_hasta', 'date']], domus_admin_datos: [],
  domus_guardar_clase: [['p_clase', 'jsonb']], domus_mover_participante: [['p_participante', 'uuid'], ['p_desde', 'uuid'], ['p_hacia', 'uuid']],
}
const columns = new Map((await db.query("select table_name,array_agg(column_name)::text[] as columns from information_schema.columns where table_schema='public' and table_name like 'domus_%' group by table_name")).rows.map(row => [row.table_name, new Set(row.columns)]))
function send(res, status, data) { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(data === undefined ? '' : JSON.stringify(data)) }
async function body(req) { let text = ''; for await (const chunk of req) { text += chunk; if (text.length > 65536) throw new Error('Fixture request too large') } return text ? JSON.parse(text) : {} }
const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true }, plugins: [{
  name: 'domus-synthetic-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, `http://127.0.0.1:${port}`)
      if (url.pathname === '/__test/reset' && req.method === 'POST') {
        await db.exec('truncate public.domus_clases,public.domus_grupos_participantes,public.domus_participantes,public.domus_reservas,public.domus_grupos')
        return send(res, 200, { syntheticDatabaseReset: true })
      }
      if (url.pathname === '/__test/state') {
        try { return send(res, 200, (await asRole('authenticated', 'select domus_admin_datos() as data')).rows[0].data) } catch (error) { return send(res, 500, { message: error.message }) }
      }
      if (process.env.DOMUS_TEST_DIST === '1' && /^\/(?:talleres-domus\/|assets\/)/.test(url.pathname)) {
        const dist = resolve('dist'), relative = url.pathname === '/talleres-domus/' ? 'talleres-domus/index.html' : url.pathname.slice(1)
        const file = resolve(dist, relative)
        if (!file.startsWith(dist + '/')) return send(res, 400, { message: 'Invalid fixture path' })
        try { res.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] || 'application/octet-stream'); res.end(readFileSync(file)); return }
        catch { return send(res, 404, { message: 'Build asset not found' }) }
      }
      if (!url.pathname.startsWith('/__db/')) return next()
      try {
        if (url.pathname.includes('/auth/v1/token')) {
          const data = await body(req)
          if (data.email !== user.email || data.password !== 'solo-pruebas-domus') return send(res, 400, { message: 'Credenciales de prueba incorrectas' })
          return send(res, 200, { access_token: token, token_type: 'bearer', expires_in: 3600, refresh_token: 'fixture-refresh-token', user })
        }
        const authorized = req.headers.authorization === `Bearer ${token}`
        if (url.pathname.endsWith('/auth/v1/user')) return send(res, authorized ? 200 : 401, authorized ? user : { message: 'No synthetic session' })
        if (url.pathname.endsWith('/auth/v1/logout')) return send(res, 204)
        const role = authorized ? 'authenticated' : 'anon'
        const name = url.pathname.split('/').pop()
        if (url.pathname.includes('/rest/v1/rpc/')) {
          if (!Object.hasOwn(rpc, name)) throw new Error('RPC outside Domus fixture')
          const data = await body(req), params = rpc[name]
          const result = await asRole(role, `select public.${name}(${params.map(([, type], i) => `$${i + 1}::${type}`).join(',')}) as value`, params.map(([key, type]) => type === 'jsonb' ? JSON.stringify(data[key]) : data[key] ?? null))
          return send(res, 200, result.rows[0].value)
        }
        if (!columns.has(name)) throw new Error('Table outside Domus fixture')
        const valid = col => { if (!columns.get(name).has(col)) throw new Error('Column outside fixture'); return `"${col}"` }
        const data = await body(req), keys = Object.keys(data), args = keys.map(k => data[k])
        let sql
        if (req.method === 'POST') sql = `insert into public.${name}(${keys.map(valid).join(',')}) values(${keys.map((_, i) => `$${i + 1}`).join(',')}) returning *`
        else if (req.method === 'PATCH') {
          const filters = [...url.searchParams].filter(([key]) => key !== 'select').map(([key, expression]) => {
            if (!expression.startsWith('eq.')) throw new Error('Unsupported fixture filter')
            args.push(expression.slice(3)); return `${valid(key)}=$${args.length}`
          })
          if (!filters.length) throw new Error('Unfiltered update refused')
          sql = `update public.${name} set ${keys.map((key, i) => `${valid(key)}=$${i + 1}`).join(',')} where ${filters.join(' and ')} returning *`
        } else throw new Error('Unsupported fixture operation')
        const result = await asRole(role, sql, args)
        const representation = String(req.headers.prefer || '').includes('return=representation')
        return send(res, req.method === 'POST' ? 201 : 200, representation ? (String(req.headers.accept).includes('vnd.pgrst.object') ? result.rows[0] || null : result.rows) : undefined)
      } catch (error) { return send(res, 400, { code: error.code || 'FIXTURE_ERROR', message: error.message, details: error.detail || null, hint: null }) }
    })
  },
}] })
await server.listen()
console.log(`Domus synthetic browser fixture ready on http://127.0.0.1:${port}`)
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, async () => { await server.close(); await db.close(); process.exit(0) })
