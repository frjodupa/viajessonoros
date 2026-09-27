# Viajes Sonoros

Landing y páginas públicas de Viajes Sonoros FEEL, orientadas a presentar experiencias de sonido, próximos eventos, instrumentos y productos.

## Stack

- HTML5.
- CSS responsive.
- JavaScript ES Modules.
- Vite 8 para desarrollo y build.
- Supabase JS 2 para base de datos, autenticación y almacenamiento de imágenes.
- GitHub como repositorio.
- Vercel para despliegue.

## Estructura principal

- `index.html`: entrada de la landing.
- `src/main.js`: contenido, comportamiento y carga dinámica de experiencias.
- `src/style.css`: identidad visual y estilos responsive.
- `experiencias.html`: página pública de experiencias y gestión administrativa integrada.
- `src/experience-detail.js`: detalle accesible de experiencias.
- `src/experience-creation-assistant.js`: asistente de creación de borradores.
- `src/admin-image-optimizer.js`: optimización y encuadre de imágenes.
- `src/supabase.js`: cliente compartido de Supabase.
- `public/`: imágenes, logotipos y recursos públicos.

## Supabase

Supabase gestiona actualmente:

- la tabla `experiencias`;
- Supabase Auth para el acceso administrativo;
- Storage para las imágenes de experiencias.

La configuración del cliente utiliza:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Estas variables deben configurarse en `.env` para desarrollo y en Vercel para producción. Sus valores no deben documentarse, publicarse ni incluirse en commits.

Las políticas RLS y las políticas de Storage forman parte de la seguridad real del sistema y deben mantenerse con mínimos privilegios. Las operaciones de alta, edición y borrado desde el gestor requieren una sesión autenticada válida.

## Repositorio y despliegue

- GitHub: `https://github.com/frjodupa/viajessonoros.git`
- Rama principal: `main`
- Despliegue: automático de GitHub a Vercel después de cada push válido a `main`.
- Dominios: `viajessonoros.es` y `www.viajessonoros.es`.

## Identidad visual

- Fondo crema y blancos rotos.
- Morado corporativo como color principal.
- Detalles y líneas doradas.
- Tipografía serif elegante combinada con sans serif legible.
- Mucho espacio en blanco, bordes suaves y sombras discretas.
- Estética premium, cálida, humana y profesional.
- Diseño responsive para desktop, tablet y móvil.
- Los iconos deben ser SVG de calidad y WhatsApp debe conservar su identidad visual.
- El logo oficial no debe redibujarse, reinterpretarse ni sustituirse.

## Funcionamiento

- La landing presenta hero, experiencias, instrumentos, recorrido, próximos eventos, equipo, tienda, llamada final y contacto.
- Los próximos eventos de la landing se leen desde la tabla `experiencias`, filtrando únicamente registros publicados y próximos.
- `experiencias.html` contiene la vista pública y un acceso administrativo autenticado para crear, editar o borrar experiencias.
- Las imágenes se guardan en Supabase Storage y se optimizan antes de su uso cuando procede.
- Cada tarjeta construye su reserva de WhatsApp con los datos de su propia experiencia.
- Las páginas públicas mantienen navegación, enlaces de contacto, SEO técnico y comportamiento responsive.
- No existe en la rama principal actual una integración de publicación directa con la API de Meta/Facebook/Instagram.

## Archivos clave

| Archivo | Función |
| --- | --- |
| `src/main.js` | Renderizado y funcionalidad de la landing. |
| `src/style.css` | Diseño completo y responsive de la landing. |
| `src/supabase.js` | Inicialización del cliente Supabase. |
| `experiencias.html` | Página pública y gestión administrativa integrada de experiencias. |
| `src/experience-detail.js` | Modal/detalle de experiencias. |
| `src/experience-creation-assistant.js` | Generación de borradores de experiencias. |
| `src/admin-image-optimizer.js` | Optimización de imágenes de experiencias. |
| `public/` | Fotografías, productos, instrumentos, logotipos y recursos públicos. |
| `package.json` | Dependencias y scripts `dev`, `build` y `preview`. |
