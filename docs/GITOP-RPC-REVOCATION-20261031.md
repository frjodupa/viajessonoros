# Continuación de seguridad — RPC administrativas

**Preparado; BLOQUEADO para ejecutar o publicar.** Continúa #62 y reutiliza sus verificaciones anteriores. No se repiten los 45 tests ni el build. El adjunto reiterado no aporta referencia de Supabase de pruebas: «OK» no identifica un entorno ni autoriza usar producción.

## Cambio acotado

Nueva migración generada mediante CLI oficial 2.122.0, `20261031210238_admin_rpc_membership.sql`. Requiere `20261031095210_minimum_admin_experiencias.sql`, que permanece intacta.

Las cinco RPC `vs_admin_alquiler_consultar`, `vs_admin_alquiler_guardar`, `vs_admin_historial`, `vs_admin_panel_datos` y `vs_admin_panel_operar` consultarán `vs_security.is_admin()` en lugar de autorizar por email. Así se prepara la revocación por membresía también para esos accesos; no se afirma revocación universal de todas las funciones del proyecto ni cancelación de operaciones ya iniciadas.

La migración contiene las cinco definiciones del catálogo previamente revisado como comparación exacta. Aborta transaccionalmente si una firma/definición ha cambiado, si no pertenece a postgres, no es DEFINER o falta el helper. Sustituye una única guardia por función. Conserva operaciones, validaciones, argumentos, propietario y search_path vacío. Revoca EXECUTE de PUBLIC/anon y concede a authenticated; no amplía otros grants existentes. No modifica filas de reservas, experiencias, historial, gastos o pagos.

Las definiciones se recuperan de la evidencia local anterior. No se han vuelto a consultar datos ni funciones remotas. Si el catálogo remoto ha cambiado, actualizar su revisión en pruebas, sin eliminar la comprobación ni aplicar a ciegas.

## Validación realizada y pendiente

| Comprobación | Estado |
| --- | --- |
| Procedencia CLI y SHA-256 contra release oficial ya conservada | PASS |
| Coincidencia de las cinco definiciones y cambio exclusivo de guardia | Prueba estructural, resultado en entrega local |
| Transacción, controles de deriva/propietario, EXECUTE y ausencia de DML de negocio en la migración | Prueba estructural, resultado en entrega local |
| Compilación/ejecución de SQL en Supabase | NO EJECUTADO: falta Supabase aislado autorizado |
| Acceso positivo, rechazo y revocación sin refrescar JWT | PENDIENTE en Supabase de pruebas |
| Reversión después de COMMIT de esta migración | PENDIENTE; la reversión de reservas anterior no cubre este cambio |

No se utiliza PGlite para presentar esta nueva migración como validada en Supabase. No se han instalado componentes nuevos ni ejecutado scripts de instalación. La CLI se ejecuta con red denegada, HOME limpio y escrituras limitadas al espacio de esta tarea. No hay Docker, psql ni Supabase CLI global disponibles; no se instalan ni se aprovisionan servicios por iniciativa propia.

## Matriz obligatoria de integración (aún no ejecutada)

En un proyecto exclusivamente sintético confirmado por el titular, con servicio de Auth/PostgREST real y sin claves/usuarios de producción:

1. Aplicar primero migración administrativa y preparar identidades sintéticas confirmadas; registrar sus UUID explícitos, sin correo real ni envíos de email.
2. Antes de esta migración, capturar definiciones, propietarios, search_path y ACL exactas de las cinco funciones. Verificar que coinciden con snapshots y conservar hash.
3. Probar usuario anónimo y ordinario contra las cinco RPC: deben fallar antes de devolver datos o producir escrituras. Probar también errores de firma y helper ausente.
4. Probar administrador miembro con datos sintéticos: alquiler guardar/consultar, historial, panel de consulta y operaciones de asistencia/gasto/espera. Confirmar validaciones de pagos/plazas existentes y ausencia de regresiones.
5. Revocar membresía desde el propietario y conservar el mismo JWT: las cinco RPC deberán denegar el acceso en la siguiente petición. Comprobar que seguir teniendo el email administrativo no concede permisos. Restaurar membresía solo en el fixture de prueba para repetir los casos.
6. Ensayar deriva de una definición dentro de un fixture; la migración debe abortar completa, sin cambios parciales. Revisar resultados de grants y asesores, sin modificar configuración automáticamente.
7. Después de COMMIT, ensayar restauración selectiva y verificar políticas, ACL, firmas y datos sintéticos. No extrapolar estos casos secuenciales a concurrencia de aforo, que sigue pendiente aparte.

## Respaldo y reversión

La captura antigua permite revisar el cambio de guardia, pero no sustituye un backup actualizado de ACL y propietarios. Antes de una aplicación autorizada, guardar copia completa de los cinco objetos y preparar restauración en el mismo entorno aislado. Antes de COMMIT se puede usar ROLLBACK; aún no se ha ejecutado aquí. Después de COMMIT no hay deshacer automático: restaurar solo los objetos revisados y probarlo. Volver a la guardia por email reabre la diferencia de revocación y exige revisión expresa; no se incluye un rollback automático que la restaure.

## Dependencias y estado global

La PR de continuación apunta a la rama de #62 para que su diff sea únicamente este refuerzo. No se fusiona ni se modifica #62/main. La regla heredada `gitop/integral-*` mantiene desactivado el despliegue de la rama nueva. Publicación sigue bloqueada por Supabase de pruebas/concurrencia, historial Domus, Safari, bots, MFA y control de cuentas/correo IONOS, según la entrega integral existente.
