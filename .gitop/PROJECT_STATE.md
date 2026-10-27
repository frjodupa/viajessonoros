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
