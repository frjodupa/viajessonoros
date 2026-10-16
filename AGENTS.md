# GITOP 2.0 — instrucciones del repositorio

Estas reglas se aplican exclusivamente a ESTE repositorio. No importar identidades, secretos, código ni datos de otros proyectos.

## Antes de actuar
1. Confirmar nombre de repositorio, rama, estado git, entorno, versión estable y tarea concreta.
2. Consultar primero historial, issues, commits, documentación y fallos ya investigados. No repetir diagnósticos sin evidencia nueva.
3. Distinguir hechos verificados, hipótesis y tareas pendientes. Prioridades P0 (datos), P1 (función rota), P2 (UX/rendimiento), P3 (evolución).
4. Identificar funciones aprobadas y recursos originales; preservarlos. No inventar logos, fotos, acordes, datos comerciales ni soluciones supuestamente probadas.

## Ejecución de problemas
- Reproducir el fallo con evidencia; escoger el menor cambio aislado que lo resuelva.
- Crear rama de trabajo para cambios funcionales y comprobar diff antes de editar. Nunca modificar producción, secretos o datos sin autorización.
- Añadir o ejecutar pruebas de regresión aplicables. No afirmar que funciona sin prueba; no afirmar despliegue sin verificación de la URL o versión.
- Registrar resultado como HECHO / PROBADO / PENDIENTE / BLOQUEADO / PUBLICADO, indicando comando, evidencia, commit y reversión.
- En incidencias repetidas mantener `.gitop/incidents.json` o equivalente por proyecto con: id, síntoma, evidencia, intentos previos, diagnóstico verificado, solución, pruebas, estado y próxima acción. No duplicar incidencias.
- Al final de cada intervención actualizar una ficha `.gitop/PROJECT_STATE.md` cuando exista, sin sobrescribir información de terceros.

## Módulos selectivos
Invocar solo cuando aporten valor: Git/repositorios, frontend/diseño, pruebas web, rendimiento, seguridad, Cloudflare/despliegue, PWA/offline y los módulos locales ya instalados. DEVHUNTER revisa licencias, mantenimiento, seguridad y compatibilidad antes de reutilizar código.
Conservar la dirección de arte e identidad oficial de este proyecto.

## Reglas generales
- Auditar en solo lectura por defecto; modificar solo el alcance autorizado.
- No desplegar ni fusionar cambios funcionales sin permiso. No prometer tareas asíncronas.
- Big Sur es exclusivamente un equipo de directos y pruebas necesarias de MIDIPlayerMac; desarrollo en Sequoia.
- Preferir GitHub → Cloudflare → PWA cuando proceda y mantener costes y dependencias bajos.

## Criterio de finalización
Una incidencia solo es RESUELTA si existe reproducción anterior, corrección localizada y validación posterior registrada. Si falta acceso o pruebas, declarar NO VERIFICADO.
