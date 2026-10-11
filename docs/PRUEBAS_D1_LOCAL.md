# Pruebas locales de Cloudflare D1 — procedimiento no destructivo

Este proyecto **no tiene configurado un Worker de reservas ni una base D1 de producción** en este PR.
No ejecutar contra recursos remotos sin identificar cuenta y entorno.

## Requisitos previos
- Node.js, dependencias de desarrollo y Wrangler disponible en el ordenador de desarrollo.
- Una base D1 **local** de pruebas o un entorno temporal separado y autorizado.
- No utilizar credenciales, teléfonos ni datos reales de asistentes.

## Comprobación con SQLite (ya automatizada)
```sh
python3 scripts/test-d1-reservation-sql.py
python3 scripts/test-d1-concurrent-confirmation.py
```

## Fase posterior con D1 local
Al configurar Wrangler y un binding local de prueba, aplicar por orden:
1. `migrations/d1/0001_reservations.sql`
2. `migrations/d1/0002_capacity_guards.sql`

Realizar inserciones ficticias, confirmaciones simultáneas y cancelaciones. Verificar
`RESERVATION_CAPACITY_EXCEEDED`, índices y foreign keys. Nunca usar `--remote`
para esta auditoría, ni compartir IDs/secretos de producción.

## Criterios para aprobar integración
- La base rechaza sobreaforo e inconsistencias sin depender de prevalidación JS.
- La identidad de Supabase está verificada en servidor y la lista de administradores es privada.
- El acceso público no puede leer ni enumerar reservas ni datos personales.
- Se prueban cancelaciones, reintentos e idempotencia y estados de aportaciones.
- Los mensajes de WhatsApp requieren apertura/confirmación manual y no se envían solos.
- El esquema real de `experiencias` y su correspondencia de IDs han sido auditados.

**Estado:** pendiente de ejecución D1 local; pruebas SQLite ya pasan en GitHub Actions.
