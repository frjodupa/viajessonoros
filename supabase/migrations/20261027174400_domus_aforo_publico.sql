begin;
alter table public.domus_grupos add column cupo_maximo integer check(cupo_maximo between 1 and 100);
-- No aforo inventado: NULL hasta confirmación de instrumentos.
alter table public.domus_reservas add column clase_elegida uuid references public.domus_clases(id) on delete restrict;
-- La función de registro conserva precios, validación de menores, idempotencia y permisos.
-- Capacidad en todas las vías de asignación, también las realizadas por el administrador.
create function domus_private.validar_aforo_miembro() returns trigger language plpgsql
security definer set search_path='' as $
declare capacidad integer; ocupacion integer;
begin
 if not new.activo or (tg_op='UPDATE' and old.activo) then return new; end if;
 select cupo_maximo into capacidad from public.domus_grupos where id=new.grupo_id for update;
 if capacidad is null then return new; end if;
 select count(*)::integer into ocupacion from public.domus_grupos_participantes m
 join public.domus_participantes p on p.id=m.participante_id
 join public.domus_reservas r on r.id=p.reserva_id
 where m.grupo_id=new.grupo_id and m.activo and r.estado in ('pendiente','confirmada');
 if ocupacion>=capacidad then raise exception 'Grupo completo: no es posible asignar más participantes.' using errcode='23514'; end if;
 return new;
end $;
revoke all on function domus_private.validar_aforo_miembro() from public,anon,authenticated;
create trigger domus_validar_aforo_miembro before insert or update of activo on public.domus_grupos_participantes
for each row execute function domus_private.validar_aforo_miembro();

create function domus_private.validar_cambio_aforo() returns trigger language plpgsql
security definer set search_path='' as $
declare ocupadas integer;
begin
 if new.cupo_maximo is null then return new; end if;
 select count(*)::integer into ocupadas from public.domus_grupos_participantes m
 join public.domus_participantes p on p.id=m.participante_id
 join public.domus_reservas r on r.id=p.reserva_id
 where m.grupo_id=new.id and m.activo and r.estado in ('pendiente','confirmada');
 if ocupadas>new.cupo_maximo then raise exception 'El aforo no puede ser menor que las plazas asignadas.' using errcode='23514'; end if;
 return new;
end $;
revoke all on function domus_private.validar_cambio_aforo() from public,anon,authenticated;
create trigger domus_validar_cambio_aforo before update of cupo_maximo on public.domus_grupos
for each row execute function domus_private.validar_cambio_aforo();

-- Las sesiones lectivas se programan en bloques de 90 minutos.
create function domus_private.validar_duracion_90() returns trigger language plpgsql
set search_path='' as $
begin
 if new.estado not in ('ocupada','cancelada') and new.fin-new.inicio<>interval '90 minutes' then
  raise exception 'Las clases de Talleres Domus deben durar 90 minutos.' using errcode='23514';
 end if;
 return new;
end $;
revoke all on function domus_private.validar_duracion_90() from public,anon,authenticated;
create trigger domus_validar_duracion_90 before insert or update on public.domus_clases
for each row execute function domus_private.validar_duracion_90();

create or replace function domus_private.registrar(p_solicitud jsonb) returns uuid
language plpgsql security definer set search_path='' as $
declare k uuid; rid uuid; h text; existente public.domus_reservas%rowtype;
 edades jsonb; nombres jsonb; n integer; limite integer; i integer; edad_val integer;
 tel text; normal jsonb; nombres_limpios jsonb:='[]'::jsonb; nombre_persona text;
 paquete_val text; unitario numeric; total numeric; modalidad_val text;
 clase_id_val uuid; grupo_id_val uuid; pid uuid; tipo_val text; aforo integer; ocupadas integer;
