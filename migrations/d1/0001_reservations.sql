-- Viajes Sonoros: esquema inicial D1 (NO ejecutar en producción sin integración revisada).
-- IDs de experiencia externos: Supabase sigue siendo fuente única de eventos.
-- Contactos personales se gestionarán exclusivamente en backend autenticado.
CREATE TABLE IF NOT EXISTS reservation_events (
 experience_id TEXT PRIMARY KEY NOT NULL,
 capacity INTEGER NOT NULL CHECK(capacity>0),
 minimum_attendees INTEGER NOT NULL CHECK(minimum_attendees>0 AND minimum_attendees<=capacity),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reservations (
 id TEXT PRIMARY KEY NOT NULL,
 experience_id TEXT NOT NULL REFERENCES reservation_events(experience_id) ON DELETE RESTRICT,
 contact_hash TEXT NOT NULL,
 contact_private TEXT,
 seats INTEGER NOT NULL CHECK(seats BETWEEN 1 AND 100),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','waitlist','cancelled')),
 payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','pending','received','refund_due','refunded','transferred')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservation_active_contact
 ON reservations(experience_id,contact_hash) WHERE status!='cancelled';
CREATE INDEX IF NOT EXISTS idx_reservation_event_status
 ON reservations(experience_id,status);
-- En producción: confirmar plazas dentro de una transacción atómica.
-- Prohibido exponer contact_private o hashes en endpoints públicos.
