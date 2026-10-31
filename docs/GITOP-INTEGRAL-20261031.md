# Viajes Sonoros — reservas

Migración nueva y separada, dependiente de minimum_admin_experiencias. GRANT INSERT por columnas para anon, RLS sin SELECT personal; authenticated puede solicitar reserva pública pendiente y solo membresía administrativa puede gestionar filas. Importes públicos derivados del precio de experiencia. Aforo pendiente+confirmado, mismo advisory lock para reserva y capacidad, sin cambio de experiencia; aislamientos distintos de READ COMMITTED rechazados. Reserva sin referencia de cliente; solo fixtures. 3/3 pruebas PostgreSQL finales aprobadas. Reversión después de COMMIT probada con filas conservadas; rollback-test restaura permisos previos y NO es un rollback seguro de producción. No aplicar hasta validar concurrencia real en Supabase aislado autorizado. Falta protección efectiva contra bots que llenen el cupo de pendientes. No políticas de expiración/cancelación inventadas.

Las ramas gitop/integral-* no generan despliegues automáticos según vercel.json. Esta regla no desactiva main.

BLOQUEO adicional: las cuatro migraciones Domus locales tienen versiones distintas de las registradas remotamente. No ejecutar db push ni reparar historial de forma automática. Conciliar en pruebas antes de cualquier aplicación.
