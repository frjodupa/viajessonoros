begin;
alter table public.domus_grupos add column cupo_maximo integer check(cupo_maximo between 1 and 100);
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