begin
 k:=(p_solicitud->>'clave')::uuid;
 edades:=p_solicitud->'edades'; nombres:=p_solicitud->'nombres';
 if k is null or jsonb_typeof(edades) is distinct from 'array' or jsonb_typeof(nombres) is distinct from 'array' then
  raise exception 'Indica el nombre y la edad de cada participante' using errcode='22023';
 end if;
 n:=jsonb_array_length(edades);
 select max_participantes into limite from public.domus_config where id;
 if n<1 or n>limite or jsonb_array_length(nombres)<>n then
  raise exception 'Debe haber un nombre y una edad por participante' using errcode='22023';
 end if;
 for i in 0..n-1 loop
  if jsonb_typeof(edades->i)<>'number' or (edades->>i)!~'^[0-9]{1,3}p_desde date,p_hasta date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if p_desde is null or p_hasta is null or p_hasta<p_desde or p_hasta-p_desde>400 then raise exception 'Intervalo inválido' using errcode='22023'; end if;
 return jsonb_build_object('config',(select jsonb_build_object('lugar',lugar,'profesor',profesor,'edad_adultos',edad_adultos,'max_participantes',max_participantes) from public.domus_config where id),
 'clases',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'inicio',c.inicio,'fin',c.fin,'primera',c.primera,
 'lugar',s.direccion,'sala',s.nombre,'profesor',g.profesor,'nota_publica',c.nota_publica,
 'grupo_tipo',case g.tipo when 'ninos' then 'Grupo infantil' when 'adultos' then 'Grupo adultos' else 'Grupo mixto' end,
 'tipo',g.tipo,'grupo_id',g.id,'cupo_maximo',g.cupo_maximo,'ocupadas',oc.total,
 'libres',case when g.cupo_maximo is null then null else greatest(0,g.cupo_maximo-oc.total) end)
 order by c.inicio)
 from public.domus_clases c join public.domus_grupos g on g.id=c.grupo_id
 join public.domus_salas s on s.id=c.sala_id
 cross join lateral (select count(*)::integer total from public.domus_grupos_participantes m
 join public.domus_participantes p on p.id=m.participante_id join public.domus_reservas r on r.id=p.reserva_id
 where m.grupo_id=g.id and m.activo and r.estado in ('pendiente','confirmada')) oc
 where c.publico and c.estado='confirmada' and g.estado in ('confirmado','activo') and s.activa
 and c.inicio>=p_desde::timestamp at time zone 'Europe/Madrid' and c.inicio<(p_hasta+1)::timestamp at time zone 'Europe/Madrid'),'[]'::jsonb));
end $$;
revoke all on function domus_private.calendario(date,date) from public;
grant execute on function domus_private.calendario(date,date) to anon,authenticated;
commit; then raise exception 'Introduce edades enteras válidas' using errcode='22023'; end if;
  edad_val:=(edades->>i)::integer;
  if edad_val not between 0 and 120 then raise exception 'Edad no válida' using errcode='22023'; end if;
  nombre_persona:=trim(nombres->>i);
  if jsonb_typeof(nombres->i)<>'string' or coalesce(length(nombre_persona),0) not between 1 and 100 then
   raise exception 'Indica el nombre real de cada participante' using errcode='22023';
  end if;
  nombres_limpios:=nombres_limpios||jsonb_build_array(nombre_persona);
 end loop;
 clase_id_val:=nullif(p_solicitud->>'clase_id','')::uuid;
 modalidad_val:=p_solicitud->>'modalidad'; paquete_val:=p_solicitud->>'paquete';
 unitario:=case paquete_val when 'clase_suelta' then 30 when 'bono4' then 100 when 'bono8' then 180 end;
 if unitario is null or (modalidad_val in ('clase_suelta','bono4','bono8') and modalidad_val<>paquete_val) then
  raise exception 'Selecciona un paquete oficial coherente con la modalidad' using errcode='22023';
 end if;
 total:=unitario*n;
 if (p_solicitud ? 'precio_unitario' and (p_solicitud->>'precio_unitario')::numeric is distinct from unitario)
 or (p_solicitud ? 'importe_total' and (p_solicitud->>'importe_total')::numeric is distinct from total) then
  raise exception 'El importe no coincide con el paquete y los participantes' using errcode='22023';
 end if;
 tel:=regexp_replace(trim(p_solicitud->>'telefono'),'[[:space:]().-]','','g');
 if tel like '00%' then tel:='+'||substr(tel,3); end if;
 normal:=jsonb_build_object('nombre',trim(p_solicitud->>'nombre'),'telefono',tel,'edades',edades,'nombres',nombres_limpios,
 'modalidad',modalidad_val,'paquete',paquete_val,'preferencias',coalesce(trim(p_solicitud->>'preferencias'),''),
 'observaciones',coalesce(trim(p_solicitud->>'observaciones'),''),'responsable_adulto',coalesce((p_solicitud->>'responsable_adulto')::boolean,false));
 if clase_id_val is not null then normal:=normal||jsonb_build_object('clase_id',clase_id_val); end if;
 h:=md5(normal::text);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(k::text,0));
 select * into existente from public.domus_reservas where clave_solicitud=k;
 if found then
  if existente.huella<>h then raise exception 'Esta solicitud ya se registró con otros datos' using errcode='23505'; end if;
  return existente.id;
 end if;

 -- Lock the group to serialize concurrent registrations for its last seat.
 if clase_id_val is not null then
   select c.grupo_id into grupo_id_val
   from public.domus_clases c
   join public.domus_grupos g on g.id=c.grupo_id
   join public.domus_salas s on s.id=c.sala_id
   where c.id=clase_id_val and c.publico and c.estado='confirmada'
    and g.estado in ('confirmado','activo') and s.activa
    and c.inicio>now() and c.fin-c.inicio=interval '90 minutes';
   if grupo_id_val is null then raise exception 'La clase seleccionada ya no admite reservas. Actualiza el calendario.' using errcode='22023'; end if;
   select g.cupo_maximo,g.tipo into aforo,tipo_val
   from public.domus_grupos g where g.id=grupo_id_val for update;
   if aforo is null then raise exception 'El aforo de esta clase no está confirmado todavía.' using errcode='22023'; end if;
   if (tipo_val='ninos' and exists(select 1 from jsonb_array_elements_text(edades) x where x::integer>=18))
      or (tipo_val='adultos' and exists(select 1 from jsonb_array_elements_text(edades) x where x::integer<18))
   then raise exception 'Elige un grupo adecuado a la edad de los participantes.' using errcode='22023'; end if;
   select count(*)::integer into ocupadas from public.domus_grupos_participantes m
    join public.domus_participantes p on p.id=m.participante_id
    join public.domus_reservas r on r.id=p.reserva_id
    where m.grupo_id=grupo_id_val and m.activo and r.estado in ('pendiente','confirmada');
   if ocupadas+n>aforo then raise exception 'No quedan plazas suficientes para esta clase. Actualiza el calendario.' using errcode='23514'; end if;
 end if;
 insert into public.domus_reservas(clave_solicitud,huella,nombre,telefono,numero_participantes,modalidad,paquete,precio_unitario,importe_total,preferencias,observaciones,responsable_adulto,clase_elegida)
 values(k,h,normal->>'nombre',tel,n,modalidad_val,paquete_val,unitario,total,normal->>'preferencias',normal->>'observaciones',(normal->>'responsable_adulto')::boolean,clase_id_val) returning id into rid;
 for i in 0..n-1 loop
  insert into public.domus_participantes(reserva_id,orden,nombre,edad) values(rid,i+1,nombres_limpios->>i,(edades->>i)::integer) returning id into pid;
  if clase_id_val is not null then
    insert into public.domus_grupos_participantes(grupo_id,participante_id) values(grupo_id_val,pid);
  end if;
 end loop;
 return rid;
