# Estado de proyecto — viajessonoros

- Identidad: Viajes Sonoros — web de experiencias y reservas
- Fuente de verdad: este repositorio, sus commits, issues y recursos oficiales.
- Última instalación de reglas: 2026-10-16 (GITOP 2.0).
- Versión estable actual: POR VERIFICAR. No asumir que main equivale a producción.
- Funciones protegidas: POR INVENTARIAR con evidencia. No sobrescribir recursos aprobados.
- Incidencias: ver `.gitop/incidents.json`. No marcar como resueltas sin prueba.
- Próximo paso: auditoría de solo lectura; identificar problemas y pruebas existentes antes de modificar código.
- Despliegue autorizado: NO.

## Talleres Domus — 2026-10-27

- Estado: PREPARADO PARA REVISIÓN en `gitop/domus-agenda-grupos-20261027`, base `4506e6f293992c6fe26e96785b8bda719fa33f33`.
- Arquitectura: reservas, participantes, grupos, salas y clases propios (`domus_*`), sin relaciones con reservas ni experiencias generales. Solo se reutilizan autenticación y componentes comunes seguros.
- Alcance protegido: landing y navegación pública intactas; calendario y reservas de experiencias sin cambios. Un enlace añadido exclusivamente dentro de la plantilla privada del administrador.
- Pruebas: 22 pruebas de PostgreSQL/seguridad correctas y recorrido de navegador con datos sintéticos, perfiles aislados y vistas de 390/820/1440 px. Compilación y empaquetado de ambas rutas verificados.
- Migración: `supabase/migrations/20261027152110_domus_independent_agenda.sql`, preparada y no aplicada a producción. Reversión protegida contra borrado de datos reales.
- Ruta privada preparada: `/talleres-domus/admin.html`.
- Publicación y migración de producción: requieren autorización expresa del usuario. Sin cambios de datos ni despliegue en producción en esta intervención.
- Informe, límites de pruebas y activación: `docs/DOMUS_INTEGRACION.md`.


### Corrección final PR #39

- Base de esta corrección: `2c0573547cd699005c80040e9ff9d8c0cccf79fd`; se continúa la rama existente.
- PROBADO: nombres individuales de participantes, tutor/contacto separado, paquete e importes calculados y validados en servidor, WhatsApp directo por reserva con datos propios y clases confirmadas.
- Pruebas: 28 correctas; recorrido de navegador limitado a estas correcciones y regresiones relacionadas sobre el compilado, sin errores JS. Compilación y validación de rutas correctas.
- Migración adicional: `20261027161840_domus_names_prices_whatsapp.sql`, pendiente. RLS y aislamiento del sistema A conservados; sin nombres ni importes históricos inventados.
- Autodespliegue excluido solo en esta rama mediante `vercel.json`. No se aplican migraciones ni se despliega. No se solicita autorización de publicación.
- Informe: `docs/DOMUS_INTEGRACION.md`, apartado Corrección final PR #39.


## Landing premium — 28 de octubre de 2026

HECHO: rama local gitop/landing-premium-20261028, base main edcda4e. Copia independiente /tmp/gitop-landing-premium-w3QS8v/repo; original y cambios sin confirmar intactos.

Cambios: src/main.js y nuevo src/landing-premium.css, importado únicamente en la landing. Portada con fotografía original y violeta profundo; capítulos en verde bosque suave, azul mineral, rosa y lino. Se unifican introducción y descripción local conservando Cáceres/Extremadura y servicios. La difusión se integra en la agenda; modalidades privadas, proceso y guía de compra se compactan en desplegables. Se retiran el banner de productos redundante y la llamada final repetida. Precios, productos, reseñas, navegación y funciones comerciales conservados.

PROBADO: navegador Chromium aislado, datos sintéticos y conexiones exteriores bloqueadas; un h1, IDs únicos, enlaces de navegación válidos, tres desplegables, menú móvil y detalle de productos operativos, imágenes cargadas, cero excepciones JS. Sin desbordamientos a 390 y 1440 px. Revisión visual y contraste de portada/meditación. Una única ejecución npm run build correcta, incluidas validaciones prebuild y postbuild. La prueba de navegador se realizó sobre Vite dev, no sobre un despliegue. No se han probado conexiones reales de Supabase ni reservas reales.

Evidencias: ../artifacts/landing-results.json, ../artifacts/landing-desktop.png, ../artifacts/landing-mobile.png, ../artifacts/mobile-hero.png y ../build.log. Scripts locales conservados en ../artifacts; si se reutilizan, ejecutar desde la copia con las dependencias y el perfil de aislamiento indicados en los logs.

PENDIENTE: revisión y autorización de publicación. Sin push, fusión ni despliegue. Sin cambios en Supabase, reservas, experiencias.html ni Talleres Domus. Reversión: descartar el commit local de esta mejora sin intervenir en main ni en el original.


### Recuperación y PR de landing — 30 de octubre de 2026

HECHO: remoto confirmado https://github.com/frjodupa/viajessonoros.git. Commit original 1a887e0a934ffd384f7f85fe3ab748c313b20d3a conservado como ancestro. Rama gitop/landing-premium-20261028 actualizada sin reescritura con main 502f1f174de05507b3e50ac2b46841192ea1c47b; se conservan las mejoras de compartir Domus.
PROBADO: única compilación final de esta intervención (npm run build, prebuild y postbuild), correcta. Navegador sobre dist aislado y datos sintéticos: 390/1440 px sin desbordamiento, cero excepciones JS, imágenes cargadas, menú móvil, tres desplegables, anclas e IDs y detalle de producto correctos. Evidencias ../final-build.log y ../artifacts/final/landing-results.json. Las pruebas no envían reservas ni acceden a Supabase real.
ALCANCE: diff hacia main limitado a src/main.js, src/landing-premium.css y esta ficha. Resto de archivos idénticos a main: reservas, Domus, páginas de terapias, administración, Supabase y configuración de despliegue. Las modalidades privadas de la landing permanecen accesibles en un desplegable.
DESPLIEGUE: GitHub conectado al proyecto Vercel viajessonoros (prj_g19HogAmL1XpexGzN41bXYQhfw5i), Vite/Node 24.x. Rama no excluida de previews. Sin fusión ni promoción a producción. Producción observada READY: dpl_Chy7PLJR15BhmYwaQ1fRYHAPjzJG, main 502f1f1; conservarlo como referencia de reversión. En una publicación posterior autorizada, comprobar el despliegue candidato antes de asignar dominio; ante fallo, restaurar ese despliegue mediante rollback, verificando antes que sigue siendo la versión anterior correcta. No se ensaya una reversión en producción.
PENDIENTE EN ESTE COMMIT: subida autorizada de rama y creación de PR hacia main; verificación del despliegue preview y URL de PR se registran en su descripción y en el informe local final para evitar otro despliegue solo por documentación. No fusionar automáticamente.
