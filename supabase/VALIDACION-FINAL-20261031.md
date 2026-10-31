> Antecedente de la validación anterior, copia con UUID real omitido. El informe actual está en la entrega integral.

# Validación final Supabase — 31/10/2026

**BLOQUEADO para producción. APTO en el alcance aislado probado para la migración de experiencias.** No se han aplicado migraciones remotas ni desplegado funciones. Este informe actualiza la entrega anterior, que dejaba la ejecución SQL pendiente.

Rama: `gitop/security-minimum-admin-20261031`, copia Git independiente, base `336d3fb0676ca002be1347f3cc54e8288991eb3f`. Original: `/Users/jose/Documents/viajessonoros`, conservado. Ninguna consulta a filas de reservas, experiencias o clientes reales. Consultas remotas exclusivamente SELECT de catálogos, asesores y la identidad administrativa indicada.

## Identidad administrativa

La cuenta oficial `info@viajessonoros.es`, utilizada por las reglas administrativas existentes, corresponde a `[UUID verificado, evidencia local]`. Metadatos: correo confirmado, sin baja y sin bloqueo vigente. No se han leído claves, tokens ni contraseñas. Esta identificación no acredita por sí sola MFA ni control actual de la sesión del titular.

El UUID real NO se incrusta en tests ni en la migración. Las pruebas usan `11111111-1111-4111-8111-111111111111` y `22222222-2222-4222-8222-222222222222`. El operador debe proporcionar explícitamente el UUID revisado mediante `SET vs_security.admin_user_id` en la misma conexión. Sin él, o con identidad inexistente/no confirmada, la transacción falla cerrada. Una ejecución automática sin esa preparación fallará deliberadamente.

## Archivos preparados y preservación

- `migrations/20261031095210_minimum_admin_experiencias.sql`: generado con `supabase migration new` de CLI oficial 2.122.0. Mismo SQL ejecutable que `experiencias-admin.proposed.sql`; únicamente actualiza el comentario sobre disponibilidad de CLI. Restringe INSERT/UPDATE/DELETE, mantiene SELECT público publicado, limita GRANT y secuencia, introduce membresía privada y RPC INVOKER con helper DEFINER privado, search_path vacío y EXECUTE limitado. Guardias restrictivas evitan reapertura por una política permisiva futura.
- `../tests/security/final-postgres.test.mjs`: nuevas pruebas PostgreSQL con tipos, identity, constraints, políticas y cuerpos de triggers observados. Las cinco RPC administrativas se copian desde catálogos revisados a la base sintética, nunca se invocan remotamente.
- Este documento y evidencias en `../../evidence/validation-final-20261031/`.
- SQL propuesto anterior intacto: SHA-256 verificado contra `initial.json`. No se han sobrescrito `security-policies.sql`, propuestas de reservas/search_path, Edge, configuración ni UI durante esta validación. No ejecutar la propuesta amplia antigua por arrastre.
- CLI creó además `supabase/.temp/cli-latest` dentro de la copia aislada; no contiene credenciales. Herramientas descargadas están fuera del repositorio y no se modificó package.json ni dependencias del proyecto.

HEAD, estado de trabajo y diff del original coinciden con la captura anterior. La huella histórica de todas las refs no pudo compararse con certeza: se desconoce su serialización original y hay refs internas de Codex. No se han ejecutado escrituras Git en el original; no se afirma equivalencia criptográfica de todas las refs. Detalle en `preservation.json`.

## Pruebas ejecutadas

**22 casos únicos aprobados, 0 fallos:** 8 PostgreSQL reales, 11 Edge con dobles de servicios y 3 estructurales. La primera ejecución conjunta dio 21/21; tras ampliar la prueba final de RPC se ejecutó su archivo actualizado, 5/5. Logs: `tests.tap` y `final-postgres.tap`. No se compiló frontend porque no se modificó.

