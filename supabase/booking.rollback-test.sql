-- SOLO TEST: restaura permisos previos conocidos; no aplicar en producción a ciegas.
begin;
drop policy if exists anon_insert_published_reservation on public.reservas_whatsapp;
drop policy if exists booking_admin_select on public.reservas_whatsapp;
drop policy if exists booking_admin_insert on public.reservas_whatsapp;
drop policy if exists booking_admin_update on public.reservas_whatsapp;
drop policy if exists booking_admin_delete on public.reservas_whatsapp;
drop policy if exists booking_read_guard on public.reservas_whatsapp;
drop policy if exists booking_insert_guard on public.reservas_whatsapp;
drop policy if exists booking_authenticated_insert_guard on public.reservas_whatsapp;
drop policy if exists booking_update_guard on public.reservas_whatsapp;
drop policy if exists booking_delete_guard on public.reservas_whatsapp;
create policy anon_insert_published_reservation on public.reservas_whatsapp for INSERT to anon with check (((origen = 'web'::text) AND (estado = 'pendiente'::text) AND (pago_estado = 'pendiente'::text) AND (EXISTS ( SELECT 1
   FROM experiencias e
  WHERE ((e.id = reservas_whatsapp.experiencia_id) AND (e.publicado = true))))));
create policy booking_admin_delete on public.reservas_whatsapp for DELETE to authenticated using (((auth.jwt() ->> 'email'::text) = 'info@viajessonoros.es'::text));
create policy booking_admin_insert on public.reservas_whatsapp for INSERT to authenticated with check (((auth.jwt() ->> 'email'::text) = 'info@viajessonoros.es'::text));
create policy booking_admin_select on public.reservas_whatsapp for SELECT to authenticated using (((auth.jwt() ->> 'email'::text) = 'info@viajessonoros.es'::text));
create policy booking_admin_update on public.reservas_whatsapp for UPDATE to authenticated using (((auth.jwt() ->> 'email'::text) = 'info@viajessonoros.es'::text)) with check (((auth.jwt() ->> 'email'::text) = 'info@viajessonoros.es'::text));
revoke all on public.reservas_whatsapp from public,anon,authenticated;
revoke insert(experiencia_id,nombre,telefono,plazas,precio_unitario,importe_total) on public.reservas_whatsapp from anon;
grant select,insert,update,delete on public.reservas_whatsapp to authenticated;
drop trigger if exists experiencias_guard_aforo on public.experiencias;
drop trigger if exists reservas_cancelar_pago on public.reservas_whatsapp;
drop trigger if exists reservas_guard_aforo on public.reservas_whatsapp;
drop trigger if exists vs_guard_booking_capacity on public.reservas_whatsapp;
drop trigger if exists vs_historial_reserva on public.reservas_whatsapp;
CREATE OR REPLACE FUNCTION public.guard_experience_capacity_v2()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare occupied integer;
begin
 if new.aforo_maximo is not null then
  select coalesce(sum(plazas),0)::integer into occupied from public.reservas_whatsapp where experiencia_id=new.id and estado='confirmada';
  if occupied>new.aforo_maximo then raise exception 'AFORO_INFERIOR_A_CONFIRMADAS'; end if;
 end if;
 return new;
end $function$
;CREATE TRIGGER experiencias_guard_aforo BEFORE UPDATE OF aforo_maximo ON public.experiencias FOR EACH ROW EXECUTE FUNCTION guard_experience_capacity_v2();
CREATE OR REPLACE FUNCTION public.cancelar_pago_reserva()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
 if new.estado = 'cancelada' then new.pago_estado := 'cancelado'; end if;
 if old.estado = 'cancelada' and new.estado <> 'cancelada' and new.pago_estado='cancelado' then new.pago_estado:='pendiente'; end if;
 return new;
end $function$
;CREATE TRIGGER reservas_cancelar_pago BEFORE UPDATE ON public.reservas_whatsapp FOR EACH ROW EXECUTE FUNCTION cancelar_pago_reserva();
CREATE OR REPLACE FUNCTION public.guard_reservation_capacity_v2()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare limit_value integer; occupied integer;
begin
 if new.estado='confirmada' then
  select aforo_maximo into limit_value from public.experiencias where id=new.experiencia_id for update;
  if limit_value is not null then
   select coalesce(sum(plazas),0)::integer into occupied from public.reservas_whatsapp where experiencia_id=new.experiencia_id and estado='confirmada' and id<>new.id;
   if occupied+new.plazas>limit_value then raise exception 'AFORO_COMPLETO'; end if;
  end if;
 end if;
 return new;
end $function$
;CREATE TRIGGER reservas_guard_aforo BEFORE INSERT OR UPDATE OF estado, plazas, experiencia_id ON public.reservas_whatsapp FOR EACH ROW EXECUTE FUNCTION guard_reservation_capacity_v2();
CREATE OR REPLACE FUNCTION vs_internal.guard_booking_capacity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_capacity integer; v_taken bigint;
BEGIN
 IF TG_OP='UPDATE' AND NEW.experiencia_id IS DISTINCT FROM OLD.experiencia_id THEN
  RAISE EXCEPTION 'No se permite cambiar la experiencia de una reserva' USING ERRCODE='23514';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(NEW.experiencia_id);
 SELECT e.aforo_maximo INTO v_capacity FROM public.experiencias e WHERE e.id=NEW.experiencia_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Experiencia inexistente' USING ERRCODE='23503'; END IF;
 IF NEW.estado IN ('cancelada','aplazada') OR v_capacity IS NULL THEN RETURN NEW; END IF;
 SELECT coalesce(sum(r.plazas),0) INTO v_taken FROM public.reservas_whatsapp r
 WHERE r.experiencia_id=NEW.experiencia_id
 AND r.estado NOT IN ('cancelada','aplazada')
 AND (TG_OP='INSERT' OR r.id<>NEW.id);
 IF v_taken+NEW.plazas>v_capacity THEN
  RAISE EXCEPTION 'No quedan suficientes plazas disponibles' USING ERRCODE='P0001';
 END IF;
 RETURN NEW;
END $function$
;CREATE TRIGGER vs_guard_booking_capacity BEFORE INSERT OR UPDATE OF plazas, estado, experiencia_id ON public.reservas_whatsapp FOR EACH ROW EXECUTE FUNCTION vs_internal.guard_booking_capacity();
CREATE OR REPLACE FUNCTION public.vs_registrar_historial_reserva()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if (old.estado,old.pago_estado,old.plazas,old.importe_total,old.experiencia_id)
 is distinct from (new.estado,new.pago_estado,new.plazas,new.importe_total,new.experiencia_id) then
 insert into public.vs_reservas_historial
 (reserva_id,actor,estado_antes,estado_despues,pago_antes,pago_despues,
  plazas_antes,plazas_despues,importe_antes,importe_despues,experiencia_antes,experiencia_despues)
 values(new.id,(select auth.uid()),old.estado,new.estado,old.pago_estado,new.pago_estado,
 old.plazas,new.plazas,old.importe_total,new.importe_total,old.experiencia_id,new.experiencia_id);
 end if;
 return new;
end $function$
;CREATE TRIGGER vs_historial_reserva AFTER UPDATE OF estado, pago_estado, plazas, importe_total, experiencia_id ON public.reservas_whatsapp FOR EACH ROW EXECUTE FUNCTION vs_registrar_historial_reserva();
drop function vs_internal.guard_experience_capacity();
commit;