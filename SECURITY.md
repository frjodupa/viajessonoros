# Seguridad de Viajes Sonoros

Auditoría revisada: 27 de septiembre de 2026.

## Controles activos

- HTTPS y HSTS.
- CSP, Referrer-Policy y Permissions-Policy.
- `X-Frame-Options: DENY` y `X-Content-Type-Options: nosniff`.
- Variables de cliente limitadas a `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- `.env` excluido del repositorio.
- Escapado de datos dinámicos en la landing y en la página pública de experiencias.
- Supabase Auth para el acceso administrativo del gestor de experiencias.
- Las operaciones de crear, editar y borrar experiencias comprueban una sesión autenticada válida antes de escribir.

## Servicios y almacenamiento

- Supabase Database: tabla `experiencias`.
- Supabase Auth: autenticación del gestor.
- Supabase Storage: imágenes de experiencias.
- Google Analytics 4 se carga únicamente después de consentimiento expreso mediante el sistema de preferencias de analítica.
- Las tipografías principales se sirven desde el propio dominio.

## Verificaciones pendientes fuera del repositorio

- Las políticas RLS del proyecto Supabase no están versionadas y deben verificarse en el panel de Supabase.
- Las políticas del bucket de Storage deben impedir escrituras anónimas y limitar las escrituras a usuarios autorizados.
- Debe verificarse que las políticas de `experiencias` permiten lectura pública solo de los datos necesarios y escritura únicamente a usuarios autenticados autorizados.
- Cualquier futura integración con Meta/Facebook/Instagram debe usar secretos del lado servidor; nunca tokens administrativos expuestos en el frontend.

## Estado comprobado en el código

- La administración actual ya no depende de una contraseña JavaScript embebida: utiliza `supabase.auth.signInWithPassword()`, `getSession()` y `getUser()`.
- Las altas y modificaciones escriben en `experiencias`.
- El borrado usa `delete().eq('id', id)` después de validar la sesión.
- La landing consulta únicamente experiencias con `publicado = true`.
- La página pública valida y escapa texto, URLs e identificadores antes de renderizar contenido dinámico.
- No se han detectado secretos `service_role` versionados en el código revisado.
- La rama principal actual no contiene una integración directa de publicación con la Graph API de Meta.

## Riesgos y seguimiento

1. **RLS y Storage**: son el principal control que no puede confirmarse solo desde el repositorio.
2. **Documentación antigua**: se ha corregido la referencia obsoleta a la tabla `eventos` y a páginas administrativas que ya no forman parte de la arquitectura actual.
3. **Integraciones externas**: cualquier automatización futura de redes sociales debe aislarse del gestor de experiencias y procesar un único ID seleccionado por operación.
4. **Secretos**: no se publicarán claves `service_role`, tokens privados, contraseñas ni secretos de administración.
