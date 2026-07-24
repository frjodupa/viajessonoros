# Viajes Sonoros - Checklist de Calidad

## OBJETIVO

Antes de considerar terminada cualquier tarea, el agente debe comprobar TODOS los puntos de este documento.

No finalizar nunca una tarea si algún punto obligatorio falla.

---

# 1. Arquitectura

- [ ] Se ha leído PROJECT_BRIEF.md.
- [ ] Se han leído AI_RULES.md.
- [ ] Se ha leído AGENT_WORKFLOW.md.
- [ ] Se respetan todas las reglas del proyecto.
- [ ] No se ha modificado la arquitectura sin autorización.

---

# 2. Consumo de créditos

- [ ] Se han analizado únicamente los archivos necesarios.
- [ ] No se ha releído todo el proyecto.
- [ ] No se ha generado código innecesario.
- [ ] No se han hecho refactorizaciones no solicitadas.
- [ ] Se ha reutilizado código existente.
- [ ] Se ha realizado el menor número posible de modificaciones.

---

# 3. Calidad del código

- [ ] Sin errores de sintaxis.
- [ ] Sin imports innecesarios.
- [ ] Sin variables sin usar.
- [ ] Sin funciones duplicadas.
- [ ] Sin componentes duplicados.
- [ ] Sin código muerto.
- [ ] Sin archivos huérfanos.

---

# 4. Diseño

- [ ] Se mantiene la identidad visual.
- [ ] Logos intactos.
- [ ] Tipografía intacta.
- [ ] Paleta intacta.
- [ ] Responsive correcto.
- [ ] Accesibilidad correcta.

---

# 5. SEO

- [ ] Title correcto.
- [ ] Meta Description.
- [ ] Canonical.
- [ ] Open Graph.
- [ ] Twitter Cards.
- [ ] Schema.org.
- [ ] sitemap.xml actualizado.
- [ ] robots.txt correcto.
- [ ] ALT en imágenes.
- [ ] URLs limpias.

---

# 6. Rendimiento

- [ ] Lazy Loading.
- [ ] Imágenes optimizadas.
- [ ] CSS optimizado.
- [ ] JS optimizado.
- [ ] Bundle optimizado.
- [ ] Sin recursos innecesarios.

Objetivo:

- Lighthouse Performance >95

---

# 7. Seguridad

- [ ] Variables privadas protegidas.
- [ ] Solo variables VITE públicas.
- [ ] Sin secretos en cliente.
- [ ] CSP configurada.
- [ ] HSTS.
- [ ] XSS revisado.
- [ ] Validación de formularios.
- [ ] Sanitización de entradas.
- [ ] Supabase RLS correcto.

---

# 8. Base de datos

- [ ] No se duplican datos.
- [ ] Se reutiliza la tabla existente.
- [ ] Landing y Experiencias usan la misma fuente.
- [ ] Consultas optimizadas.

---

# 9. Build

Ejecutar:

npm run build

Comprobar:

- [ ] Build correcto.
- [ ] Sin warnings importantes.
- [ ] Sin errores.

---

# 10. Git

Si el build es correcto:

git add .

git commit -m "mensaje breve"

git push origin main

Comprobar:

- [ ] Commit correcto.
- [ ] Push correcto.
- [ ] Rama main.

---

# 11. Vercel

Esperar:

Deployment completo.

Comprobar:

- [ ] Deployment correcto.
- [ ] Sin errores.
- [ ] Dominio operativo.
- [ ] HTTPS operativo.

---

# 12. Producción

Comprobar:

- [ ] viajessonoros.es carga.
- [ ] www.viajessonoros.es carga.
- [ ] Consola sin errores.
- [ ] Supabase operativo.
- [ ] Formularios funcionan.
- [ ] Eventos funcionan.
- [ ] Administración funciona.

---

# 13. Informe final

Responder únicamente con:

## Archivos modificados

...

## Build

✅ / ❌

## Git

✅ / ❌

## GitHub

✅ / ❌

## Vercel

✅ / ❌

## Dominio

✅ / ❌

## Observaciones

...

---

# REGLA FINAL

La tarea NO se considera terminada hasta que:

✅ Build correcto

✅ Git actualizado

✅ GitHub actualizado

✅ Vercel desplegado

✅ Dominio operativo

✅ Sin errores de consola

✅ Checklist completo

Si cualquiera de estos puntos falla, continuar trabajando automáticamente hasta resolverlo.

FIN