| Comprobación | Resultado |
| --- | --- |
| Migración sin UUID, UUID inexistente, política desconocida | Rechazo y rollback correctos |
| anon y autenticado ordinario | Solo experiencias publicadas; escrituras denegadas |
| Administrador sintético | CRUD de experiencias, incluido bigint IDENTITY BY DEFAULT |
| Membresía, funciones, ACL | Tabla privada inaccesible; RPC anon denegada; revocar membresía surte efecto sin refrescar JWT |
| Guardias restrictivas | Política permisiva añadida en pruebas no reabre acceso |
| Integridad de reservas/Storage | Sin cambios en filas sintéticas por la migración; FK impide eliminar experiencia referenciada |
| Reservas administrativas | Inserción, confirmación, cancelación/pago e historial correctos |
| Aforo | Exceso de plazas rechazado; dos inconsistencias previas reproducidas, descritas debajo |
| Cinco RPC DEFINER existentes | Rechazan usuario ordinario; llamadas anon sin EXECUTE denegadas en fixture |
| Acceso positivo a RPC | Alquiler guardar/consultar e historial probados; operación desconocida rechazada como administrador |
| Propuesta search_path existente | Ejecutada solo en pruebas; reservas, confirmación y cambio de aforo siguen funcionando |
| Edge publish-experience-social | 401/403 sin efectos; admin sintético válido; JWT fabricado rechazado; RPC fallida deniega acceso |
| SSRF | Rechaza loopback, metadata, otros orígenes/buckets, codificaciones y rutas ambiguas; sin redirects, límites MIME/tamaño/tiempo |
| Reversión transaccional | Sustitución de COMMIT por ROLLBACK en prueba: esquema nuevo desaparece y filas permanecen iguales |
| Aislamiento y formato | Red y lectura del original denegadas en ejecución; `git diff --check` correcto |

Las ACL de las cinco RPC se reconstruyen con el acceso de authenticated indicado por el asesor y anon revocado; no son una copia completa de todos los grants heredados. El historial y alquiler tienen fixtures auxiliares mínimas, no toda su estructura real. No se han probado todas las operaciones positivas de panel/asistencia/gastos/espera ni concurrencia entre conexiones.

## Hallazgos confirmados y bloqueos

| Prioridad | Evidencia y ubicación | Estado / acción propuesta |
| --- | --- | --- |
| P1 | `live-policies-raw.json`: cuatro políticas authenticated de experiencias usan true; ACL concede ALL a anon/authenticated. Autenticado ordinario puede modificar experiencias según configuración actual. | La migración preparada corrige políticas y grants. No está aplicada. TRUNCATE no queda protegido por RLS; su grant es innecesario, aunque la FK de reservas limita su ejecución actual. No se intentó en producción. |
| P1 disponibilidad | `reserva.html:76` hace INSERT directo. `live-metadata.json` booking_grants no concede INSERT a anon, aunque existe política INSERT. `final-postgres.test.mjs:71` reproduce permission denied antes/después. | Flujo público incompatible con los permisos observados. Preparar solución separada y limitada, con validación de abuso y datos enviados; no conceder ALL ni ejecutar la propuesta antigua automáticamente. |
| P1 integridad | `public.guard_experience_capacity_v2` cuenta solo confirmadas; `vs_internal.guard_booking_capacity` cuenta pendientes y confirmadas. `final-postgres.test.mjs:78` permite aforo 4 con 5 plazas ocupadas antes/después. | Unificar criterio de ocupación y bloqueo concurrente en una propuesta posterior; la migración de experiencias no causa ni corrige este defecto. |
| P2 | Tres triggers INVOKER tienen search_path mutable y EXECUTE público; `live-extra.json` y asesor. Llamada directa a función trigger rechazada en prueba. | Propuesta search_path existente compatible con los casos probados. No se confirma explotación; revisar CREATE de public y mínimos EXECUTE antes de versionarla separadamente. |
| P2 / límite | Cinco RPC existentes verifican UUID contra email en auth.users; las políticas de reservas usan email del JWT. La nueva membresía por UUID solo controla experiencias y publicación social. | No existe todavía un único mecanismo administrativo en todo el panel. Una revocación de membresía nueva no revoca esas RPC antiguas. No se han modificado reservas ni RPC por extensión de alcance. |
| P2 | Asesor: protección de contraseñas filtradas desactivada. | Configuración pendiente de revisión/autorización; no se modificó Auth. |

Los avisos de SECURITY DEFINER son indicadores de revisión, no prueba de acceso indebido: las cinco RPC inspeccionadas comprueban identidad al principio y rechazaron al usuario ordinario en PostgreSQL. Otros avisos de Domus y tablas fuera del alcance quedan registrados sin cambios ni auditoría adicional. RLS sin políticas puede ser cierre deliberado, no implica exposición.

## Procedencia, integridad e incompatibilidades

