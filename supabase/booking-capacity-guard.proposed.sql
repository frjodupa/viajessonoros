-- Viajes Sonoros: guardia transaccional de aforo.
-- SOLO PARA REVISIÓN: no ejecutar directamente en producción sin pruebas.
-- Evita inserciones/ediciones/confirmaciones que excedan aforo_maximo.
-- Las pendientes también reservan provisionalmente plaza; canceladas no cuentan.
-- No elimina ni modifica reservas anteriores.
create or replace function public.vs_guard_booking_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_max integer;
  v_used bigint;
begin
  if tg_op = 'UPDATE'
     and new.experiencia_id is distinct from old.experiencia_id then
    raise exception 'No se permite cambiar la experiencia de una reserva existente'
      using errcode = '23514';
  end if;

  -- Lock por experiencia: serializa solicitudes y actualizaciones concurrentes.
  select e.aforo_maximo into v_max
  from public.experiencias e
  where e.id = new.experiencia_id
  for update;

  if not found then
    raise exception 'Experiencia inexistente'
      using errcode = '23503';
  end if;

  if new.estado = 'cancelada' or v_max is null then
    return new;
  end if;

  select coalesce(sum(r.plazas),0) into v_used
  from public.reservas_whatsapp r
  where r.experiencia_id = new.experiencia_id
    and r.estado <> 'cancelada'
    and (tg_op = 'INSERT' or r.id <> new.id);

  if v_used + new.plazas > v_max then
    raise exception 'No quedan suficientes plazas disponibles para esta experiencia'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists vs_guard_booking_capacity on public.reservas_whatsapp;
create trigger vs_guard_booking_capacity
before insert or update of plazas,estado,experiencia_id
on public.reservas_whatsapp
for each row execute function public.vs_guard_booking_capacity();
