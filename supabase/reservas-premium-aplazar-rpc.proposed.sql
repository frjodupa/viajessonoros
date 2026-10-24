-- PROPUESTA GITOP: NO APLICAR A PRODUCCIÓN SIN BACKUP, RLS Y PRUEBAS.
-- RPC transaccional para aplazar una reserva pagada, reteniendo crédito.
-- Prerrequisitos: tablas reservas_aplazamientos y reservas_premium_movimientos.
-- Contrato: no borrar reserva origen, no generar destino automáticamente.
create or replace function public.vs_premium_aplazar(p_reserva_id uuid,p_motivo text)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare
 v_actor uuid;
 v_email text;
 v_reserva public.reservas_whatsapp%rowtype;
 v_aplazamiento uuid;
begin
 v_actor := (select auth.uid());
 if v_actor is null then raise exception 'Acceso no autorizado' using errcode='42501'; end if;
 select lower(u.email) into v_email from auth.users u where u.id=v_actor;
 if v_email is distinct from 'info@viajessonoros.es' then
  raise exception 'Se requiere cuenta administradora' using errcode='42501';
 end if;
 if length(btrim(coalesce(p_motivo,''))) < 5 then
  raise exception 'Indica el motivo del aplazamiento' using errcode='22023';
 end if;
 select * into v_reserva from public.reservas_whatsapp where id=p_reserva_id for update;
 if not found then raise exception 'Reserva inexistente' using errcode='P0002'; end if;
 if v_reserva.estado <> 'confirmada' or v_reserva.pago_estado <> 'recibido' then
  raise exception 'Solo se aplazan reservas confirmadas con pago recibido' using errcode='23514';
 end if;
 if v_reserva.importe_total is null or v_reserva.importe_total <= 0 then
  raise exception 'Aportación no conciliada: revisar antes de aplazar' using errcode='23514';
 end if;
 if exists(select 1 from public.reservas_aplazamientos where reserva_origen_id=p_reserva_id and estado <> 'anulado') then
  raise exception 'Esta reserva ya tiene un aplazamiento vigente' using errcode='23505';
 end if;
 insert into public.reservas_aplazamientos
  (reserva_origen_id,importe_conservado,plazas_origen,motivo)
 values(p_reserva_id,v_reserva.importe_total,v_reserva.plazas,btrim(p_motivo))
 returning id into v_aplazamiento;
 update public.reservas_whatsapp set estado='aplazada' where id=p_reserva_id;
 insert into public.reservas_premium_movimientos
  (reserva_id,tipo,estado_anterior,estado_nuevo,motivo,importe,actor)
 values(p_reserva_id,'aplazamiento','confirmada','aplazada',btrim(p_motivo),v_reserva.importe_total,v_actor);
 return v_aplazamiento;
end; $$;
-- Esta función aún no se expone: revisar permisos antes de conceder EXECUTE.
revoke all on function public.vs_premium_aplazar(uuid,text) from public,anon,authenticated;
-- Tras aprobar la auditoría: GRANT EXECUTE exclusivamente a authenticated
-- y validar el rol administrador también en cada invocación.
-- Se requiere adaptar la guardia de aforo: debe excluir estado 'aplazada'.
