# Propuesta local: política de previews de Viajes Sonoros

Estado: PREPARADO Y SIMULADO. NO APLICADO EN GITHUB O VERCEL.
Fecha: 4 de noviembre de 2026, Europe/Madrid.
Rama: `gitop/vercel-preview-policy-20261104`.
Base explícita: `fcde2c5fd55aab903ff17d03b2484e09488cd6c2`, coincidente con main remoto y producción observada.
Equipo: `joseduqueparedes-7366s-projects`; proyecto `viajessonoros`, `prj_g19HogAmL1XpexGzN41bXYQhfw5i`.

## Problema y alcance

La creación de previews por cada push acumula despliegues. Se conserva el cierre anterior: 12 retirados en la primera fase; 123 READY conservados (81 de PR abiertos y 42 de uso desconocido). Ninguno se elimina ni se modifica con esta propuesta.
El último almacenamiento aportado es 10,71 GB sobre 10 GB. No se dispone de medición independiente final ni del peso único de cada despliegue. Reducir generación futura no libera por sí mismo el almacenamiento ya consumido y no garantiza un techo de 10 GB. Main debe poder publicarse incluso si hay poco margen; la capacidad sigue siendo un límite externo de Vercel.
Cambios mínimos: solo `git.deploymentEnabled` en `vercel.json`, este documento y un apartado añadido a `.gitop/PROJECT_STATE.md`. Sin nuevas dependencias, scripts de build, workflows, cambios de negocio, DNS, dominios, reservas o Supabase.

## Auditoría acotada de disparadores actuales

- GitHub está enlazado a frjodupa/viajessonoros. Production Branch comprobada: main. El detalle del proyecto no contiene un Ignored Build Step personalizado. Deploy Hooks: lista vacía.
- En el commit base, vercel.json excluye únicamente gitop/domus-agenda-grupos-20261027. Las ramas no especificadas quedan permitidas por defecto. Se leyeron los vercel.json de las 17 puntas de PR abiertos: cinco ramas gitop/integral-* añaden ya su propia exclusión de seguridad; las otras 12 están habilitadas. Ser borrador no es una prueba de que Vercel no despliegue.
- `.github/workflows/validate.yml`: npm build en push a main, PR contra main y workflow_dispatch. No publica a Vercel. Permanece intacto; el CI de un PR de desarrollo sigue validando aunque no exista preview automático.
- `.github/workflows/domus-social.yml`: disparo en main para cuatro rutas y ejecución manual. Puede guardar una imagen generada con un commit y git push a main. Es una vía potencial de nuevo despliegue Git de producción; no se modifica ni se suprime. No se asume que `[skip ci]` sea una política suficiente para Vercel.
- La integración Git es el disparador de previews evaluado. Los despliegues por CLI/API, redeploys y promociones son canales oficiales distintos; esta regla no es un control de acceso ni un límite para esos canales. No se ejecutó ninguno. No se auditó el inventario de tokens personales, aplicaciones externas o credenciales de terceros, que queda fuera del alcance.
- La política se lee en el commit de cada rama. Integrarla en main NO la propaga a ramas existentes. Por ello los recuentos de ahorro son condicionales y no se afirma que una sola fusión cambie todas las ramas remotas.

## Política propuesta

