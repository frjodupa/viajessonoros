-- VIAJES SONOROS / GITOP: PROPUESTA NO EJECUTADA
-- Preservar registros existentes. Aplicar únicamente tras copia de seguridad y pruebas RLS.
create table if not exists public.reservas_premium_movimientos(
 id uuid primary key default gen_random_uuid(),
 reserva_id uuid not null references public.reservas_whatsapp(id) on delete restrict,
 tipo text not null check(tipo in ('estado','aportacion','aplazamiento','asistencia','whatsapp','cancelacion','devolucion')),
 estado_anterior text, estado_nuevo text, motivo text,
 importe numeric(10,2), plazas_asistentes integer check(plazas_asistentes>=0),
 experiencia_destino_id bigint references public.experiencias(id),
 actor uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create index if not exists reservas_premium_movimientos_reserva_fecha on public.reservas_premium_movimientos(reserva_id,created_at desc);
alter table public.reservas_premium_movimientos enable row level security;
revoke all on public.reservas_premium_movimientos from anon,authenticated;
-- No habilitar escritura directa: implementar RPC transaccional autenticada por admin,
-- con privilegios mínimos, auditoría y chequeo de aforo para aplazamientos.
-- La fila original de reservas_whatsapp nunca se elimina en un aplazamiento.

-- Auditoría automática propuesta (NO activar sin pruebas de rol/RLS).
-- Cada actualización de estado o aportación produce una entrada inmutable.
create or replace function public.vs_auditar_cambio_reserva()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 -- El aplazamiento registra su propio movimiento con motivo y crédito en la RPC.
 -- Evitar duplicar la anotación genérica generada por este trigger.
 if new.estado = 'aplazada' and old.estado is distinct from new.estado then
   return new;
 end if;
 if (old.estado,old.pago_estado) is distinct from (new.estado,new.pago_estado) then
   insert into public.reservas_premium_movimientos
    (reserva_id,tipo,estado_anterior,estado_nuevo,motivo,importe,actor)
   values(new.id,
     case when old.pago_estado is distinct from new.pago_estado then 'aportacion' else 'estado' end,
     old.estado||' / '||old.pago_estado,
     new.estado||' / '||new.pago_estado,
     'Cambio de estado registrado automáticamente',
     new.importe_total,(select auth.uid()));
 end if;
 return new;
end; $$;
revoke all on function public.vs_auditar_cambio_reserva() from public,anon,authenticated;
-- NOTA: auth.uid() puede ser NULL para escrituras con service_role; actor permite NULL y debe identificarse la fuente.
-- Revisar esquema actor, operaciones administrativas y función trigger
-- antes de su activación; no ejecutar CREATE TRIGGER todavía.
-- create trigger vs_auditar_cambio_reserva after update of estado,pago_estado
-- on public.reservas_whatsapp for each row
-- execute function public.vs_auditar_cambio_reserva();
