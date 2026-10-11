# Reservas — preparación técnica (sin despliegue)

El catálogo de experiencias continúa en **Supabase**. El esquema D1 propuesto es aislado y **no se ha aplicado**.
Antes de conectar este esquema debe comprobarse el ID real de la tabla experiencias y diseñarse la sincronización solo de los campos mínimos (ID, aforo y mínimo).

## Seguridad y privacidad
- Los endpoints públicos no deben devolver contactos ni hashes; no usar el hash simple de teléfono o correo como protección suficiente contra identificación: emplear HMAC con clave secreta en Worker.
- La columna opcional `contact_private` es una reserva de esquema, no una autorización para guardar contactos sin protección; valorar cifrado autenticado y política de retención antes de usarla.
- Nunca confiar en aforo o estados enviados por el navegador.
- Confirmación y ocupación deben validarse en la misma operación atómica en D1; `booking-rules.js` es solo prevalidación.
- Agregar autenticación del administrador, límites de peticiones, CSRF cuando corresponda, y registro mínimo sin datos personales.
- WhatsApp: utilizar enlace con mensaje preparado hasta verificar opt-in y permisos para mensajería automática.
- Pagos: separar `payment_status` de la situación de reserva. No marcar pagos recibidos sin comprobación.
- No aplicar migraciones automáticamente ni tocar Supabase sin respaldo y revisión.

## Fases
1. Verificar esquema `experiencias` y sus IDs, y definir aforo mínimo/máximo.
2. Operación transaccional de reserva y confirmación, pruebas concurrentes y recuperación.
3. Panel protegido y confirmaciones manuales de WhatsApp.
4. Automatizaciones autorizadas; Meta actual permanece sin cambios.