1. Main: `main: true`, con prioridad semántica de cualquier coincidencia true sobre false. Se conserva la rama de producción main y no se incorpora filtro por rutas, mensajes, entorno o tipo de commit que pueda omitir una publicación necesaria.
2. Nuevas pruebas: `qa/**: true`. Desarrollo ordinario, feature/*, fix/* y gitop/* nuevos quedan sin preview automático por `**: false`. Las ramas sin slash también quedan cubiertas. La convención es minúscula; qa sin tema y QA/* no habilitan previews.
3. Transición: 12 excepciones exactas para PR abiertos actualmente habilitados. PR #16, #18 y #24 documentan pruebas/desarrollo pendientes y explican los 81 previews protegidos. Para otros nueve PR abiertos no se pudo acreditar necesidad efectiva de cada push: se preserva su comportamiento conservadoramente para no interrumpir pruebas. No se habilita nada que estuviera excluido.
4. Las cinco ramas gitop/integral-* siguen excluidas. Mantener también la exclusión histórica Domus. No crear una rama QA de seguridad para sortear estas restricciones: requiere primero cumplir sus condiciones de datos y autorización.
5. Crear un PR nuevo no anula la política por rama. Para obtener preview, el trabajo debe estar en qa/<tema> o en una excepción aprobada. Un desarrollo sin preview puede conservar su PR y CI y preparar una rama QA con el candidato completo; cualquier creación/push real queda fuera de esta tarea y requiere autorización.
6. No se renombran ramas actuales ni se cierran PR. No se borran previews ni se cambian alias. Las imágenes usadas por producción continúan disponibles.
7. Cuando un PR termine realmente QA y sus dependencias estén resueltas, retirar su excepción en una revisión futura autorizada. PR fusionado y ausencia de alias no bastan para borrar sus despliegues. No se programa eliminación automática con esa evidencia incompleta.

En patrones coincidentes, Vercel documenta que cualquier true permite el despliegue. El orden de las reglas no determina el resultado: la exclusión ** no puede anular main:true.

## PR abiertos y continuidad

| PR | Rama | Preview automático propuesto |
| --- | --- | --- |
| #64 | `gitop/integral-rpc-revocation-20261031` | NO: exclusión de seguridad ya existente |
| #63 | `gitop/integral-dependencies-20261031` | NO: exclusión de seguridad ya existente |
| #62 | `gitop/integral-security-20261031` | NO: exclusión de seguridad ya existente |
| #61 | `gitop/integral-reservas-20261031` | NO: exclusión de seguridad ya existente |
| #60 | `gitop/integral-frontend-20261031` | NO: exclusión de seguridad ya existente |
| #58 | `fix/kirtan-og-fotografia-real-20261031` | SÍ: compatibilidad conservadora; necesidad no acreditada |
| #55 | `gitop/difusion-visible-20261031` | SÍ: compatibilidad conservadora; necesidad no acreditada |
| #53 | `gitop/restore-banners-nav-20261030` | SÍ: compatibilidad conservadora; necesidad no acreditada |
| #52 | `gitop/legibilidad-difusion-premium-20261030` | SÍ: compatibilidad conservadora; necesidad no acreditada |
| #50 | `gitop/auditoria-reservas-premium-20261029` | SÍ: compatibilidad conservadora; necesidad no acreditada |
| #24 | `feature/banners-informativos-admin-20261025` | SÍ: QA documentada |
| #23 | `feature/vista-previa-pdf-asistencia-20261025` | SÍ: compatibilidad conservadora; necesidad no acreditada |
| #18 | `feature/reservas-premium-aplazamientos-20261023` | SÍ: QA documentada |
| #17 | `gitop/experiencias-actions-20261014` | SÍ: compatibilidad conservadora; necesidad no acreditada |
| #16 | `gitop/playwright-smoke-20261014` | SÍ: QA documentada |
| #4 | `feat/viajessonoros-github-script` | SÍ: compatibilidad conservadora; necesidad no acreditada |
| #1 | `codex/admin-experiencias-recientes` | SÍ: compatibilidad conservadora; necesidad no acreditada |

## Alternativas oficiales evaluadas

| Opción | Valor | Decisión |
| --- | --- | --- |
| git.deploymentEnabled por ramas | Evita disparar previews Git no deseados; sin script de build | Elegida |
| Ignored Build Step | Puede omitir builds por rutas/entorno, pero se ejecuta al entrar en BUILDING; exit 0 cancela, exit 1 construye | No añadir en esta primera versión |
| Solo construir producción | Impediría QA automática necesaria | Descartada |
| Comparar HEAD^ o filtrar solo carpetas | Puede omitir dependencias, commits múltiples o builds necesarios con historia incompleta | No introducir |
| Desactivar toda la integración Git | Rompería el flujo de publicación automática de main | Descartada |
| Retención nativa | Ya configurada 1 día cancelados, 7 días errores y previews, 30 días producción; existen excepciones | Mantener; no modificar |
| Cancelar builds antiguos | Puede evitar trabajo superado, sin asegurar purga de almacenamiento | No cambiar los defaults |
| Preview manual con CLI | Útil excepcionalmente, sujeto a autorización y condiciones de QA | Solo descrito, no ejecutado |

Ignored Build Step no se usa como barrera de almacenamiento: los cancelados siguen contando como despliegues en sus cuotas y concurrencia. Si se estudia después un script, debe permitir producción antes de cualquier diff y dejar construir ante información incompleta. Este diseño evita esa segunda puerta y conserva ignoreCommand sin definir.

## Simulación ejecutada

34 casos PASS, offline, con minimatch 10.1.1 ya disponible en la herramienta Vercel CLI; no se instaló en el proyecto. Se modeló la semántica documentada: ramas sin coincidencia permiten; cualquier coincidencia true permite. Se validó JSON y se comparó con la base para demostrar que rutas, cabeceras y demás campos no cambian.
También se comprobó que invertir el orden de las reglas no cambia ninguno de los casos y que main siempre gana al veto general. No se ejecutó npm install, npm build, código de la aplicación, requests a reservas ni pruebas de producción.
Esto es una simulación estructural de pushes, NO pushes reales ni una validación E2E del evaluador de Vercel. No se certifica ausencia de cualquier fallo externo, cambio futuro de configuración o error de sintaxis introducido después.

| Caso | Rama | Resultado esperado | Simulación |
| --- | --- | --- | --- |
| Production normal push | `main` | Permitir | PASS |
| Production docs-only push: no path filtering | `main` | Permitir | PASS |
| Production social-image bot push | `main` | Permitir | PASS |
| Production context variables missing: branch rule still permits main | `main` | Permitir | PASS |
| QA new PR | `qa/reservas` | Permitir | PASS |
| QA nested topic | `qa/domus/revision` | Permitir | PASS |
| QA hotfix testing | `qa/hotfix-prod` | Permitir | PASS |
| Development branch | `dev/reservas` | No generar preview automático | PASS |
| New feature branch | `feature/nueva-funcion` | No generar preview automático | PASS |
| New fix branch | `fix/correccion` | No generar preview automático | PASS |
| New open PR on non-QA branch: opt-in required | `feature/pr-nuevo` | No generar preview automático | PASS |
| Merged old PR branch | `gitop/domus-referencias-cortas-whatsapp-20261027` | No generar preview automático | PASS |
| Historical disabled Domus branch | `gitop/domus-agenda-grupos-20261027` | No generar preview automático | PASS |
| New integral security branch | `gitop/integral-nueva-seguridad` | No generar preview automático | PASS |
| Bare qa without topic | `qa` | No generar preview automático | PASS |
| Case-sensitive QA prefix | `QA/reservas` | No generar preview automático | PASS |
| Production-like prefix is not main | `main/experimento` | No generar preview automático | PASS |
| Existing PR #64 compatibility | `gitop/integral-rpc-revocation-20261031` | No generar preview automático | PASS |
| Existing PR #63 compatibility | `gitop/integral-dependencies-20261031` | No generar preview automático | PASS |
| Existing PR #62 compatibility | `gitop/integral-security-20261031` | No generar preview automático | PASS |
| Existing PR #61 compatibility | `gitop/integral-reservas-20261031` | No generar preview automático | PASS |
| Existing PR #60 compatibility | `gitop/integral-frontend-20261031` | No generar preview automático | PASS |
| Existing PR #58 compatibility | `fix/kirtan-og-fotografia-real-20261031` | Permitir | PASS |
| Existing PR #55 compatibility | `gitop/difusion-visible-20261031` | Permitir | PASS |
| Existing PR #53 compatibility | `gitop/restore-banners-nav-20261030` | Permitir | PASS |
| Existing PR #52 compatibility | `gitop/legibilidad-difusion-premium-20261030` | Permitir | PASS |
| Existing PR #50 compatibility | `gitop/auditoria-reservas-premium-20261029` | Permitir | PASS |
| Existing PR #24 compatibility | `feature/banners-informativos-admin-20261025` | Permitir | PASS |
| Existing PR #23 compatibility | `feature/vista-previa-pdf-asistencia-20261025` | Permitir | PASS |
| Existing PR #18 compatibility | `feature/reservas-premium-aplazamientos-20261023` | Permitir | PASS |
| Existing PR #17 compatibility | `gitop/experiencias-actions-20261014` | Permitir | PASS |
| Existing PR #16 compatibility | `gitop/playwright-smoke-20261014` | Permitir | PASS |
| Existing PR #4 compatibility | `feat/viajessonoros-github-script` | Permitir | PASS |
| Existing PR #1 compatibility | `codex/admin-experiencias-recientes` | Permitir | PASS |

## Adopción futura, todavía no autorizada

1. Revisar diff, matriz y SHA base. Si main cambió, rebasar/recrear la propuesta en otra copia aislada y repetir los checks pertinentes, sin modificar main remoto.
2. Si se autoriza una validación real, hacerla en una rama QA aislada y con recursos de prueba seguros; nunca probar enviando reservas reales. Una comprobación real de Vercel puede crear un despliegue y requiere autorización específica.
3. Aplicar a main mediante revisión y autorización expresa de publicación. Una fusión de vercel.json también puede disparar un nuevo despliegue de producción; no debe hacerse bajo la idea de que es una operación de documentación sin efecto.
4. Actualizar únicamente la política en las ramas existentes cuando se autorice cada actualización. No arrastrar funcionalidad o migraciones de main por automatismo. Mantener las exclusiones integrales. Hasta entonces sus pushes seguirán evaluando su configuración antigua.
5. Verificar en el panel main como Production Branch, las reglas por rama, la continuidad del CI y los resultados de los primeros eventos autorizados. No introducir un Ignored Build Step oculto desde el panel.

## Riesgos, ahorro y control de capacidad

- Estimación histórica condicional: 42 de 123 previews conservados (34,15 %) habrían quedado fuera del autodespliegue con esta política presente en sus ramas; los otros 81 se mantienen permitidos. No es una predicción del tráfico de commits futuro ni un ahorro medido de almacenamiento.
- No hay datos suficientes para estimar GB evitados, ahorro inmediato o tiempo hasta agotar capacidad. La deduplicación, los artefactos reales y la retención impiden derivarlo multiplicando tamaños de fuentes. Las excepciones de compatibilidad limitan el ahorro inicial.
- QA puede seguir creando un preview en cada push. Agrupar cambios por ronda de prueba y mantener un registro de ID, responsable, finalidad, dependencias y cierre de QA para previews nuevos. Esto es una recomendación operativa, no un límite técnico ya implementado.
- Revisar manualmente el consumo en Vercel antes de nuevas rondas QA. Como umbral operativo propuesto, al superar 9 GB evitar previews opcionales y priorizar resolver capacidad, sin añadir una regla que bloquee main. No supone una garantía de capacidad para producción ni requiere un producto de pago.
- Las ramas nuevas de desarrollo no tendrán URL automática; deben usar qa/<tema> para pruebas cuando corresponda. Los 12 PR actuales mantienen permiso por compatibilidad. Las ramas heredadas que no reciban el cambio seguirán pudiendo generar previews.
- Un cambio de Production Branch requiere revisar esta política primero: main es la única publicación Git de producción confirmada actualmente. Las reglas no deben reutilizarse sin revisar esa condición.
- No se puede garantizar que nunca se agoten los 10 GB manteniendo producción necesaria y los despliegues de uso incierto. Se reduce crecimiento, no se aumenta cuota ni se recupera espacio actual.

## Reversión

Ahora: no hay nada remoto que revertir; conservar la rama local y su patch para revisión o dejar de utilizarlos. No borrar automáticamente la copia o las evidencias.
Si más adelante se autoriza su integración: revertir únicamente el bloque git.deploymentEnabled de este commit en una nueva rama, preservando el resto de vercel.json y los cambios posteriores. La base exacta está en el patch y en Git. No restaurar todo el archivo si cambió después. La reversión también puede disparar despliegues; requiere autorización antes del push/merge. No hay cambios de base de datos ni datos que restaurar.
Revertir esta política reabriría los previews automáticos y su crecimiento. La aprobación debe considerar ese efecto, y revalidar las exclusiones de seguridad de cada rama para no habilitar integral-* accidentalmente.

## Evidencias y límites

Copia independiente: `/tmp/gitop-viajessonoros-preview-policy-20261104/repo`. No worktree ni objetos compartidos, referencias o enlaces duros. No se copiaron cambios sin confirmar ni secretos.
La adquisición Git pública se limitó mediante un proxy temporal de solo git-upload-pack para este repositorio; Git solo tuvo salida al puerto local dedicado. Proxy detenido tras clonar. Ediciones y simulaciones se ejecutaron con sandbox-exec, red bloqueada, escritura limitada al directorio de tarea y HOME limpio, sin lectura de /Users/jose. Las sondas de escritura externa, lectura personal y conexión externa fueron denegadas. El acceso a /dev/null se permitió como dispositivo, sin abrir escrituras a otros directorios.
Evidencias externas al repo: prepared-policy.json, open-pr-branch-configs.json, simulation-results.json, matriz-pruebas.csv, propuesta.patch y snapshot-propuesta.json. La herramienta de simulación y los perfiles se conservan en el directorio de tarea. Datos de GitHub y Vercel leídos, no modificados.
Fuentes oficiales consultadas el 4/11/2026:
- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/project-configuration/project-settings
- https://vercel.com/docs/deployment-retention
- https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel

PUBLICADO: NO. PUSH: NO. MERGE: NO. DESPLIEGUE: NO. CONFIGURACIÓN REMOTA MODIFICADA: NO.
