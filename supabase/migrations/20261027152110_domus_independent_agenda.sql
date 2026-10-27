-- DOMUS ONLY. Review and approve before applying to production.
-- No reads, writes or foreign keys to experiencias/reservas_whatsapp.
begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
create schema domus_private;
revoke all on schema domus_private from public;
grant usage on schema domus_private to anon, authenticated;

create function domus_private.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.users where id=(select auth.uid())
   and lower(email)='info@viajessonoros.es' and email_confirmed_at is not null);
$$;
revoke all on function domus_private.es_admin() from public, anon;
grant execute on function domus_private.es_admin() to authenticated;

create table public.domus_config (
 id boolean primary key default true check(id),
 lugar text not null default 'Escuela de Artes Escénicas Maltravieso · Calle San José, 18 — Cáceres',
 profesor text not null default 'José Duque',
 edad_adultos integer not null default 18 check(edad_adultos between 1 and 120),
 max_participantes integer not null default 30 check(max_participantes between 1 and 100)
);
insert into public.domus_config(id) values(true);
create table public.domus_salas (
 id uuid primary key default gen_random_uuid(), nombre text not null check(length(trim(nombre)) between 2 and 120),
 direccion text not null default 'Escuela de Artes Escénicas Maltravieso · Calle San José, 18 — Cáceres',
 activa boolean not null default true
);
create unique index domus_salas_nombre on public.domus_salas(lower(trim(nombre)));
insert into public.domus_salas(nombre) values ('Maltravieso · sala por confirmar');
create table public.domus_reservas (
 id uuid primary key default gen_random_uuid(), clave_solicitud uuid not null unique,
 huella text not null, nombre text not null check(length(trim(nombre)) between 2 and 100),
 telefono text not null check(telefono ~ '^[+]?[0-9]{9,15}$'),
 numero_participantes integer not null check(numero_participantes between 1 and 100),
 modalidad text not null check(modalidad in ('clase_suelta','bono4','bono8','infantil','taller')),
 preferencias text not null default '' check(length(preferencias)<=1000),
 observaciones text not null default '' check(length(observaciones)<=2000),
 responsable_adulto boolean not null default false,
 estado text not null default 'pendiente' check(estado in ('pendiente','confirmada','aplazada','cancelada')),
 creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now()
);
create table public.domus_participantes (
 id uuid primary key default gen_random_uuid(), reserva_id uuid not null references public.domus_reservas(id) on delete restrict,
 orden integer not null check(orden between 1 and 100),
 nombre text not null check(length(trim(nombre)) between 1 and 100),
 edad integer not null check(edad between 0 and 120), unique(reserva_id,orden)
);
create table public.domus_grupos (
 id uuid primary key default gen_random_uuid(), nombre text not null check(length(trim(nombre)) between 2 and 100),
 tipo text not null check(tipo in ('ninos','adultos','mixto')),
 modalidad text not null check(modalidad in ('taller','bono','clase_suelta')),
 estado text not null default 'en_formacion' check(estado in ('en_formacion','confirmado','activo','finalizado','cancelado')),
 fecha_inicio date, horarios text not null default '' check(length(horarios)<=1000),
 sala_id uuid references public.domus_salas(id) on delete restrict,
 profesor text not null default 'José Duque' check(length(trim(profesor)) between 2 and 100),
 edad_min integer check(edad_min between 0 and 120), edad_max integer check(edad_max between 0 and 120),
 observaciones text not null default '' check(length(observaciones)<=2000),
 creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now(),
 check(edad_min is null or edad_max is null or edad_max>=edad_min)
);
create unique index domus_grupos_nombre on public.domus_grupos(lower(trim(nombre)));
create table public.domus_grupos_participantes (
 grupo_id uuid not null references public.domus_grupos(id) on delete restrict,
 participante_id uuid not null references public.domus_participantes(id) on delete restrict,
 activo boolean not null default true, actualizado_en timestamptz not null default now(),
 primary key(grupo_id,participante_id)
);
create index domus_miembros_persona on public.domus_grupos_participantes(participante_id);
create table public.domus_clases (
 id uuid primary key default gen_random_uuid(), grupo_id uuid references public.domus_grupos(id) on delete restrict,
 sala_id uuid not null references public.domus_salas(id) on delete restrict,
 inicio timestamptz not null, fin timestamptz not null,
 estado text not null default 'pendiente' check(estado in ('pendiente','confirmada','ocupada','cancelada')),
 primera boolean not null default false, publico boolean not null default false,
 nota_publica text not null default '' check(length(nota_publica)<=500),
 notas text not null default '' check(length(notas)<=2000),
 actualizado_en timestamptz not null default now(),
 check(fin>inicio and fin-inicio<=interval '24 hours'),
 check(estado in ('ocupada','cancelada') or grupo_id is not null),
 check(not publico or estado='confirmada'),
 constraint domus_sala_sin_solapamiento exclude using gist
 (sala_id extensions.gist_uuid_ops with =, tstzrange(inicio,fin,'[)') with &&)
 where (estado<>'cancelada'),
 constraint domus_grupo_sin_solapamiento exclude using gist
 (grupo_id extensions.gist_uuid_ops with =, tstzrange(inicio,fin,'[)') with &&)
 where (estado<>'cancelada' and grupo_id is not null)
);
create unique index domus_primera_clase on public.domus_clases(grupo_id) where primera and estado<>'cancelada';
create index domus_clases_inicio on public.domus_clases(inicio);

