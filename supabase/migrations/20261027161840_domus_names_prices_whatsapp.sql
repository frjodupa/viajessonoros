-- Review only: apply after the independent Domus migration, never automatically.
begin;
alter table public.domus_reservas
 add column paquete text,
 add column precio_unitario numeric(10,2),
 add column importe_total numeric(12,2),
 add constraint domus_importe_oficial check (
  (paquete is null and precio_unitario is null and importe_total is null)
  or (paquete is not null and precio_unitario is not null and importe_total is not null
   and paquete in ('clase_suelta','bono4','bono8')
   and precio_unitario=case paquete when 'clase_suelta' then 30 when 'bono4' then 100 when 'bono8' then 180 end
   and importe_total=precio_unitario*numero_participantes
   and (modalidad not in ('clase_suelta','bono4','bono8') or modalidad=paquete))
 );
-- Legacy rows remain explicitly unpriced; do not invent historical charges.
create function domus_private.exigir_precio() returns trigger
language plpgsql set search_path='' as $$ begin
 if new.paquete is null then
  if tg_op='INSERT' then raise exception 'Selecciona un paquete para registrar la reserva' using errcode='23514'; end if;
  if old.paquete is not null then raise exception 'No se puede eliminar el importe de una reserva' using errcode='23514'; end if;
 end if;
 return new;
end $$;
revoke all on function domus_private.exigir_precio() from public,anon,authenticated;
create trigger domus_reserva_precio before insert or update on public.domus_reservas
 for each row execute function domus_private.exigir_precio();

create or replace function domus_private.registrar(p_solicitud jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare k uuid; rid uuid; h text; existente public.domus_reservas%rowtype;
 edades jsonb; nombres jsonb; n integer; limite integer; i integer; edad_val integer;
 tel text; normal jsonb; nombres_limpios jsonb:='[]'::jsonb; nombre_persona text;
 paquete_val text; unitario numeric; total numeric; modalidad_val text;
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
  if jsonb_typeof(edades->i)<>'number' or (edades->>i)!~'^[0-9]{1,3}$' then raise exception 'Introduce edades enteras válidas' using errcode='22023'; end if;
  edad_val:=(edades->>i)::integer;
  if edad_val not between 0 and 120 then raise exception 'Edad no válida' using errcode='22023'; end if;
  nombre_persona:=trim(nombres->>i);
  if jsonb_typeof(nombres->i)<>'string' or coalesce(length(nombre_persona),0) not between 1 and 100 then
   raise exception 'Indica el nombre real de cada participante' using errcode='22023';
  end if;
  nombres_limpios:=nombres_limpios||jsonb_build_array(nombre_persona);
 end loop;
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
 h:=md5(normal::text);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(k::text,0));
 select * into existente from public.domus_reservas where clave_solicitud=k;
 if found then
  if existente.huella<>h then raise exception 'Esta solicitud ya se registró con otros datos' using errcode='23505'; end if;
  return existente.id;
 end if;
 insert into public.domus_reservas(clave_solicitud,huella,nombre,telefono,numero_participantes,modalidad,paquete,precio_unitario,importe_total,preferencias,observaciones,responsable_adulto)
 values(k,h,normal->>'nombre',tel,n,modalidad_val,paquete_val,unitario,total,normal->>'preferencias',normal->>'observaciones',(normal->>'responsable_adulto')::boolean) returning id into rid;
 for i in 0..n-1 loop
  insert into public.domus_participantes(reserva_id,orden,nombre,edad) values(rid,i+1,nombres_limpios->>i,(edades->>i)::integer);
 end loop;
 return rid;
end $$;
-- CREATE OR REPLACE preserves the original explicit grants; keep them explicit.
revoke all on function domus_private.registrar(jsonb) from public;
grant execute on function domus_private.registrar(jsonb) to anon,authenticated;
commit;
