# Seguridad de Viajes Sonoros

Auditoría: 19 de agosto de 2026.

## Controles activos

- HTTPS y HSTS.
- CSP, Referrer-Policy y Permissions-Policy.
- `X-Frame-Options: DENY` y `X-Content-Type-Options: nosniff`.
- Variables de cliente limitadas a `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- `.env` excluido del repositorio.
- Escapado de datos dinámicos en las tarjetas de la landing.
- Sin analítica, píxeles, publicidad ni cookies de seguimiento.

## Servicios y almacenamiento

- Supabase: tabla y almacenamiento de experiencias.
- `localStorage`: `vs_eventos` y `sb_anon_key`, ambos de finalidad técnica.
- Las tipografías y los scripts se alojan localmente; Supabase es la única conexión externa de datos.
- No se detecta `sessionStorage`.

## Verificaciones pendientes fuera del repositorio

- Las políticas RLS y CORS del proyecto Supabase no están versionadas; deben verificarse en el panel de Supabase.
- Las escrituras anónimas sobre `eventos` y el bucket `eventos` deben estar denegadas.
- La administración debe usar Supabase Auth y políticas basadas en usuario/rol antes de considerarse segura.

## Resultado de auditoría

- Cookies propias o de terceros creadas por el código: no detectadas.
- Analítica, publicidad, píxeles, mapas o vídeos embebidos: no detectados.
- `localStorage`: uso técnico de `vs_eventos` y `sb_anon_key`.
- `sessionStorage`: no detectado.
- Scripts externos: no detectados.
- Fuentes externas: no; Cormorant Garamond y Montserrat se sirven desde el propio dominio.
- Dependencias npm: 0 vulnerabilidades conocidas en `npm audit`.
- Secretos privados versionados: no detectados; `.env` está ignorado.
- Cabeceras: CSP, HSTS, Referrer-Policy, Permissions-Policy, X-Frame-Options y X-Content-Type-Options configuradas.
- Sanitización: la landing escapa los datos dinámicos; la página pública de experiencias ha incorporado escapado de texto, validación de URL e identificadores.
- Supabase: el frontend utiliza únicamente la URL del proyecto y la clave anónima mediante variables `VITE_*`; RLS y las políticas del bucket deben verificarse manualmente en el panel.

## Riesgo conocido

Las páginas administrativas heredadas contienen una comprobación de contraseña en JavaScript cliente. Esa comprobación no protege la base de datos y no debe considerarse autenticación. No deben habilitarse escrituras públicas hasta sustituirla por autenticación de servidor/Supabase Auth y confirmar RLS.

No se publicarán claves `service_role`, secretos privados, contraseñas ni tokens de administración.
