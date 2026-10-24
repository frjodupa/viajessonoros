-- GITOP / Viajes Sonoros - diagnóstico exclusivamente de lectura
-- No contiene nombres, teléfonos ni identificadores de clientes.
SELECT
 (SELECT count(*) FROM public.reservas_whatsapp) AS reservas_total,
 (SELECT count(*) FROM public.reservas_whatsapp WHERE estado='confirmada' AND pago_estado<>'recibido') AS confirmadas_sin_pago_registrado,
 (SELECT count(*) FROM public.reservas_whatsapp WHERE estado='confirmada' AND pago_estado='recibido') AS confirmadas_con_aportacion_registrada,
 (SELECT count(*) FROM public.reservas_whatsapp WHERE estado='pendiente') AS pendientes,
 (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='reservas_aplazamientos') AS ledger_aplazamientos_existe,
 (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='reservas_premium_movimientos') AS ledger_movimientos_existe;
SELECT conname,pg_get_constraintdef(oid) AS regla
 FROM pg_catalog.pg_constraint
 WHERE conrelid='public.reservas_whatsapp'::regclass
 AND conname IN ('reservas_whatsapp_estado_check','reservas_whatsapp_pago_estado_check');
SELECT t.tgname,t.tgenabled,p.proname,n.nspname
 FROM pg_catalog.pg_trigger t
 JOIN pg_catalog.pg_proc p ON t.tgfoid=p.oid
 JOIN pg_catalog.pg_namespace n ON p.pronamespace=n.oid
 WHERE t.tgrelid='public.reservas_whatsapp'::regclass AND NOT t.tgisinternal;
