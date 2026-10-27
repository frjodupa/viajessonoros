-- Manual rollback, never run automatically. Refuses to erase workshop data.
-- Export/back up Domus and obtain explicit approval if reservations/groups exist.
begin;
do $$ begin
 if exists(select 1 from public.domus_reservas) or exists(select 1 from public.domus_grupos)
    or exists(select 1 from public.domus_clases) then
  raise exception 'Reversión detenida: existen datos Domus. Exporta y revisa antes de eliminarlos';
 end if;
end $$;
drop function public.domus_registrar(jsonb);
drop function public.domus_calendario(date,date);
drop function public.domus_admin_datos();
drop function public.domus_mover_participante(uuid,uuid,uuid);
drop function public.domus_guardar_clase(jsonb);
drop table public.domus_grupos_participantes;
drop table public.domus_clases;
drop table public.domus_participantes;
drop table public.domus_reservas;
drop table public.domus_grupos;
drop table public.domus_salas;
drop table public.domus_config;
drop schema domus_private cascade;
-- Keep btree_gist: it may be shared by other modules after installation.
commit;
