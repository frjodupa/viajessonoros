# Banners informativos — referencia DRUM y adaptación aislada

## Fuente revisada (solo lectura)
Repositorio privado `frjodupa/drum-web`:
- `admin-avisos.html`: editor, imagen, estado activo, periodo de inicio/fin, botón, vista previa, plantillas y modos entry/exit/both.
- `js/admin-avisos.js`: peticiones a `/api/admin-avisos`, carga de imagen, borradores/plantillas y autenticación de DRUM.
- `js/main.js`: ventana `site-notice`, `/api/site-notice`, fechas, sessionStorage/localStorage, retraso y exit intent.
- `css/style.css`: presentación del modal.

## Trabajo implementado en rama de Viajes Sonoros
- Entrada «Banners informativos» en el administrador actual.
- `public/banners-admin.html`, `banners-admin.css` y `banners-admin.js`: formulario independiente y vista previa local, carga local de imagen, programación por fechas, disparadores, botón informativo, borrador en navegador.
- Sin dependencia de tablas de experiencias o reservas y sin cambios a sus datos.

## Bloqueos antes de activar en producción
1. Reutilizar la autenticación **de Viajes Sonoros**, con autorización real en servidor, sin copiar usuario/contraseña de DRUM.
2. Definir persistencia exclusiva para banners y RLS/GRANT mínimos en su propio esquema o tabla; no ejecutar migraciones sin autorización.
3. Crear API de lectura pública de solo banners activos, y API de administración segura con validación URL HTTPS, límites de imágenes, MIME y tamaño; alojamiento de archivos segregado.
4. Implementar runtime público compatible con Safari iPhone y Chrome/desktop: al entrar, scroll porcentual y exit intent solo desktop; botón cerrar, Escape, foco, frecuencia y accesibilidad, sin bloquear la navegación ni cookies.
5. Evitar contenido no autorizado: sanitización, sin HTML libre. Fechas con zona horaria Europe/Madrid.
6. Pruebas automáticas y en dispositivos para inicio/fin horario, cierre/sesión, scroll, salida, móvil, botones y fallback sin conexión.
7. No publicar el formulario como funcional hasta completar controles de seguridad y API. Los borradores actuales son locales **solo de prototipo**, no banners publicados.

## Aislamiento
DRUM queda intacto. No se reutilizan las rutas de DRUM, sus datos, claves, logos o estilos. Sin cambios en producción, reservas ni Supabase.
