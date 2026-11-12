-- Solo pruebas. Requiere minimum_admin_experiencias aplicada previamente.
begin;
do $$ begin
 if pg_catalog.to_regprocedure('vs_security.is_admin()') is null then
  raise exception 'Falta migración administrativa previa';
 end if;
 if exists(select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='reservas_whatsapp'
  and policyname not in ('anon_insert_published_reservation','booking_admin_select','booking_admin_insert','booking_admin_update','booking_admin_delete','booking_read_guard','booking_insert_guard','booking_authenticated_insert_guard','booking_update_guard','booking_delete_guard')) then
  raise exception 'Políticas de reservas no revisadas';
 end if;
end $$;

-- Una única exclusión por experiencia para INSERT, cambios de plazas/estado y aforo.
-- READ COMMITTED obtiene snapshot nuevo después de esperar; otros aislamientos fallan cerrados.
create or replace function vs_internal.guard_booking_capacity() returns trigger
language plpgsql security definer set search_path='' as $$
declare capacity integer; taken bigint; price_text text; unit numeric;
begin
 if pg_catalog.current_setting('transaction_isolation')<>'read committed' then
  raise exception 'Reservas requieren READ COMMITTED' using errcode='25000';
 end if;
 if tg_op='UPDATE' and new.experiencia_id is distinct from old.experiencia_id then
  raise exception 'No se permite cambiar la experiencia de una reserva' using errcode='23514';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(new.experiencia_id);
 select e.aforo_maximo,e.precio into capacity,price_text from public.experiencias e where e.id=new.experiencia_id;
 if not found then raise exception 'Experiencia inexistente' using errcode='23503';end if;
 -- Los importes enviados por un cliente no son una fuente autorizada de precios.
 if tg_op='INSERT' and pg_catalog.current_setting('role',true) in ('anon','authenticated') and not vs_security.is_admin() then
  if price_text is null or pg_catalog.btrim(price_text)='' or pg_catalog.lower(pg_catalog.btrim(price_text))='consultar' then
   unit:=null;
  elsif pg_catalog.lower(pg_catalog.btrim(price_text)) ~ '^(€[[:space:]]*)?[0-9]{1,4}([.,][0-9]{1,2})?[[:space:]]*(€|eur)?$' then
   unit:=pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(pg_catalog.lower(pg_catalog.btrim(price_text)),'eur',''),'€',''),',','.')::numeric;
  else raise exception 'Precio requiere revisión administrativa' using errcode='23514';end if;
  new.precio_unitario:=unit;new.importe_total:=unit*new.plazas;
 end if;
 if new.estado in ('cancelada','aplazada') or capacity is null then return new;end if;
 select coalesce(sum(r.plazas),0) into taken from public.reservas_whatsapp r
 where r.experiencia_id=new.experiencia_id and r.estado not in ('cancelada','aplazada') and (tg_op='INSERT' or r.id<>new.id);
 if taken+new.plazas>capacity then raise exception 'No quedan suficientes plazas disponibles' using errcode='P0001';end if;
 return new;
end $$;
revoke all on function vs_internal.guard_booking_capacity() from public,anon,authenticated;

create or replace function vs_internal.guard_experience_capacity() returns trigger
language plpgsql security definer set search_path='' as $$
declare taken bigint;
begin
 if pg_catalog.current_setting('transaction_isolation')<>'read committed' then
  raise exception 'Aforo requiere READ COMMITTED' using errcode='25000';end if;
 perform pg_catalog.pg_advisory_xact_lock(new.id);
 if new.aforo_maximo is not null then
  select coalesce(sum(r.plazas),0) into taken from public.reservas_whatsapp r
  where r.experiencia_id=new.id and r.estado not in ('cancelada','aplazada');
  if taken>new.aforo_maximo then raise exception 'Aforo inferior a plazas pendientes y confirmadas' using errcode='23514';end if;
 end if;
 return new;
end $$;
revoke all on function vs_internal.guard_experience_capacity() from public,anon,authenticated;
-- El trigger legado tomaba un row lock en orden distinto; eliminar el guard duplicado evita ese ciclo.
drop trigger if exists reservas_guard_aforo on public.reservas_whatsapp;
drop trigger if exists experiencias_guard_aforo on public.experiencias;
create trigger experiencias_guard_aforo before update of aforo_maximo on public.experiencias
for each row execute function vs_internal.guard_experience_capacity();

revoke all on public.reservas_whatsapp from public,anon,authenticated;
grant insert(experiencia_id,nombre,telefono,plazas,precio_unitario,importe_total) on public.reservas_whatsapp to anon;
grant select,insert,update,delete on public.reservas_whatsapp to authenticated;
drop policy if exists anon_insert_published_reservation on public.reservas_whatsapp;
create policy anon_insert_published_reservation on public.reservas_whatsapp for insert to anon,authenticated
with check(origen='web' and estado='pendiente' and pago_estado='pendiente'
 and exists(select 1 from public.experiencias e where e.id=experiencia_id and e.publicado is true));
drop policy if exists booking_admin_select on public.reservas_whatsapp;
create policy booking_admin_select on public.reservas_whatsapp for select to authenticated using((select public.is_vs_admin()));
drop policy if exists booking_admin_insert on public.reservas_whatsapp;
create policy booking_admin_insert on public.reservas_whatsapp for insert to authenticated with check((select public.is_vs_admin()));
drop policy if exists booking_admin_update on public.reservas_whatsapp;
create policy booking_admin_update on public.reservas_whatsapp for update to authenticated using((select public.is_vs_admin())) with check((select public.is_vs_admin()));
drop policy if exists booking_admin_delete on public.reservas_whatsapp;
create policy booking_admin_delete on public.reservas_whatsapp for delete to authenticated using((select public.is_vs_admin()));
alter table public.reservas_whatsapp enable row level security;
create policy booking_read_guard on public.reservas_whatsapp as restrictive for select to authenticated using((select public.is_vs_admin()));
-- Helper privado invocable por el dueño del trigger, pero no por anon en las políticas públicas.
create policy booking_insert_guard on public.reservas_whatsapp as restrictive for insert to anon
with check(origen='web' and estado='pendiente' and pago_estado='pendiente'
 and exists(select 1 from public.experiencias e where e.id=experiencia_id and e.publicado is true));
create policy booking_authenticated_insert_guard on public.reservas_whatsapp as restrictive for insert to authenticated
with check((select public.is_vs_admin()) or (origen='web' and estado='pendiente' and pago_estado='pendiente'
 and exists(select 1 from public.experiencias e where e.id=experiencia_id and e.publicado is true)));
create policy booking_update_guard on public.reservas_whatsapp as restrictive for update to authenticated using((select public.is_vs_admin())) with check((select public.is_vs_admin()));
create policy booking_delete_guard on public.reservas_whatsapp as restrictive for delete to authenticated using((select public.is_vs_admin()));
commit;
