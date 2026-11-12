-- PROPUESTA TRANSACCIONAL; NO APLICADA. No modifica reservas, Storage ni filas de experiencias.
-- Generada con Supabase CLI 2.122.0; validación aislada. No aplicar remotamente sin autorización.
-- Antes de ejecutar en pruebas: SET vs_security.admin_user_id = '<UUID confirmado por el titular>';
begin;
-- No adaptar a ciegas políticas nuevas que no constaban en la auditoría.
do $$
begin
  if exists (select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='experiencias'
    and policyname not in ('experiencias_public_read','experiencias_authenticated_read',
      'experiencias_authenticated_insert','experiencias_authenticated_update','experiencias_authenticated_delete',
      'vs_admin_read_guard','vs_public_read_guard','vs_admin_insert_guard','vs_admin_update_guard','vs_admin_delete_guard')) then
    raise exception 'Políticas de experiencias no revisadas; detener y actualizar inventario';
  end if;
  if not pg_catalog.has_schema_privilege('anon','public','USAGE') or
     not pg_catalog.has_schema_privilege('authenticated','public','USAGE') then
    raise exception 'Falta USAGE de public; revisar sin ampliar permisos globales automáticamente';
  end if;
end $$;

create schema if not exists vs_security;
revoke all on schema vs_security from public, anon, authenticated;
grant usage on schema vs_security to authenticated;
create table if not exists vs_security.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table vs_security.admin_users enable row level security;
revoke all on table vs_security.admin_users from public, anon, authenticated;
do $$
declare admin_id uuid := nullif(pg_catalog.current_setting('vs_security.admin_user_id',true),'')::uuid;
begin
  if admin_id is null then raise exception 'Falta UUID administrativo explícito; transacción cancelada'; end if;
  if not exists(select 1 from auth.users where id=admin_id and email_confirmed_at is not null) then
    raise exception 'UUID inexistente o correo no confirmado; transacción cancelada';
  end if;
  if exists(select 1 from vs_security.admin_users where user_id<>admin_id) then
    raise exception 'Hay otros administradores registrados: revisión expresa requerida';
  end if;
  insert into vs_security.admin_users(user_id) values(admin_id) on conflict do nothing;
end $$;

-- Único DEFINER: privado, sin parámetros ni SQL dinámico, solo pregunta por auth.uid().
-- vs_security NO debe figurar en los esquemas expuestos del Data API.
create or replace function vs_security.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select (select auth.uid()) is not null and exists(
  select 1 from vs_security.admin_users a join auth.users u on u.id=a.user_id
  where a.user_id=(select auth.uid()) and u.email_confirmed_at is not null
) $$;
revoke all on function vs_security.is_admin() from public, anon, authenticated;
grant execute on function vs_security.is_admin() to authenticated;
-- RPC pública mínima: INVOKER; no acepta un UUID de otra persona ni devuelve membresías.
create or replace function public.is_vs_admin() returns boolean
language sql stable security invoker set search_path = ''
as $$ select vs_security.is_admin() $$;
revoke all on function public.is_vs_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_vs_admin() to authenticated;

alter table public.experiencias enable row level security;
-- GRANT permite llegar a RLS; no autoriza filas por sí solo.
revoke all on table public.experiencias from public, anon, authenticated;
grant select on table public.experiencias to anon;
grant select, insert, update, delete on table public.experiencias to authenticated;
-- Para una eventual ID serial, limitar solo SU secuencia; no tocar otras.
do $$
declare sequence_name text := pg_catalog.pg_get_serial_sequence('public.experiencias','id');
begin
  if sequence_name is not null then
    execute pg_catalog.format('revoke all on sequence %s from public, anon, authenticated',sequence_name);
    execute pg_catalog.format('grant usage on sequence %s to authenticated',sequence_name);
  end if;
end $$;

drop policy if exists experiencias_public_read on public.experiencias;
create policy experiencias_public_read on public.experiencias for select to anon
using (publicado is true);
drop policy if exists experiencias_authenticated_read on public.experiencias;
create policy experiencias_authenticated_read on public.experiencias for select to authenticated
using (publicado is true or (select public.is_vs_admin()));
drop policy if exists experiencias_authenticated_insert on public.experiencias;
create policy experiencias_authenticated_insert on public.experiencias for insert to authenticated
with check ((select public.is_vs_admin()));
drop policy if exists experiencias_authenticated_update on public.experiencias;
create policy experiencias_authenticated_update on public.experiencias for update to authenticated
using ((select public.is_vs_admin())) with check ((select public.is_vs_admin()));
drop policy if exists experiencias_authenticated_delete on public.experiencias;
create policy experiencias_authenticated_delete on public.experiencias for delete to authenticated
using ((select public.is_vs_admin()));

-- Guardias restrictivas evitan que una política permisiva futura reabra el acceso.
drop policy if exists vs_public_read_guard on public.experiencias;
create policy vs_public_read_guard on public.experiencias as restrictive for select to anon
using (publicado is true);
drop policy if exists vs_admin_read_guard on public.experiencias;
create policy vs_admin_read_guard on public.experiencias as restrictive for select to authenticated
using (publicado is true or (select public.is_vs_admin()));
drop policy if exists vs_admin_insert_guard on public.experiencias;
create policy vs_admin_insert_guard on public.experiencias as restrictive for insert to authenticated
with check ((select public.is_vs_admin()));
drop policy if exists vs_admin_update_guard on public.experiencias;
create policy vs_admin_update_guard on public.experiencias as restrictive for update to authenticated
using ((select public.is_vs_admin())) with check ((select public.is_vs_admin()));
drop policy if exists vs_admin_delete_guard on public.experiencias;
create policy vs_admin_delete_guard on public.experiencias as restrictive for delete to authenticated
using ((select public.is_vs_admin()));
commit;
