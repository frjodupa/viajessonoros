# Viajes Sonoros

Landing y páginas públicas de Viajes Sonoros FEEL, orientadas a presentar experiencias de sonido, próximos eventos, instrumentos y productos.

## Stack

- HTML5.
- CSS responsive.
- JavaScript ES Modules.
- Vite 8 para desarrollo y build.
- Supabase JS 2 para base de datos y almacenamiento de imágenes.
- GitHub como repositorio.
- Vercel para despliegue.

## Estructura principal

- `index.html`: entrada de la landing.
- `src/main.js`: contenido, comportamiento y carga dinámica de experiencias.
- `src/style.css`: identidad visual y estilos responsive.
- `experiencias.html`: página pública y gestión integrada de experiencias.
- `eventos.html`: listado público alternativo de eventos.
- `admin.html` y `src/admin.html`: acceso a la administración.
- `src/admin.js`: alta de eventos e imágenes.
- `src/eventos.js`: lectura y representación de eventos.
- `src/supabase.js`: cliente compartido de Supabase.
- `public/`: imágenes, logotipos y recursos públicos.

## Supabase

Supabase gestiona la tabla `eventos` y el almacenamiento de imágenes. La configuración del cliente modular utiliza:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Estas variables deben configurarse en `.env` para desarrollo y en Vercel para producción. Sus valores no deben documentarse, publicarse ni incluirse en commits.

La página de experiencias también contempla un modo local mediante `localStorage`, con las claves `vs_eventos` y `sb_anon_key`. La landing lee la misma fuente disponible, filtra experiencias publicadas y futuras, elimina duplicados y limita el número de tarjetas.

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
- Estética espiritual premium, cálida y profesional.
- Diseño responsive para desktop, tablet y móvil.
- Los iconos deben ser SVG de calidad y WhatsApp debe conservar su identidad visual.

## Funcionamiento

- La landing presenta hero, experiencias, instrumentos, recorrido, próximos eventos, equipo, tienda, llamada final y contacto.
- Los próximos eventos de la landing se generan desde la misma fuente utilizada por la página Experiencias.
- `experiencias.html` muestra eventos y contiene un acceso de administración para crear, editar o eliminar experiencias.
- Cuando Supabase está disponible, los eventos se guardan en `eventos` y las imágenes en Storage.
- En modo local, los eventos se guardan en `localStorage`.
- Cada tarjeta construye su reserva de WhatsApp con los datos de la experiencia correspondiente.
- Las páginas públicas mantienen navegación, enlaces de contacto y comportamiento responsive.

## Archivos clave

| Archivo | Función |
| --- | --- |
| `src/main.js` | Renderizado y funcionalidad de la landing. |
| `src/style.css` | Diseño completo y responsive de la landing. |
| `src/supabase.js` | Inicialización del cliente Supabase. |
| `src/admin.js` | Creación y consulta administrativa de eventos. |
| `src/eventos.js` | Carga del listado público de eventos. |
| `experiencias.html` | Página principal de experiencias y gestión integrada. |
| `public/` | Fotografías, productos, instrumentos y logotipos. |
| `package.json` | Dependencias y scripts `dev`, `build` y `preview`. |
