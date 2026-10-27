# Talleres Domus — integración independiente para revisión

Estado: PREPARADO PARA REVISIÓN. Sin migración ni publicación en producción.
Base: `4506e6f293992c6fe26e96785b8bda719fa33f33`.
Rama: `gitop/domus-agenda-grupos-20261027`.

## Alcance e independencia

Domus gestiona sus propias solicitudes, participantes, grupos, salas y clases. No utiliza las tablas, RPC ni el calendario general de experiencias. No se crea ninguna relación con `experiencias` o `reservas_whatsapp`, ni se modifica ningún registro existente.

Se reutilizan el cliente de Supabase y la autenticación del proyecto. La autorización de Domus se valida en servidor contra la cuenta administrativa verificada de `auth.users`, sin confiar en metadatos editables por usuarios. El único cambio al administrador de experiencias es un enlace dentro de su plantilla privada a «Talleres Domus». No hay enlaces nuevos en la landing ni en la navegación pública.

## Componentes implementados

- Página pública `/talleres-domus/`: mantiene las diez imágenes y el resto del contenido original. Formulario propio con contacto, teléfono, cantidad de participantes, una edad por persona, modalidad, preferencias y observaciones. Nota informativa de edades y contacto adulto obligatorio cuando hay menores. No se solicitan fechas de nacimiento.
- Registro transaccional e idempotente: una solicitud y sus participantes se guardan juntos, siempre pendientes. Los reintentos con la misma clave no crean otra inscripción. WhatsApp solo se ofrece después de recibir una referencia real; requiere pulsar el enlace y confirmar el envío en WhatsApp. El mensaje público omite las edades.
- Administrador privado `/talleres-domus/admin.html`: reservas y estados, edición de contactos y participantes, grupos y estados propios, asignación y traslado entre grupos, pertenencia múltiple conservando la reserva original, salas y ajustes.
- Agenda exclusivamente Domus con vistas mensual, semanal y listado, navegación, fines de semana diferenciados, inicio del taller, duración, clases pendientes/confirmadas/canceladas, ocupaciones de sala y publicación por clase. Aplazar actualiza la misma clase y la devuelve a pendiente. Cancelar un grupo cancela sus clases y retira su publicación.
- Control de solapamientos en PostgreSQL mediante exclusiones de sala y grupo, incluidas las sesiones pendientes. Horarios contiguos permitidos; cancelaciones liberan el intervalo. Zona horaria `Europe/Madrid`, con rechazo de horas inexistentes durante el cambio de hora y control de edición concurrente.
- El calendario público consulta las mismas filas de clases que el administrador. Solo muestra clases confirmadas, marcadas para publicar, de un grupo confirmado o activo y una sala activa. No muestra nombres de grupos privados, contactos, participantes, edades ni notas privadas.
- WhatsApp individual: inscripción, grupo formado, calendario confirmado, primera clase, cambio de horario, cancelación y ubicación. Mensajes editables y sin envíos automáticos. No se activa WhatsApp Business Platform.
- Exportación del periodo filtrado en CSV/ICS e impresión. Incluye grupos, fechas, horarios, estados, lugar y profesor; omite participantes, edades, teléfonos y notas privadas. El CSV neutraliza fórmulas y el ICS conserva UTC, estados y plegado UTF-8.
- Edades orientativas configurables por organización y grupo; no bloquean la asignación. El máximo de participantes por solicitud también es configurable.

## Base de datos y permisos

Migración pendiente: `supabase/migrations/20261027152110_domus_independent_agenda.sql`.

SHA-256: `46fc1b2f33029098686c4c0e7bd7e43b34db324273593001aecc2f575e0fc633`.

Tablas nuevas, todas con RLS:

| Tabla | Función |
| --- | --- |
| `domus_reservas` | Contacto y solicitud propia, estados e idempotencia |
| `domus_participantes` | Edad y referencia de cada persona, reserva original inmutable |
| `domus_grupos` | Tipo, modalidad, estado, horario y profesor |
| `domus_grupos_participantes` | Relación múltiple y conservación de asignaciones retiradas |
| `domus_clases` | Agenda única, ocupación, confirmación y publicación |
| `domus_salas` | Salas propias y disponibilidad administrativa |
| `domus_config` | Ubicación, profesor y criterios orientativos configurables |

RPC públicos limitados: `domus_registrar` y `domus_calendario`. No se otorga acceso anónimo a las tablas. Las funciones con privilegios necesarios están en `domus_private`, con `search_path` vacío y permisos explícitos. La capacidad anónima de registro solo permite insertar solicitudes validadas y pendientes, sin leer datos personales ni elegir estados o grupos.

