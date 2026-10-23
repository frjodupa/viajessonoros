-- VIAJES SONOROS / GITOP: PROPUESTA NO EJECUTADA
-- Preservar registros existentes. Aplicar únicamente tras copia de seguridad y pruebas RLS.
create table if not exists public.reservas_premium_movimientos(
 id uuid primary key default gen_random_uuid(),
 reserva_id uuid not null references public.reservas_whatsapp(id) on delete restrict,
 tipo text not null check(tipo in ('estado','aportacion','aplazamiento','asistencia','whatsapp','cancelacion','devolucion')),
 estado_anterior text, estado_nuevo text, motivo text,
 importe numeric(10,2), plazas_asistentes integer check(plazas_asistentes>=0),
 experiencia_destino_id bigint references public.experiencias(id),
 actor uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create index if not exists reservas_premium_movimientos_reserva_fecha on public.reservas_premium_movimientos(reserva_id,created_at desc);
alter table public.reservas_premium_movimientos enable row level security;
revoke all on public.reservas_premium_movimientos from anon,authenticated;
-- No habilitar escritura directa: implementar RPC transaccional autenticada por admin,
-- con privilegios mínimos, auditoría y chequeo de aforo para aplazamientos.
-- La fila original de reservas_whatsapp nunca se elimina en un aplazamiento.
