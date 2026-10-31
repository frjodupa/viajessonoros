-- PROPUESTA SIN EJECUTAR: solo Supabase de pruebas autorizado.
-- Depende de 20261031095210_minimum_admin_experiencias.sql. No modifica filas de negocio.
begin;
set local search_path = pg_catalog;
do $vs_migration$
declare
 old_guard constant text := $vs_guard$if v_actor is null or not exists(select 1 from auth.users where id=v_actor and lower(email)='info@viajessonoros.es') then$vs_guard$;
 candidate text;
 target oid;
 item record;
begin
 if current_user <> 'postgres' then raise exception 'Requiere propietario postgres revisado';end if;
 if pg_catalog.to_regprocedure('vs_security.is_admin()') is null then
  raise exception 'Falta migracion administrativa previa';
 end if;
 for item in select * from (values
 ('public.vs_admin_alquiler_consultar()', $vs_snapshot$CREATE OR REPLACE FUNCTION public.vs_admin_alquiler_consultar()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid := (select auth.uid());
begin
 if v_actor is null or not exists(select 1 from auth.users where id=v_actor and lower(email)='info@viajessonoros.es') then
  raise exception 'Acceso administrativo restringido' using errcode='42501';
 end if;
 return coalesce((select jsonb_agg(jsonb_build_object('experiencia_id',experiencia_id,'importe_pagado',importe_pagado,'pagado',pagado,'actualizado_en',actualizado_en)) from public.vs_alquiler_sala_pagos),'[]'::jsonb);
end $function$
$vs_snapshot$),
 ('public.vs_admin_alquiler_guardar(bigint,numeric,boolean)', $vs_snapshot$CREATE OR REPLACE FUNCTION public.vs_admin_alquiler_guardar(p_experiencia_id bigint, p_importe numeric, p_pagado boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid := (select auth.uid());
begin
 if v_actor is null or not exists(select 1 from auth.users where id=v_actor and lower(email)='info@viajessonoros.es') then
  raise exception 'Acceso administrativo restringido' using errcode='42501';
 end if;
 if not exists(select 1 from public.experiencias where id=p_experiencia_id) then raise exception 'Experiencia inexistente';end if;
 if p_importe is null or p_importe<0 or p_pagado is null then raise exception 'Datos de alquiler no validos';end if;
 insert into public.vs_alquiler_sala_pagos(experiencia_id,importe_pagado,pagado,actualizado_por)
 values(p_experiencia_id,p_importe,p_pagado,v_actor)
 on conflict (experiencia_id) do update set importe_pagado=excluded.importe_pagado,pagado=excluded.pagado,actualizado_por=excluded.actualizado_por,actualizado_en=now();
 return jsonb_build_object('ok',true);
end $function$
$vs_snapshot$),
 ('public.vs_admin_historial(bigint)', $vs_snapshot$CREATE OR REPLACE FUNCTION public.vs_admin_historial(p_experiencia_id bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid;
begin
 v_actor:=(select auth.uid());
 if v_actor is null or not exists(select 1 from auth.users where id=v_actor and lower(email)='info@viajessonoros.es') then
  raise exception 'Acceso administrativo restringido' using errcode='42501';
 end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
  'reserva_id',h.reserva_id,'creado_en',h.creado_en,
  'estado_antes',h.estado_antes,'estado_despues',h.estado_despues,
  'pago_antes',h.pago_antes,'pago_despues',h.pago_despues,
  'plazas_antes',h.plazas_antes,'plazas_despues',h.plazas_despues,
  'importe_antes',h.importe_antes,'importe_despues',h.importe_despues))
 from public.vs_reservas_historial h
 join public.reservas_whatsapp r on r.id=h.reserva_id
 where p_experiencia_id is null or r.experiencia_id=p_experiencia_id),'[]'::jsonb);
end $function$
$vs_snapshot$),
 ('public.vs_admin_panel_datos(bigint)', $vs_snapshot$CREATE OR REPLACE FUNCTION public.vs_admin_panel_datos(p_experiencia_id bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid;
begin
 v_actor:=(select auth.uid());
 if v_actor is null or not exists(select 1 from auth.users where id=v_actor and lower(email)='info@viajessonoros.es') then
  raise exception 'Acceso administrativo restringido' using errcode='42501';
 end if;
 return jsonb_build_object(
  'asistencia',coalesce((select jsonb_agg(jsonb_build_object('reserva_id',a.reserva_id,'plazas_presentes',a.plazas_presentes))
   from public.vs_asistencia_real a join public.reservas_whatsapp r on r.id=a.reserva_id
   where p_experiencia_id is null or r.experiencia_id=p_experiencia_id),'[]'::jsonb),
  'gastos',coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'experiencia_id',g.experiencia_id,'concepto',g.concepto,'importe',g.importe))
   from public.vs_gastos_experiencia g where p_experiencia_id is null or g.experiencia_id=p_experiencia_id),'[]'::jsonb),
  'espera',coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'experiencia_id',w.experiencia_id,'nombre',w.nombre,'telefono',w.telefono,'plazas',w.plazas,'estado',w.estado))
   from public.vs_lista_espera w where p_experiencia_id is null or w.experiencia_id=p_experiencia_id),'[]'::jsonb)
 );
