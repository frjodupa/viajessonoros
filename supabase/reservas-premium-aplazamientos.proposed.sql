-- BORRADOR SIN APLICAR: módulo Reservas Premium de Viajes Sonoros
-- Preserva reservas_whatsapp y su histórico. No alterar directamente estado/pago_estado para transferir saldo.
-- Revisión previa obligatoria de RLS, permisos y transacciones en entorno de pruebas.

create table if not exists public.reservas_aplazamientos (
 id uuid primary key default gen_random_uuid(),
 reserva_origen_id uuid not null references public.reservas_whatsapp(id) on delete restrict,
 reserva_destino_id uuid references public.reservas_whatsapp(id) on delete restrict,
 experiencia_destino_id bigint references public.experiencias(id) on delete restrict,
 importe_conservado numeric(10,2) not null check(importe_conservado >= 0),
 plazas_origen integer not null check(plazas_origen between 1 and 10),
 estado text not null default 'pendiente_destino' check (estado in ('pendiente_destino','aplicado','anulado')),
 motivo text,
 created_at timestamptz not null default now(),
 aplicado_at timestamptz,
 constraint aplazamiento_destino_consistente check (
  (estado='aplicado' and reserva_destino_id is not null and experiencia_destino_id is not null)
  or (estado <> 'aplicado' and reserva_destino_id is null)
 )
);
create unique index if not exists ux_aplazamientos_origen_activo
 on public.reservas_aplazamientos(reserva_origen_id) where estado <> 'anulado';
create unique index if not exists ux_aplazamientos_destino
 on public.reservas_aplazamientos(reserva_destino_id) where reserva_destino_id is not null;
create index if not exists idx_aplazamientos_estado on public.reservas_aplazamientos(estado,created_at desc);
alter table public.reservas_aplazamientos enable row level security;
revoke all on public.reservas_aplazamientos from anon,authenticated;
-- Pendiente: RPC SECURITY DEFINER en esquema privado, autorización admin estricta,
-- transferencia atómica con bloqueo de ambas reservas, comprobación aforo/importe,
-- gestión de diferencia (a pagar o a favor) y registro de auditoría.
-- No activar desde el frontend ni dar GRANT de escritura directa.
