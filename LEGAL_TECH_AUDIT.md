# Auditoría técnica de privacidad

Fecha: 24 de julio de 2026.

## Tecnologías detectadas

- `localStorage`: claves técnicas `vs_eventos` y `sb_anon_key`.
- Supabase: base de datos, almacenamiento y conexión en tiempo real.
- Google Fonts: carga externa de tipografías.
- esm.sh: carga externa del módulo de Supabase en `experiencias.html`.
- Vercel: alojamiento y registros técnicos de acceso.
- Enlaces salientes a WhatsApp, Instagram y correo electrónico.
- Una imagen remota de Unsplash utilizada únicamente como respaldo local en `experiencias.html`.

## Tecnologías no detectadas

- Cookies propias creadas por el código.
- Cookies analíticas, publicitarias o de seguimiento.
- `sessionStorage`.
- Google Analytics o Google Tag Manager.
- Meta Pixel.
- YouTube, Vimeo o Google Maps.
- Iframes o gestores de consentimiento previos.

## Conclusión

No es necesario un banner de consentimiento mientras se mantenga esta configuración. El almacenamiento local detectado es técnico y no se utiliza para seguimiento. Si se incorporan analítica, publicidad, contenido embebido o cualquier tecnología no esencial, deberá implantarse bloqueo previo y un mecanismo para aceptar, rechazar, configurar y retirar el consentimiento.

La auditoría confirma que no existen suscripciones, publicidad, carrito ni pasarela de pago. Sí se muestran importes y botones de reserva o pedido por WhatsApp: el sitio funciona como escaparate y canal de contacto, mientras que cualquier confirmación o aportación se gestiona fuera de la web.
