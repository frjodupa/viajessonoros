-- GITOP / Viajes Sonoros: BORRADOR. No ejecutar en producción.
-- Aplicar solo tras backup y validación en base aislada.
BEGIN;
ALTER TABLE public.reservas_whatsapp DROP CONSTRAINT reservas_whatsapp_estado_check;
ALTER TABLE public.reservas_whatsapp ADD CONSTRAINT reservas_whatsapp_estado_check
  CHECK (estado IN ('pendiente','confirmada','cancelada','aplazada'));
ALTER TABLE public.reservas_whatsapp ADD COLUMN IF NOT EXISTS aplazamiento_motivo text;
ALTER TABLE public.reservas_whatsapp ADD COLUMN IF NOT EXISTS aplazamiento_resolucion text;
ALTER TABLE public.reservas_whatsapp DROP CONSTRAINT IF EXISTS reservas_aplazamiento_resolucion_check;
ALTER TABLE public.reservas_whatsapp ADD CONSTRAINT reservas_aplazamiento_resolucion_check CHECK (aplazamiento_resolucion IS NULL OR aplazamiento_resolucion IN ('devolucion','siguiente_experiencia'));
CREATE OR REPLACE FUNCTION vs_internal.guard_booking_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_capacity integer; v_taken bigint;
BEGIN
 IF TG_OP='UPDATE' AND NEW.experiencia_id IS DISTINCT FROM OLD.experiencia_id THEN
  RAISE EXCEPTION 'No se permite cambiar la experiencia de una reserva' USING ERRCODE='23514';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(NEW.experiencia_id);
 SELECT aforo_maximo INTO v_capacity FROM public.experiencias WHERE id=NEW.experiencia_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Experiencia inexistente' USING ERRCODE='23503'; END IF;
 IF NEW.estado IN ('cancelada','aplazada') OR v_capacity IS NULL THEN RETURN NEW; END IF;
 SELECT coalesce(sum(plazas),0) INTO v_taken FROM public.reservas_whatsapp
 WHERE experiencia_id=NEW.experiencia_id
 AND estado NOT IN ('cancelada','aplazada')
 AND (TG_OP='INSERT' OR id<>NEW.id);
 IF v_taken+NEW.plazas>v_capacity THEN
  RAISE EXCEPTION 'No quedan suficientes plazas disponibles' USING ERRCODE='P0001';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION vs_internal.guard_booking_capacity() FROM PUBLIC,anon,authenticated;
COMMIT;
-- No activa aplazamiento: precisa tablas de saldo, RPC administrativa y auditoría.