RPC administrativos: `domus_admin_datos`, `domus_mover_participante` y `domus_guardar_clase`, restringidos a administración autenticada. Las escrituras por tabla también están protegidas por RLS. No se conceden permisos de borrado a clientes.

Impacto adicional: instala `btree_gist` en el esquema `extensions` para impedir solapamientos incluso con escrituras concurrentes. No cambia extensiones existentes ni las políticas del sistema A. Toda la migración está dentro de una transacción.

## Archivos de la integración

- `public/talleres-domus/index.html`, `public/talleres-domus/admin.html`.
- `src/domus-public.js`, `src/domus-admin.js`, `src/domus-core.js`, `src/domus-calendar.css`, `src/domus-admin.css`.
- `experiencias.html`: únicamente el enlace privado a Domus.
- `vite.config.js`, `scripts/validate-domus-build.mjs`: empaquetado de ambas rutas y validación de sus módulos y recursos.
- `package.json`, `package-lock.json`: dependencia de pruebas PGlite fijada y comandos de validación; no se actualizan dependencias existentes.
- Migración indicada y `supabase/domus-rollback.sql`.
- Pruebas `tests/domus-*`, esta ficha y `.gitop/PROJECT_STATE.md`.

## Auditoría inicial concreta

Se verificaron en lectura el administrador existente (`experiencias.html#admin` y `reservas-premium.html`), los formularios, los estados y las columnas, restricciones, disparadores y RLS de las tablas afectadas del proyecto Supabase. La agenda existente de experiencias usa `experiencias`; no se encontró una tabla de clases o grupos Domus. Los ZIP aportados eran prototipos locales sin persistencia compartida. La página independiente ya estaba publicada desde el commit base.

La integración no hereda las políticas generales de experiencias. No se han corregido ni refactorizado módulos ajenos al alcance.

## Validación

- `npm run test:domus`: 28 pruebas correctas, cero fallos. Motor PostgreSQL PGlite aislado, con roles `anon`/`authenticated`, autenticación sintética, RLS, exclusiones, disparadores y migración reales. Datos exclusivamente sintéticos. Incluye idempotencia, validación de edades y adulto responsable, cuenta no administradora, asignaciones, conservación de reserva, publicación selectiva, cambios de hora, conflictos, cancelaciones y reversión.
- Chrome Headless aislado: formulario con tres edades → registro SQL → acceso privado → dos grupos → asignación, traslado y pertenencia múltiple → clase pública → rechazo de solapamiento → calendario anónimo → exportación/impresión → siete comunicaciones → aplazamiento, reconfirmación y cancelación → cierre de sesión. Sin mensajes enviados.
- Vistas de 390, 820 y 1440 píxeles sin desbordamiento horizontal. Imágenes decodificadas por Chrome y capturas revisadas. Esto no sustituye una prueba física en Safari de iPhone/iPad.
- CSV/ICS: contenido de los Blob reales validado; eventos de inicio de descarga comprobados. El sandbox de macOS cancela los temporales nativos de Chrome: se capturó el contenido por CDP para comprobar y conservar los archivos. No se declara probada la escritura nativa de descargas en Safari o fuera del sandbox.
- PDF generado desde la vista de impresión, sin datos de participantes.
- Compilación final de Vite correcta, con comprobación posterior de que ambas rutas incluyen módulos compilados y recursos existentes. Se corrigió una incidencia de empaquetado de HTML en `public/`; la validación posterior impide publicar ese resultado incompleto.
- Las diez imágenes originales se conservan sin cambios. `git diff --check` sin errores. El control de alcance conserva la landing, la navegación pública, las reservas generales y las políticas existentes.

## Reproducción local sin producción

```bash
npm ci --ignore-scripts
npm run test:domus
```

El recorrido de navegador utiliza `tests/domus-browser-server.mjs`: rechaza cualquier URL de Supabase distinta del adaptador local `http://127.0.0.1:18745/__db`. No acepta claves de producción. Arrancar con `VITE_SUPABASE_URL` apuntando a ese adaptador y una clave ficticia; utilizar un perfil de navegador nuevo. Para servir los artefactos compilados, añadir `DOMUS_TEST_DIST=1`.

`tests/domus-browser-check.cjs` requiere `DOMUS_CHROME_BIN` y `DOMUS_ARTIFACT_DIR`, ambos de un entorno aislado. El navegador no envía mensajes de WhatsApp y usa una base sintética nueva. La compilación local de validación se realiza con variables ficticias; sus artefactos no deben desplegarse a producción.

## Pendiente de autorización