create function domus_private.actualizar_fecha() returns trigger
language plpgsql set search_path='' as $$ begin new.actualizado_en:=now(); return new; end $$;
create trigger domus_reservas_fecha before update on public.domus_reservas for each row execute function domus_private.actualizar_fecha();
create trigger domus_grupos_fecha before update on public.domus_grupos for each row execute function domus_private.actualizar_fecha();
create trigger domus_clases_fecha before update on public.domus_clases for each row execute function domus_private.actualizar_fecha();
create trigger domus_miembros_fecha before update on public.domus_grupos_participantes for each row execute function domus_private.actualizar_fecha();

-- Deferred validation keeps a reservation and all its ages atomic.
create function domus_private.validar_participantes() returns trigger
language plpgsql security definer set search_path='' as $$
declare rid uuid; r public.domus_reservas%rowtype; n integer; menores boolean;
begin
 if tg_table_name='domus_reservas' then rid:=new.id;
 elsif tg_op='DELETE' then rid:=old.reserva_id; else rid:=new.reserva_id; end if;
 select * into r from public.domus_reservas where id=rid;
 select count(*),coalesce(bool_or(edad<18),false) into n,menores from public.domus_participantes where reserva_id=rid;
 if n<>r.numero_participantes then raise exception 'Debe registrarse una edad por participante' using errcode='23514'; end if;
 if menores and not r.responsable_adulto then raise exception 'Los menores necesitan un contacto adulto responsable' using errcode='23514'; end if;
 return null;
end $$;
create constraint trigger domus_reserva_integridad after insert or update on public.domus_reservas
 deferrable initially deferred for each row execute function domus_private.validar_participantes();
create constraint trigger domus_edades_integridad after insert or update or delete on public.domus_participantes
 deferrable initially deferred for each row execute function domus_private.validar_participantes();
create function domus_private.proteger_reserva_original() returns trigger
language plpgsql set search_path='' as $$ begin
 if new.reserva_id<>old.reserva_id or new.orden<>old.orden or new.id<>old.id then
  raise exception 'La reserva original del participante no puede cambiar' using errcode='23514';
 end if; return new;
end $$;
create trigger domus_reserva_original before update on public.domus_participantes for each row execute function domus_private.proteger_reserva_original();
create function domus_private.cancelar_grupo() returns trigger
language plpgsql set search_path='' as $$ begin
 if new.estado='cancelado' and old.estado<>'cancelado' then
  update public.domus_clases set estado='cancelada',publico=false where grupo_id=new.id and estado<>'cancelada';
 end if; return new;
end $$;
create trigger domus_grupo_cancelacion after update of estado on public.domus_grupos for each row execute function domus_private.cancelar_grupo();

