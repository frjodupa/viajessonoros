# Plan de activación del aforo por experiencia — sin despliegue

## Decisión arquitectónica pendiente
Supabase contiene las experiencias y D1 contiene únicamente un esquema **propuesto** de reservas. No existe una transacción atómica distribuida entre ambas plataformas. Un bloqueo en memoria del Worker tampoco basta: puede haber varios procesos o instancias.

## Requisito indispensable
Antes de habilitar el editor, seleccionar **una autoridad única para la capacidad y la ocupación**. La comprobación «plazas confirmadas <= aforo» y la actualización deben ejecutarse en una misma base de datos/transacción. Opciones:

1. Centralizar en Supabase la capacidad y las reservas, con función SQL transaccional y RLS, manteniendo WhatsApp manual.
2. Centralizar la capacidad operativa y confirmaciones en D1, con una operación transaccional que actualice el aforo; Supabase mostraría una copia sincronizada, nunca la autoridad de confirmación.

**No** realizar cambios coordinados Supabase→D1 basados solo en una lectura previa. La sincronización eventual requiere estado de pendiente, reintentos, versiones y reconciliación.

## Verificaciones antes de activar
- Inspeccionar esquema real, permisos, RLS y copias de seguridad.
- Confirmar editor autenticado en `experiencias.html`, sin dar permiso de escritura a visitantes.
- Migrar columnas `aforo` y `aforo_minimo` sin inventar datos de experiencias existentes.
- Evitar habilitar confirmar reserva mientras una experiencia carezca de capacidad válida.
- Comprobar concurrencia de cambios y confirmaciones en la base elegida y con varias conexiones.
- Mantener reservas por WhatsApp; el administrador registra y comprueba Bizum manualmente.
- Probar en preproducción aislada, con datos ficticios, y activar solo con aprobación explícita.

## Estado
Este documento y los adaptadores actuales son preparativos, no una sincronización desplegada. El PR #4 permanece en borrador y no modifica producción.