end $;

revoke all on function domus_private.registrar(jsonb) from public;
grant execute on function domus_private.registrar(jsonb) to anon,authenticated;

create or replace function domus_private.calendario(p_desde date,p_hasta date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if p_desde is null or p_hasta is null or p_hasta<p_desde or p_hasta-p_desde>400 then raise exception 'Intervalo inválido' using errcode='22023'; end if;
 return jsonb_build_object('config',(select jsonb_build_object('lugar',lugar,'profesor',profesor,'edad_adultos',edad_adultos,'max_participantes',max_participantes) from public.domus_config where id),
 'clases',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'inicio',c.inicio,'fin',c.fin,'primera',c.primera,
 'lugar',s.direccion,'sala',s.nombre,'profesor',g.profesor,'nota_publica',c.nota_publica,
 'grupo_tipo',case g.tipo when 'ninos' then 'Grupo infantil' when 'adultos' then 'Grupo adultos' else 'Grupo mixto' end,
 'tipo',g.tipo,'grupo_id',g.id,'cupo_maximo',g.cupo_maximo,'ocupadas',oc.total,
 'libres',case when g.cupo_maximo is null then null else greatest(0,g.cupo_maximo-oc.total) end)
 order by c.inicio)
 from public.domus_clases c join public.domus_grupos g on g.id=c.grupo_id
 join public.domus_salas s on s.id=c.sala_id
 cross join lateral (select count(*)::integer total from public.domus_grupos_participantes m
 join public.domus_participantes p on p.id=m.participante_id join public.domus_reservas r on r.id=p.reserva_id
 where m.grupo_id=g.id and m.activo and r.estado in ('pendiente','confirmada')) oc
 where c.publico and c.estado='confirmada' and g.estado in ('confirmado','activo') and s.activa
 and c.inicio>=p_desde::timestamp at time zone 'Europe/Madrid' and c.inicio<(p_hasta+1)::timestamp at time zone 'Europe/Madrid'),'[]'::jsonb));
end $$;
revoke all on function domus_private.calendario(date,date) from public;
grant execute on function domus_private.calendario(date,date) to anon,authenticated;
commit;