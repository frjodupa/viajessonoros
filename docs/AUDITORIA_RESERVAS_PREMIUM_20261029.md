# Auditoría de reservas de experiencias · 29-10-2026

**Ámbito:** `reserva.html`, `reservas-premium.html`, `experiencias.html`, `src/experience-detail.js`, `src/supabase.js`, tablas `experiencias` y `reservas_whatsapp`. No incluye Domus. **Modo:** lectura, sin escrituras en producción.

## Flujo actual verificado
1. Ficha de experiencia y acceso a `/reserva.html?experiencia=ID` o selector de próximas experiencias.
2. En una página: nombre, teléfono, plazas, importe estimado del cliente y registro por inserción directa en `reservas_whatsapp`.
3. Registro pendiente; se abre WhatsApp con texto preparado para remitir justificante Bizum. La reserva no se confirma con ese clic.
4. `reservas-premium.html`: gestión de solicitudes, comprobación de pago, confirmación, comunicación, asistencia e informes.

**Pasos visibles actuales:** selección de experiencia cuando no hay ID, formulario, envío y WhatsApp; con ID preseleccionado, formulario, envío y WhatsApp. **Objetivo:** formulario único con confirmación persistente; WhatsApp opcional de seguimiento sin interrumpir justificante.

## Hallazgos prioritarios
**P0 · Aforo no visible de modo consistente.** `reserva.html` muestra `aforo_maximo`, no disponibilidad real. El servidor sí suma todas las reservas salvo `cancelada` y `aplazada` en `vs_internal.guard_booking_capacity`, con bloqueo asesor por experiencia. Crear función pública de solo lectura que devuelva aforo disponible con exactamente la misma definición, sin exponer asistentes. No consultar directamente reservas privadas desde el cliente.

**P0 · Importes enviados por el cliente.** Inserción directa de `precio_unitario` e `importe_total` provenientes de JS. Verificar constraints/triggers de importes, sustituir con función RPC que recalcule importe desde la experiencia y valide las reglas vigentes; no confiar en el navegador.

**P0 · Reintentos.** El botón se deshabilita, pero no se identificó clave de idempotencia persistente en la inserción `reserva.html`. Implementar token único de solicitud y restricción en base de datos, conservar la clave tras timeout y retornarla sin duplicar.

**P1 · Reglas superpuestas de aforo.** Existen dos disparadores BEFORE INSERT/UPDATE en `reservas_whatsapp`: `reservas_guard_aforo` (solo `confirmada`) y `vs_guard_booking_capacity` (pendientes y confirmadas). Documentar y probar diferencias antes de consolidar, manteniendo la política más estricta actualmente activa.

**P1 · Acceso a experiencias.** Las políticas de `experiencias` para `authenticated` permiten SELECT/INSERT/UPDATE/DELETE con predicado `true`; revisar y restringir a la cuenta administrativa autorizada tras comprobar flujos existentes.

**P1 · Navegación.** `reserva.html` hace `location.assign` a WhatsApp inmediatamente tras registrar, dificultando ver una confirmación estable en la página. Mostrarla antes y dejar el botón explícito, sin equiparar apertura de WhatsApp con envío.

**P1 · Experiencia finalizada.** El cliente bloquea la reserva tras fecha/hora, pero requiere misma validación al guardar en el servidor para evitar consultas manipuladas.

**P2 · Importe ambiguo.** `experiencias.precio` y `fecha` son texto. El cliente analiza formatos simples y ante formatos no compatibles devuelve importe indefinido. Necesita normalización/validación en servidor y migración no destructiva para datos legados.

## Propuesta de UX premium sin retirar funciones
- Ficha de experiencia compacta con imagen, título, fecha y hora, aportación y disponibilidad calculada por el servidor.
- Formulario: nombre, teléfono y asistentes; total claro; botón **RESERVAR PLAZAS**; estado ocupado y errores de campo.
- Confirmación dentro de la misma pantalla con estado «pendiente», detalles y botón WhatsApp. No se marca pagada ni confirmada.
- Admin: mantener alta/edición, reserva manual, confirmar, cancelar, Bizum, contactos, recordatorios, impresión, totales y experiencias pasadas. Reorganizar acciones por frecuencia sin retirar herramientas.
- Priorizar 320–430 px de ancho y pruebas en Safari iPhone y Android Chrome.

## Orden de implementación sugerido
1. Pruebas de caracterización (RLS, políticas, aforos, cancelaciones, manuales, pagos, importes, retries, concurrencia) contra base de pruebas sin datos reales.
2. RPCs de disponibilidad y registro idempotente sobre staging. Mantener compatibilidad con API y admin actual.
3. Interfaz premium en rama, con pruebas automatizadas y recorrido móvil/escritorio.
4. Auditoría de accesibilidad, impresión, WhatsApp y regresiones admin.
5. Aprobar por separado migraciones y despliegue. **Nunca aplicar migración a producción sin aprobación expresa.**

## Verificaciones realizadas
- [x] Rutas y código de entrada revisados.
- [x] Esquema de ambas tablas consultado en solo lectura.
- [x] Triggers `reservas_guard_aforo` y `vs_guard_booking_capacity` examinados sin modificarlos.
- [x] RLS de `experiencias` y `reservas_whatsapp` consultado.
- [ ] Pruebas automatizadas del módulo general (el conjunto identificado en el repositorio se centra en Domus).
- [ ] Pruebas de concurrencia y de idempotencia.
- [ ] Validación funcional iPhone/Android.
- [ ] Capturas comparativas reales en ambos dispositivos.
- [ ] Confirmación de todas las funciones admin, Bizum, PDF e impresión.

**Estado:** auditoría en rama; no lista para producción sin cerrar P0 y pruebas.
