# Auditoría técnica de privacidad

Fecha revisada: 27 de septiembre de 2026.

## Tecnologías detectadas

- Supabase Database: tabla `experiencias`.
- Supabase Auth: autenticación del gestor de experiencias.
- Supabase Storage: almacenamiento de imágenes.
- `localStorage`: almacenamiento técnico de consentimiento analítico y datos necesarios para la sesión/configuración del cliente.
- Google Analytics 4: integrado mediante `public/analytics.js`, con carga condicionada al consentimiento.
- Google Tag Manager CDN se utiliza únicamente para cargar la librería `gtag.js` después del consentimiento.
- Vercel: alojamiento y registros técnicos de acceso.
- Enlaces salientes a WhatsApp, Instagram y correo electrónico.
- Tipografías principales servidas desde el propio dominio.

## Tecnologías no detectadas en la rama principal revisada

- Meta Pixel.
- Publicidad comportamental.
- YouTube o Vimeo embebidos.
- Google Maps embebido.
- Pasarela de pago.
- Carrito de compra.
- Suscripciones automáticas.
- Publicación directa mediante Graph API de Meta/Facebook/Instagram.

## Consentimiento analítico

El sitio implementa bloqueo previo para Google Analytics 4:

1. si no existe elección guardada, se muestra el control de consentimiento;
2. GA4 no se carga mientras el consentimiento no sea `accepted`;
3. al aceptar, se carga `gtag.js` y se habilita la medición;
4. al rechazar, no se envían eventos y se intenta eliminar `_ga*`;
5. la persona puede cambiar o retirar su elección desde la política de cookies.

La política pública `public/politica-cookies.html` describe actualmente este comportamiento.

## Supabase y administración

- La administración integrada en `experiencias.html` usa Supabase Auth.
- Crear, editar y borrar experiencias requiere validar una sesión autenticada.
- La lectura pública consulta experiencias publicadas.
- Las políticas RLS y de Storage no están versionadas en el repositorio y deben verificarse en el panel de Supabase.
- Las escrituras anónimas deben permanecer denegadas.

## Conclusión

La configuración actual sí requiere mecanismo de consentimiento porque incorpora Google Analytics 4. El repositorio ya dispone de bloqueo previo y controles para aceptar, rechazar y retirar las analíticas.

La auditoría confirma que el sitio funciona como escaparate y canal de contacto: muestra importes y botones de reserva o pedido por WhatsApp, pero no integra carrito ni pasarela de pago.

Cualquier nueva integración de publicidad, Meta, contenido embebido o tecnología de seguimiento deberá volver a auditarse antes de desplegarse.
