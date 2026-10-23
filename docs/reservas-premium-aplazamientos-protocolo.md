# GITOP · Protocolo de aplazamientos — Viajes Sonoros

**Estado: especificación experimental, NO habilitada en producción.**

## Reglas innegociables
1. La reserva original conserva ID, datos, importe y referencias; nunca borrar.
2. Solo se aplaza con motivo y acreditación administrativa de la aportación recibida.
3. Una transacción única bloquea la reserva origen, anota el saldo y deja libres las plazas de origen. El guardia de aforo debe tratar `aplazada` como estado sin ocupación; no basta con cambiar la interfaz.
4. No se asigna una experiencia nueva sin comprobar fecha futura, plazas libres, aportación requerida y diferencia de precio.
5. Si el precio nuevo es superior, solicitar aportación adicional antes de confirmar. Si es inferior, mantener crédito o tramitar devolución explícita, con registro separado.
6. Toda operación guarda fecha, actor, reserva origen/destino, importe, motivo y estado anterior y posterior; evitar transferir dos veces mediante restricción única.
7. La confirmación de WhatsApp se prepara después de finalizar la transacción; abrir WhatsApp no constituye envío confirmado.
8. No volver a usar estado `confirmada` con `pago_estado=pendiente`: presentar los datos históricos como incidencia sin modificarlos sin comprobación.

## Pruebas obligatorias antes de habilitar
- Registro inicial: contar reservas, total plazas por experiencia, importes y checksum de los IDs.
- Una reserva pagada aplazada libera exactamente sus plazas y conserva exactamente su crédito.
- Dos solicitudes simultáneas al último hueco: solo una puede confirmar.
- Doble pulsación o dos dispositivos intentando aplazar: un solo movimiento.
- Fallo intermedio: rollback íntegro, cero movimientos huérfanos.
- Reserva pendiente de pago: aplazamiento rechazado; nunca inventar importe recibido.
- Usuario sin privilegios / anónimo: operación rechazada por RPC y por políticas.
- Asignación a experiencia sin capacidad y destino pasado: rechazada.
- Historial y PDF incluyen confirmadas, pendientes, aplazadas y canceladas; el saldo nunca cuenta como nueva aportación ingresada.
- iPhone Safari: gestionar, consultar motivo, ver PDF, guardar y compartir.
- Tras pruebas, reconciliar reservas reales y ejecutar rollback si hay cualquier discrepancia.

## Puesta en marcha
Mantener separados los archivos `*.proposed.sql`. No ejecutar SQL de borradores directamente en Supabase. Preparar la RPC en un entorno aislado, validarla, auditar privilegios y obtener una copia restaurable antes de la migración real.
