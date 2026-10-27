import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { readFile } from 'node:fs/promises'

export const ADMIN = '11111111-1111-4111-8111-111111111111'
export const OTHER = '22222222-2222-4222-8222-222222222222'
export async function createTestDB({ corrections = true } = {}) {
  const db = await PGlite.create({ extensions: { btree_gist } })
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    insert into auth.users values ('${ADMIN}','info@viajessonoros.es',now()),('${OTHER}','prueba@example.invalid',now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table public.experiencias(id bigint primary key,titulo text);
    create table public.reservas_whatsapp(id uuid primary key,experiencia_id bigint references public.experiencias);
    insert into public.experiencias values(101,'Experiencia sintética protegida');
    insert into public.reservas_whatsapp values('33333333-3333-4333-8333-333333333333',101);
  `)
  const migration = await readFile(new URL('../supabase/migrations/20261027152110_domus_independent_agenda.sql', import.meta.url), 'utf8')
  await db.exec(migration)
  if (corrections) await db.exec(await readFile(new URL('../supabase/migrations/20261027161840_domus_names_prices_whatsapp.sql', import.meta.url), 'utf8'))
  const asRole = (role, sql, args = [], user = role === 'authenticated' ? ADMIN : '') => db.transaction(async tx => {
    await tx.exec(`set local role ${role === 'anon' ? 'anon' : 'authenticated'}`)
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user])
    return tx.query(sql, args)
  })
  return { db, asRole }
}