- PGlite **0.4.6**, registro oficial npm `@electric-sql/pglite`, repositorio declarado `electric-sql/pglite`. Archivo verificado SHA-512 contra dist.integrity y firma ECDSA npm contra clave publicada; evidencias `pglite-metadata.json`, `npm-keys.json`, `npm-signature.txt`. Sin dependencias runtime ni scripts de instalación ejecutados. No equivale a una verificación completa de attestations Sigstore ni auditoría de su código fuente.
- Motor efectivo **PostgreSQL 17.5 WASM**, confirmado con SELECT version(); producción **17.6**. Misma versión mayor, distinto minor/plataforma. No se ha instalado servidor nativo ni reproducido GoTrue, PostgREST, gateway, extensiones y entorno Supabase completo. No presentar estos tests como equivalencia total de staging.
- Supabase CLI **2.122.0 darwin_amd64**, release oficial `supabase/cli`; tarball SHA-256 `8be7d5bb00091e67618d12fb0a4a1bb10624c69435ecd5b9b95d91d571cc34d8`, contrastado con digest GitHub y checksums publicado. Sin instalador; ejecución offline con HOME vacío. Solo generación local de archivo, no comandos de base remota.
- Tipos reales reconstruidos: bigint identity; publicado y titulo NOT NULL; constraints de reservas y cinco triggers. El fixture previo serial/boolean nullable se mantiene como prueba defensiva adicional, no como representación del esquema real.
- Edge ejecutado bajo Node con TypeScript eliminado y SDK/fetch sintéticos. No se descargó ni ejecutó SDK remoto, no se llamó a Meta/Storage ni se publicaron posts. Falta Deno check, resolución/lock verificable de dependencias y pruebas HTTP JWT reales en staging autorizado. Revisar compatibilidad verify_jwt y tipo de token antes de despliegue.
- El esquema privado vs_security debe permanecer fuera de los esquemas expuestos de Data API. Configuración del gateway no validada por estas pruebas. El helper comprueba membresía y correo confirmado; no incorpora revocación de sesión/bloqueo de usuario adicional.

## Respaldo, aplicación y reversión pendientes

1. Antes de una futura intervención autorizada: confirmar identidad con titular, protección de cuenta y entorno de pruebas realmente separado. Guardar versión/hash de migración, catálogos completos afectados (ACL de tabla/columnas/secuencia/schema/funciones, roles/owners, RLS y definiciones), configuración de Edge y versión desplegada. Las evidencias actuales son inventario, no un backup completo recuperable de producción.
2. El titular deberá verificar backup/PITR recuperable y ensayo de restauración en destino aislado. Aquí no se exportaron datos de clientes ni se restauró producción. Capturar último estado de permisos antes de aplicar y abortar ante diferencias; las comprobaciones de migración no sustituyen inventario completo.
3. Resolver por separado los dos bloqueos de reservas/aforo, probar concurrencia y validar importes/precios calculados por servidor. No mezclar propuestas amplias de Storage o estados sociales con la migración de experiencias.
4. En pruebas autorizadas, suministrar UUID sintético en la misma conexión y aplicar solo migración revisada. En una intervención futura autorizada, usar UUID del titular revalidado; no confiar en `db push` sin preparar explícitamente ese requisito de sesión. Mantener revisión manual de migraciones pendientes e historial remoto; esa conciliación no está probada aquí.
5. Validación posterior: ejecutar `experiencias-admin.verify.sql`, contrastar ACL y políticas, SELECT publicado y denegación de borradores, CRUD admin/denegación ordinario, autoasignación prohibida, revocación, reservas públicas y aforo/concurrencia. En staging, probar gateway/Auth/Edge con identidades sintéticas y Meta desactivado. Repetir asesores sin cambiar configuración automáticamente.
6. Si falla antes de COMMIT: ROLLBACK, probado en PostgreSQL aislado. Después de COMMIT: no existe deshacer transaccional automático; preparar y probar restauración selectiva desde el snapshot inmediatamente anterior. No restaurar automáticamente políticas true ni grants ALL inseguros. Como contención, planificar revocar escrituras de experiencias conservando SELECT publicado; cualquier cambio requiere autorización y prueba de dependencias. Revertir Edge a versión anterior solo tras comprobar que no reabre autorización/SSRF. No borrar tablas, membresías ni filas como mecanismo de reversión.

**Condición de salida:** resolver bloqueos confirmados y completar staging Supabase/HTTP, concurrencia, backup/reversión posterior a commit e historial de migraciones. Hasta entonces: BLOQUEADO para publicar o aplicar en producción; no se necesita ni se solicita autorización para producción en esta entrega.
