-- Viajes Sonoros · PROPUESTA SEGURA, NO APLICADA A PRODUCCIÓN.
-- PREREQUISITOS: copia restaurable, test aislado, auditoría de privilegios y concurrencia.
-- Para no generar deuda o devoluciones implícitas, esta primera versión solo
-- acepta destino con aportación exactamente igual al crédito conservado.
begin;
create table if not exists public.vs_traslados_reservas (
  id uuid primary key default gen_random_uuid(),
  reserva_origen_id uuid not null unique references public.reservas_whatsapp(id) on delete restrict,
  reserva_destino_id uuid not null unique references public.reservas_whatsapp(id) on delete restrict,
  experiencia_origen_id bigint not null references public.experiencias(id),
  experiencia_destino_id bigint not null references public.experiencias(id),
  plazas integer not null check (plazas between 1 and 10),
  credito_aplicado numeric(10,2) not null check (credito_aplicado >= 0),
  aporte_adicional numeric(10,2) not null default 0 check (aporte_adicional = 0),
  actor uuid not null references auth.users(id),
  fecha timestamptz not null default now()
);
alter table public.vs_traslados_reservas enable row level security;
revoke all on table public.vs_traslados_reservas from public, anon, authenticated;
-- Lectura reservada al admin; escritura solo mediante RPC controlada.
create policy vs_traslados_admin_select on public.vs_traslados_reservas
 for select to authenticated using (
   (select auth.uid()) in
   (select id from auth.users where lower(email) = 'info@viajessonoros.es')
 );
grant select on public.vs_traslados_reservas to authenticated;

create or replace function public.vs_trasladar_reserva_aplazada(
 p_origen uuid, p_destino bigint
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
 v_actor uuid := (select auth.uid());
 v_origen public.reservas_whatsapp%rowtype;
 v_fecha_origen text;
 v_fecha_destino text;
 v_precio text;
 v_unitario numeric(10,2);
 v_importe numeric(10,2);
 v_max integer;
 v_ocupado integer;
 v_new_id uuid;
begin
 if v_actor is null or not exists (
   select 1 from auth.users where id=v_actor
   and lower(email)='info@viajessonoros.es'
 ) then raise exception 'Administrador no autorizado' using errcode='42501'; end if;

 -- Serializar todos los traslados del mismo origen; evita doble pulsación.
 select * into v_origen from public.reservas_whatsapp where id=p_origen for update;
 if not found then raise exception 'Reserva origen no encontrada' using errcode='P0002'; end if;
 if v_origen.estado <> 'aplazada' or v_origen.pago_estado <> 'recibido'
    or coalesce(v_origen.importe_total,0) <= 0
 then raise exception 'La reserva debe estar aplazada con crédito recibido' using errcode='23514'; end if;
 if exists(select 1 from public.vs_traslados_reservas where reserva_origen_id=p_origen)
 then raise exception 'Esta reserva ya fue trasladada' using errcode='23505'; end if;
 if v_origen.experiencia_id=p_destino then raise exception 'Destino igual al origen' using errcode='22023'; end if;
 select fecha into v_fecha_origen from public.experiencias where id=v_origen.experiencia_id;
 -- Bloqueo del evento destino para serializar aforo con funciones existentes.
 select fecha, precio, aforo_maximo into v_fecha_destino,v_precio,v_max
 from public.experiencias where id=p_destino for update;
 if not found then raise exception 'Evento de destino inexistente' using errcode='P0002'; end if;
 if v_fecha_destino !~ '^\\d{4}-\\d{2}-\\d{2}$'
    or v_fecha_destino::date <= current_date
    or v_fecha_origen !~ '^\\d{4}-\\d{2}-\\d{2}$'
    or v_fecha_destino::date <= v_fecha_origen::date
 then raise exception 'El destino debe ser un evento futuro posterior al original' using errcode='22023'; end if;
 if v_max is null then raise exception 'El destino necesita aforo definido' using errcode='22023'; end if;
 -- Prohibir diferencia de precio hasta disponer de conciliación explícita.
 if btrim(coalesce(v_precio,'')) !~ '^\\d+([.,]\\d{1,2})?$'
 then raise exception 'Aportación del destino no válida' using errcode='22023'; end if;
 v_unitario:=replace(btrim(v_precio),',','.')::numeric(10,2);
 v_importe:=v_unitario*v_origen.plazas;
 if v_importe <> v_origen.importe_total
 then raise exception 'Diferencia económica pendiente de resolución; traslado no realizado' using errcode='23514'; end if;
 select coalesce(sum(plazas),0)::int into v_ocupado
 from public.reservas_whatsapp
 where experiencia_id=p_destino and estado not in ('cancelada','aplazada');
 if v_ocupado+v_origen.plazas>v_max then raise exception 'Aforo insuficiente' using errcode='23514'; end if;
 -- El destino aplica exactamente el crédito existente; no genera un segundo cobro.
 insert into public.reservas_whatsapp
 (experiencia_id,nombre,telefono,plazas,precio_unitario,importe_total,estado,pago_estado,origen)
 values(p_destino,v_origen.nombre,v_origen.telefono,v_origen.plazas,v_unitario,
        v_origen.importe_total,'confirmada','recibido','manual') returning id into v_new_id;
 insert into public.vs_traslados_reservas
 (reserva_origen_id,reserva_destino_id,experiencia_origen_id,experiencia_destino_id,
  plazas,credito_aplicado,actor)
 values(p_origen,v_new_id,v_origen.experiencia_id,p_destino,v_origen.plazas,
        v_origen.importe_total,v_actor);
 return v_new_id;
end;
$$;
revoke all on function public.vs_trasladar_reserva_aplazada(uuid,bigint) from public,anon;
grant execute on function public.vs_trasladar_reserva_aplazada(uuid,bigint) to authenticated;
commit;

-- Pruebas obligatorias ANTES de producción:
-- 1. Anónimo y usuario no admin => 42501.
-- 2. Crédito desigual, aforo lleno, evento pasado y reserva no aplazada => rechazo.
-- 3. 2 ejecuciones simultáneas del mismo origen => 1 destino como máximo.
-- 4. 2 reservas distintas buscando última plaza => 1 destino como máximo.
-- 5. Error en inserción del movimiento => rollback también de reserva nueva.
-- 6. Sin cambios de importe ni estado en reserva origen.
-- 7. Auditoría: origen excluido de ingresos, destino incluye crédito transferido
--    solo una vez en las sumas; contabilidad diferencia ingresos nuevos/traspasados.
-- 8. Comprobar policy y privilegios de auth.users para rol invocador.
