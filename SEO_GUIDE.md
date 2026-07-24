# Guía SEO

## Configuración permanente

- Dominio canónico efectivo: `https://viajessonoros.es` (`www` redirige permanentemente al dominio raíz).
- Idioma: español.
- Marca: Viajes Sonoros.
- `robots.txt` y `sitemap.xml` se sirven desde `public/`.
- Las páginas públicas deben incluir title único, meta description, canonical, robots, Open Graph y Twitter Cards.
- La portada declara Schema.org `Organization`, `WebSite` y `LocalBusiness`.
- Las experiencias con fecha válida deben publicarse como `Event` cuando se genere su marcado dinámico.

## Contenido y rendimiento

- Mantener textos alternativos descriptivos.
- Usar `loading="lazy"` en imágenes fuera del primer viewport.
- No aplicar lazy loading a la imagen principal/LCP.
- Conservar dimensiones o relación de aspecto para evitar saltos de diseño.
- Reutilizar imágenes locales optimizadas; evitar nuevos recursos externos.
- Mantener `preconnect` solo para orígenes realmente necesarios.

## Alta o retirada de páginas

Actualizar `public/sitemap.xml`, enlaces internos, canonical y metadatos sociales. Las páginas administrativas y de error deben usar `noindex`.

La puntuación Lighthouse debe medirse sobre producción en móvil y escritorio después de cada despliegue; no debe declararse una cifra sin una ejecución real.

## Auditoría actual

La portada y las páginas legales incluyen metadatos principales. La página de experiencias añade marcado `Event` únicamente cuando recibe fechas ISO válidas. Se proporcionan manifest, iconos, páginas 404/500, `humans.txt` y `security.txt`.

Las imágenes locales de mayor tamaño deben convertirse a formatos modernos y dimensionarse antes de poder garantizar Performance >95. Esta optimización no debe aplicarse renombrando recursos sin revisar todas sus referencias.
