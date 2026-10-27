begin;
create table if not exists public.domus_referencia_contadores (
 fecha date primary key,
 ultimo integer not null check (ultimo >= 1)
);
revoke all on public.domus_referencia_contadores from public, anon, authenticated;
alter table public.domus_referencia_contadores enable row level security;
alter table public.domus_reservas add column if not exists referencia_corta text;
create unique index if not exists domus_referencia_corta_unica on public.domus_reservas(referencia_corta);
create or replace function domus_private.generar_referencia_corta() returns trigger
language plpgsql security definer set search_path='' as $$
declare dia date; siguiente integer;
begin
 dia := (new.creado_en at time zone 'Europe/Madrid')::date;
 insert into public.domus_referencia_contadores(fecha,ultimo) values (dia,1)
 on conflict(fecha) do update set ultimo=public.domus_referencia_contadores.ultimo+1
 returning ultimo into siguiente;
 new.referencia_corta := to_char(dia,'DDMMYY') || siguiente::text;
 return new;
end $$;
revoke all on function domus_private.generar_referencia_corta() from public,anon,authenticated;
create trigger domus_generar_referencia_corta
before insert on public.domus_reservas for each row
execute function domus_private.generar_referencia_corta();
create or replace function public.domus_registrar_con_referencia(p_solicitud jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; codigo text;
begin
 rid:=domus_private.registrar(p_solicitud);
 select referencia_corta into codigo from public.domus_reservas where id=rid;
 return jsonb_build_object('id',rid,'codigo',codigo);
end $$;
revoke all on function public.domus_registrar_con_referencia(jsonb) from public;
grant execute on function public.domus_registrar_con_referencia(jsonb) to anon,authenticated;
with ordenadas as (
 select id, (creado_en at time zone 'Europe/Madrid')::date as dia,
 row_number() over (partition by (creado_en at time zone 'Europe/Madrid')::date order by creado_en,id) as numero
 from public.domus_reservas where referencia_corta is null
), registradas as (
 update public.domus_reservas r
 set referencia_corta = to_char(o.dia,'DDMMYY') || o.numero::text
 from ordenadas o where r.id=o.id
 returning o.dia,o.numero
)
insert into public.domus_referencia_contadores(fecha,ultimo)
select dia,max(numero)::integer from registradas group by dia
on conflict(fecha) do update set ultimo=greatest(public.domus_referencia_contadores.ultimo,excluded.ultimo);
commit;