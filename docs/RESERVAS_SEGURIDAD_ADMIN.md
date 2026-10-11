# Auditoría del acceso administrativo a reservas

## Hallazgo en la rama main (10 de octubre de 2026)
En `experiencias.html`, `hasValidAdmin()` consulta `supabase.auth.getUser()` y acepta cualquier identidad válida. El archivo `supabase/security-policies.sql` plantea políticas CRUD sobre `experiencias` para todo el rol `authenticated`.

**No está verificado que dicho SQL esté aplicado en el proyecto remoto.** No alterar ni aplicar políticas sin consultar primero el estado real de Supabase.

## Implementación aislada en este PR
`src/booking-supabase-auth.js` valida el token mediante el endpoint HTTPS `/auth/v1/user` de Supabase Auth y compara el ID del usuario con una lista **definida exclusivamente en secretos del servidor**. Un inicio de sesión correcto no constituye por sí mismo un permiso de administrador.

La lista `BOOKING_ADMIN_USER_IDS` no se envía al navegador. La implementación no expone endpoints ni ejecuta operaciones en D1.

## Antes de producción
1. Comprobar los administradores autorizados del proyecto Supabase actual.
2. Auditar políticas RLS reales y sustituir autorizaciones generales por permisos limitados. Nunca ejecutar el archivo SQL del repositorio sin revisión.
3. Configurar secretos en Cloudflare Worker; no exponer credenciales internas ni IDs de administradores en código cliente.
4. Exigir HTTPS y autenticación en cada endpoint; incluir rate limiting y auditoría de cambios sin información personal.
5. Probar accesos no autorizados, cambio de estado, concurrencia y rotación de tokens.
6. Preparar privacidad, consentimiento y conservación de información de asistentes.