1. Revisar esta rama y la migración exacta. No se aplica automáticamente ni se fusiona en `main`.
2. Autorizar expresamente la migración en el proyecto Supabase de Viajes Sonoros y la publicación de esta integración independiente.
3. Tras la autorización, volver a comprobar el destino y que no existen tablas Domus incompatibles; aplicar la migración revisada y construir/desplegar desde el código fuente con la configuración existente del proyecto.
4. Comprobar las rutas públicas y el acceso del administrador tras activar la integración. Antes de aplicar la migración, el administrador y formulario nuevos informan de que el módulo todavía no está activado y no simulan reservas guardadas.

No se ha escrito en Supabase de producción, no se ha fusionado en `main`, no se han enviado comunicaciones y no se ha publicado esta integración en el dominio principal.

## Reversión

`supabase/domus-rollback.sql` revierte una instalación vacía y se ha probado en la base sintética. Se detiene si ya hay solicitudes, grupos o clases para evitar borrar datos. Tras recibir inscripciones reales, la reversión exige una exportación/copia y revisión específica; no debe ejecutarse de forma automática. Conserva `btree_gist` por si otros módulos lo reutilizan.

El código puede volver al commit base sin tocar el sistema A. Las copias y ramas de trabajo se conservan; el árbol original del usuario permanece intacto.


## Corrección final de PR #39 — conformidad sobre `2c05735`

Estado: PROBADO en entorno aislado. Sin migraciones ni despliegues.

| Punto solicitado | Resultado verificado |
| --- | --- |
| Nombre individual | El formulario genera un nombre y una edad por participante. En modalidad infantil identifica al padre/madre/tutor y su WhatsApp. Los nombres reales se guardan y aparecen en la ficha, grupos y comunicaciones propias. Se conserva la nota de edades. |
| Importes automáticos | Clase suelta 30 €, bono 4 clases 100 €, bono 8 clases 180 €, siempre por participante. El formulario actualiza el precio y el total. PostgreSQL calcula y guarda paquete, precio individual y total, y rechaza importes alterados. Para tres personas: 90 €, 300 € o 540 €. |
| WhatsApp directo | Cada ficha contiene «Enviar WhatsApp», dirigido al teléfono de contacto guardado. Incluye código, contacto, nombres propios de esa reserva, modalidad/paquete, importes, estado, grupos y horarios/salas de clases confirmadas. Si no hay fechas usa «Fechas y horarios pendientes de confirmación». No incluye otros participantes ni marca envíos. |

Archivos corregidos: `public/talleres-domus/index.html`; `src/domus-public.js`, `src/domus-admin.js`, `src/domus-core.js`, `src/domus-calendar.css`; cuatro archivos de pruebas Domus, esta ficha y `.gitop/PROJECT_STATE.md`.

Migración adicional pendiente: `supabase/migrations/20261027161840_domus_names_prices_whatsapp.sql`, después de la migración inicial. SHA-256: `fb5b7b915a7057fb2347272f19bfaeaa74fff6a2a7e24b8d478cb50813ec49e9`. Añade únicamente `paquete`, `precio_unitario` e `importe_total` a `domus_reservas`, restricciones de integridad y la recepción validada de nombres en el RPC propio. No crea tablas nuevas, relaciones con experiencias ni permisos públicos de lectura. Las políticas RLS existentes se conservan.

Registros anteriores: si existieran solicitudes del prototipo, se mantienen intactas. No se inventan nombres ni cargos históricos; sus importes ausentes se muestran como «Sin importe registrado». La recepción nueva exige nombres reales y paquete. La reversión vacía del módulo continúa validada; con datos se detiene para protegerlos.

Pruebas: `npm run test:domus` — 28 correctas, cero fallos. Incluye los tres paquetes con 1/2/3 personas, nombres obligatorios, idempotencia, importes manipulados, privacidad de mensajes, permisos y regresiones de reservas/grupos/calendario directamente relacionadas. Compilación local correcta y validación de ambas rutas. Navegador sobre artefactos compilados con `DOMUS_CORRECTIONS_ONLY=1`: tres menores con nombre/edad y tutor; total persistido de 300 €; propagación a grupos; enlace individual al WhatsApp registrado; datos guardados, precios y fechas confirmadas; aviso sin fechas. Cero errores JavaScript y vista de 390 px sin desbordamiento. No se abre ni se envía WhatsApp durante las pruebas.

Control de alcance: landing, `experiencias.html`, reservas y calendario general, cliente Supabase y políticas del sistema A idénticos al commit `2c05735`. `vercel.json` incorpora únicamente `git.deploymentEnabled` en `false` para `gitop/domus-agenda-grupos-20261027`, evitando que actualizar la PR publique otra vista previa; las demás ramas conservan su comportamiento. No se modifica la configuración remota de Vercel.

Sin bloqueos funcionales detectados en estos tres puntos dentro del entorno probado. Producción permanece sin cambios y no se solicita autorización de publicación en esta entrega.
