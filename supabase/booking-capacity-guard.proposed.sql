-- Propuesta NO APLICADA. Revisar permisos y probar en entorno aislado antes de usar.
-- No modifica ni borra reservas históricas.
-- El trigger debe leer TODAS las reservas, incluidas las ocultas por RLS a anon.
-- SELECT ... FOR UPDATE sobre experiencias falla para anon sin permisos UPDATE.
-- Una función SECURITY DEFINER dentro de un esquema NO expuesto permite contar
-- las plazas bajo control, pero exige auditoría de privilegios y propietario.
create schema if not exists vs_internal;
revoke all on schema vs_internal from public, anon, authenticated;

create or replace function vs_internal.guard_booking_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_taken bigint;
begin
  if tg_op = 'UPDATE' and new.experiencia_id is distinct from old.experiencia_id then
    raise exception 'No se permite cambiar la experiencia de una reserva'
      using errcode = '23514';
  end if;

  -- Bloqueo por experiencia para serializar escrituras en reservas.
  perform pg_catalog.pg_advisory_xact_lock(new.experiencia_id);

  select aforo_maximo into v_capacity
  from public.experiencias
  where id = new.experiencia_id;

  if not found then
    raise exception 'Experiencia inexistente' using errcode = '23503';
  end if;

  if new.estado = 'cancelada' or v_capacity is null then
    return new;
  end if;

  select coalesce(sum(plazas), 0) into v_taken
  from public.reservas_whatsapp
  where experiencia_id = new.experiencia_id
    and estado <> 'cancelada'
    and (tg_op = 'INSERT' or id <> new.id);

  if v_taken + new.plazas > v_capacity then
    raise exception 'No quedan suficientes plazas disponibles para esta experiencia'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Revocar ejecución directa: únicamente se usará desde el trigger.
revoke all on function vs_internal.guard_booking_capacity() from public, anon, authenticated;

-- NO ACTIVAR sin probar: INSERT simultáneos, UPDATE, cancelación,
-- RLS anon, integridad de las reservas actuales y concurrencia.
-- drop trigger if exists vs_guard_booking_capacity on public.reservas_whatsapp;
-- create trigger vs_guard_booking_capacity
-- before insert or update of plazas,estado,experiencia_id
-- on public.reservas_whatsapp
-- for each row execute function vs_internal.guard_booking_capacity();
