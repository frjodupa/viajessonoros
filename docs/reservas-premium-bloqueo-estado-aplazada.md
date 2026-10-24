# Bloqueo detectado: estado aplazada

Comprobación de solo lectura (2026-10-23): la restricción de la tabla reservas_whatsapp solo admite pendiente, confirmada y cancelada. La opción aplazada no existe en el esquema actual.

Para habilitar los aplazamientos se necesita una migración atómica con dos modificaciones coordinadas:
- Extender la restricción de estado para permitir aplazada sin eliminar los estados existentes.
- Modificar vs_internal.guard_booking_capacity() para excluir aplazada y cancelada del cómputo de plazas.

No aplicar el nuevo estado por separado: sin actualizar la guardia de aforo la reserva continuaría ocupando plazas. Mantener deshabilitado el botón de aplazamiento hasta completar la migración, la RPC de crédito y las pruebas de permisos, aforo y concurrencia.

Preparar copia restaurable antes de probar cambios. No ejecutar DDL sobre producción como prueba.