end $function$
$vs_snapshot$),
 ('public.vs_admin_panel_operar(text,jsonb)', $vs_snapshot$CREATE OR REPLACE FUNCTION public.vs_admin_panel_operar(p_operacion text, p_datos jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid; v_reserva public.reservas_whatsapp%rowtype; v_id uuid; v_plazas int; v_event bigint;
begin
 v_actor:=(select auth.uid());
 if v_actor is null or not exists(select 1 from auth.users where id=v_actor and lower(email)='info@viajessonoros.es') then
  raise exception 'Acceso administrativo restringido' using errcode='42501';
 end if;
 if p_operacion='asistencia' then
  select * into v_reserva from public.reservas_whatsapp where id=(p_datos->>'reserva_id')::uuid for update;
  if not found or v_reserva.estado <> 'confirmada' or v_reserva.pago_estado <> 'recibido' then raise exception 'Reserva no confirmada y pagada';end if;
  v_plazas:=(p_datos->>'plazas_presentes')::integer;
  if v_plazas is null or v_plazas<0 or v_plazas>v_reserva.plazas then raise exception 'La asistencia supera las plazas reservadas';end if;
  insert into public.vs_asistencia_real(reserva_id,plazas_presentes,registrado_por) values(v_reserva.id,v_plazas,v_actor)
   on conflict(reserva_id) do update set plazas_presentes=excluded.plazas_presentes,registrado_por=excluded.registrado_por,actualizado_en=now();
  return jsonb_build_object('ok',true,'plazas_presentes',v_plazas);
 elsif p_operacion='gasto' then
  v_event:=(p_datos->>'experiencia_id')::bigint;
  if not exists(select 1 from public.experiencias where id=v_event) then raise exception 'Experiencia inexistente';end if;
  if length(trim(coalesce(p_datos->>'concepto',''))) not between 2 and 120 then raise exception 'Concepto inválido';end if;
  if (p_datos->>'importe')::numeric < 0 or (p_datos->>'importe')::numeric is null then raise exception 'Importe inválido';end if;
  insert into public.vs_gastos_experiencia(experiencia_id,concepto,importe,creado_por)
  values(v_event,trim(p_datos->>'concepto'),(p_datos->>'importe')::numeric,v_actor) returning id into v_id;
  return jsonb_build_object('ok',true,'id',v_id);
 elsif p_operacion='espera' then
  v_event:=(p_datos->>'experiencia_id')::bigint;
  if not exists(select 1 from public.experiencias where id=v_event) then raise exception 'Experiencia inexistente';end if;
  if length(trim(coalesce(p_datos->>'nombre',''))) not between 2 and 100 then raise exception 'Nombre inválido';end if;
  if coalesce(p_datos->>'telefono','') !~ '^[+]?[0-9]{9,15}$' then raise exception 'Teléfono inválido';end if;
  v_plazas:=(p_datos->>'plazas')::integer;
  if v_plazas not between 1 and 10 then raise exception 'Plazas inválidas';end if;
  insert into public.vs_lista_espera(experiencia_id,nombre,telefono,plazas) values(v_event,trim(p_datos->>'nombre'),p_datos->>'telefono',v_plazas) returning id into v_id;
  return jsonb_build_object('ok',true,'id',v_id);
 else raise exception 'Operación desconocida';
 end if;
end $function$
$vs_snapshot$)
 ) as reviewed(signature, expected_definition) loop
  target := pg_catalog.to_regprocedure(item.signature);
  if target is null then raise exception 'RPC inexistente: %',item.signature;end if;
  if not exists(select 1 from pg_catalog.pg_proc p where p.oid=target
   and p.prosecdef and pg_catalog.pg_get_userbyid(p.proowner)='postgres') then
   raise exception 'Propietario o SECURITY DEFINER no revisados: %',item.signature;
  end if;
  candidate := pg_catalog.pg_get_functiondef(target);
  if candidate is distinct from item.expected_definition then
   raise exception 'Definicion distinta del inventario revisado: %',item.signature;
  end if;
  if pg_catalog.length(candidate)-pg_catalog.length(pg_catalog.replace(candidate,old_guard,'')) <> pg_catalog.length(old_guard) then
   raise exception 'Guardia administrativa inesperada: %',item.signature;
  end if;
  execute pg_catalog.replace(candidate,old_guard,'if v_actor is null or not vs_security.is_admin() then');
  -- CREATE OR REPLACE conserva propietario y ACL existentes; cerrar PUBLIC/anon explicitamente.
  execute pg_catalog.format('revoke all on function %s from public, anon',target::regprocedure);
  execute pg_catalog.format('grant execute on function %s to authenticated',target::regprocedure);
 end loop;
end $vs_migration$;
commit;