do $$ declare t text; begin
 foreach t in array array['domus_config','domus_salas','domus_reservas','domus_participantes','domus_grupos','domus_grupos_participantes','domus_clases'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated',t);
  execute format('grant select, insert, update on public.%I to authenticated',t);
  execute format('create policy domus_admin on public.%I for all to authenticated using ((select domus_private.es_admin())) with check ((select domus_private.es_admin()))',t);
 end loop;
end $$;

-- Explicit anonymous capability: validated INSERT only, fixed pending status,
-- no table grants, no client-provided price/status/group and no personal-data read.
create function domus_private.registrar(p_solicitud jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare k uuid; rid uuid; h text; existente public.domus_reservas%rowtype; edades jsonb;
 n integer; limite integer; i integer:=0; edad_val integer; tel text; normal jsonb;
begin
 k:=(p_solicitud->>'clave')::uuid;
 edades:=p_solicitud->'edades';
 if k is null or jsonb_typeof(edades) is distinct from 'array' then raise exception 'Solicitud incompleta' using errcode='22023'; end if;
 n:=jsonb_array_length(edades);
 select max_participantes into limite from public.domus_config where id;
 if n<1 or n>limite then raise exception 'Revisa el número de participantes' using errcode='22023'; end if;
 tel:=regexp_replace(trim(p_solicitud->>'telefono'),'[[:space:]().-]','','g');
 if tel like '00%' then tel:='+'||substr(tel,3); end if;
 normal:=jsonb_build_object('nombre',trim(p_solicitud->>'nombre'),'telefono',tel,'edades',edades,
 'modalidad',p_solicitud->>'modalidad','preferencias',coalesce(trim(p_solicitud->>'preferencias'),''),
 'observaciones',coalesce(trim(p_solicitud->>'observaciones'),''),'responsable_adulto',coalesce((p_solicitud->>'responsable_adulto')::boolean,false));
 h:=md5(normal::text);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(k::text,0));
 select * into existente from public.domus_reservas where clave_solicitud=k;
 if found then
  if existente.huella<>h then raise exception 'Esta solicitud ya se registró con otros datos' using errcode='23505'; end if;
  return existente.id;
 end if;
 insert into public.domus_reservas(clave_solicitud,huella,nombre,telefono,numero_participantes,modalidad,preferencias,observaciones,responsable_adulto)
 values(k,h,normal->>'nombre',tel,n,normal->>'modalidad',normal->>'preferencias',normal->>'observaciones',(normal->>'responsable_adulto')::boolean) returning id into rid;
 for i in 0..n-1 loop
  if jsonb_typeof(edades->i)<>'number' or (edades->>i)!~'^[0-9]{1,3}$' then raise exception 'Introduce edades enteras válidas' using errcode='22023'; end if;
  edad_val:=(edades->>i)::integer;
  insert into public.domus_participantes(reserva_id,orden,nombre,edad) values(rid,i+1,'Participante '||(i+1),edad_val);
 end loop;
 return rid;
end $$;
revoke all on function domus_private.registrar(jsonb) from public;
grant execute on function domus_private.registrar(jsonb) to anon,authenticated;
create function public.domus_registrar(p_solicitud jsonb) returns uuid
language sql security invoker set search_path='' as $$ select domus_private.registrar(p_solicitud) $$;
revoke all on function public.domus_registrar(jsonb) from public;
grant execute on function public.domus_registrar(jsonb) to anon,authenticated;

create function domus_private.calendario(p_desde date,p_hasta date) returns jsonb
language plpgsql stable security definer set search_path='' as $$ begin
 if p_desde is null or p_hasta is null or p_hasta<p_desde or p_hasta-p_desde>400 then raise exception 'Intervalo inválido' using errcode='22023'; end if;
 return jsonb_build_object('config',(select jsonb_build_object('lugar',lugar,'profesor',profesor,'edad_adultos',edad_adultos,'max_participantes',max_participantes) from public.domus_config where id),
 'clases',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'inicio',c.inicio,'fin',c.fin,'primera',c.primera,
 'lugar',s.direccion,'sala',s.nombre,'profesor',g.profesor,'nota_publica',c.nota_publica) order by c.inicio)
 from public.domus_clases c join public.domus_grupos g on g.id=c.grupo_id join public.domus_salas s on s.id=c.sala_id
 where c.publico and c.estado='confirmada' and g.estado in ('confirmado','activo') and s.activa
 and c.inicio>=p_desde::timestamp at time zone 'Europe/Madrid' and c.inicio<(p_hasta+1)::timestamp at time zone 'Europe/Madrid'),'[]'::jsonb));
end $$;
revoke all on function domus_private.calendario(date,date) from public;
grant execute on function domus_private.calendario(date,date) to anon,authenticated;
create function public.domus_calendario(p_desde date,p_hasta date) returns jsonb
language sql security invoker set search_path='' as $$ select domus_private.calendario(p_desde,p_hasta) $$;
revoke all on function public.domus_calendario(date,date) from public;
grant execute on function public.domus_calendario(date,date) to anon,authenticated;

create function public.domus_admin_datos() returns jsonb
language plpgsql security invoker set search_path='' as $$ begin
 if not domus_private.es_admin() then raise exception 'Acceso administrativo restringido' using errcode='42501'; end if;
 return jsonb_build_object('config',(select to_jsonb(c) from public.domus_config c where id),
 'salas',coalesce((select jsonb_agg(s order by s.nombre) from public.domus_salas s),'[]'::jsonb),
 'reservas',coalesce((select jsonb_agg(to_jsonb(r)-'huella'-'clave_solicitud' order by r.creado_en desc) from public.domus_reservas r),'[]'::jsonb),
 'participantes',coalesce((select jsonb_agg(p order by p.reserva_id,p.orden) from public.domus_participantes p),'[]'::jsonb),
 'grupos',coalesce((select jsonb_agg(g order by g.creado_en desc) from public.domus_grupos g),'[]'::jsonb),
 'miembros',coalesce((select jsonb_agg(m) from public.domus_grupos_participantes m),'[]'::jsonb),
 'clases',coalesce((select jsonb_agg(c order by c.inicio) from public.domus_clases c),'[]'::jsonb));
end $$;
revoke all on function public.domus_admin_datos() from public, anon;
grant execute on function public.domus_admin_datos() to authenticated;

create function public.domus_mover_participante(p_participante uuid,p_desde uuid,p_hacia uuid) returns void
language plpgsql security invoker set search_path='' as $$ begin
 if not domus_private.es_admin() then raise exception 'Acceso administrativo restringido' using errcode='42501'; end if;
 perform 1 from public.domus_participantes p join public.domus_reservas r on r.id=p.reserva_id
 where p.id=p_participante and r.estado in ('pendiente','confirmada') for update of p;
 if not found then raise exception 'Participante no disponible'; end if;
 if not exists(select 1 from public.domus_grupos where id=p_hacia and estado not in ('cancelado','finalizado')) then raise exception 'Elige un grupo disponible'; end if;
 insert into public.domus_grupos_participantes(grupo_id,participante_id) values(p_hacia,p_participante)
 on conflict(grupo_id,participante_id) do update set activo=true;
 if p_desde is not null and p_desde<>p_hacia then update public.domus_grupos_participantes set activo=false where grupo_id=p_desde and participante_id=p_participante; end if;
end $$;
revoke all on function public.domus_mover_participante(uuid,uuid,uuid) from public,anon;
grant execute on function public.domus_mover_participante(uuid,uuid,uuid) to authenticated;

create function public.domus_guardar_clase(p_clase jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare cid uuid; previa public.domus_clases%rowtype; ini timestamptz; finv timestamptz; gid uuid;
begin
 if not domus_private.es_admin() then raise exception 'Acceso administrativo restringido' using errcode='42501'; end if;
 gid:=nullif(p_clase->>'grupo_id','')::uuid;
 if gid is not null and not exists(select 1 from public.domus_grupos where id=gid and estado not in ('cancelado','finalizado')) and p_clase->>'estado'<>'cancelada' then raise exception 'El grupo no está disponible'; end if;
 if not exists(select 1 from public.domus_salas where id=(p_clase->>'sala_id')::uuid and (activa or p_clase->>'estado'='cancelada')) then raise exception 'Selecciona una sala activa'; end if;
 ini:=((p_clase->>'fecha')::date+(p_clase->>'hora_inicio')::time) at time zone 'Europe/Madrid';
 finv:=((p_clase->>'fecha')::date+(p_clase->>'hora_fin')::time) at time zone 'Europe/Madrid';
 if (ini at time zone 'Europe/Madrid')::time<>(p_clase->>'hora_inicio')::time or (finv at time zone 'Europe/Madrid')::time<>(p_clase->>'hora_fin')::time then raise exception 'Hora inexistente por el cambio de horario'; end if;
 if ini is null or finv is null then raise exception 'Indica fecha y horario'; end if;
 cid:=nullif(p_clase->>'id','')::uuid;
 if cid is not null then
  select * into previa from public.domus_clases where id=cid for update;
  if not found then raise exception 'La clase ya no existe'; end if;
  if previa.actualizado_en is distinct from (p_clase->>'actualizado_en')::timestamptz then raise exception 'La clase cambió en otro dispositivo. Actualiza antes de editar'; end if;
  update public.domus_clases set grupo_id=gid,sala_id=(p_clase->>'sala_id')::uuid,inicio=ini,fin=finv,
   estado=p_clase->>'estado',primera=coalesce((p_clase->>'primera')::boolean,false),publico=coalesce((p_clase->>'publico')::boolean,false),
   nota_publica=coalesce(p_clase->>'nota_publica',''),notas=coalesce(p_clase->>'notas','') where id=cid;
 else
  insert into public.domus_clases(grupo_id,sala_id,inicio,fin,estado,primera,publico,nota_publica,notas)
  values(gid,(p_clase->>'sala_id')::uuid,ini,finv,p_clase->>'estado',coalesce((p_clase->>'primera')::boolean,false),coalesce((p_clase->>'publico')::boolean,false),coalesce(p_clase->>'nota_publica',''),coalesce(p_clase->>'notas','')) returning id into cid;
 end if;
 return cid;
end $$;
revoke all on function public.domus_guardar_clase(jsonb) from public,anon;
grant execute on function public.domus_guardar_clase(jsonb) to authenticated;

-- Trigger functions cannot be invoked as public endpoints.
revoke all on function domus_private.actualizar_fecha(),domus_private.validar_participantes(),domus_private.proteger_reserva_original(),domus_private.cancelar_grupo() from public,anon,authenticated;
commit;
