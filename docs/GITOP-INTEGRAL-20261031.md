# Viajes Sonoros — security

Recupera migración administrativa y autorización/SSRF Edge ya verificadas, sin sobrescribir la propuesta anterior. También exige membresía UUID/RPC en experiencias y API de banners, además de sesión comprobada y configuración de cuenta. Debe desplegarse solo DESPUÉS de la migración administrativa: RPC ausente deniega acceso. 14 pruebas web/Edge con servicios simulados. Sin rotación de secretos, cambios de sesiones ni configuración remota. Pendientes: Deno/SDK/gateway Supabase, MFA (0 factores verificados observados), Cloudflare sin permisos, protección main sin permiso de lectura, CSP unsafe-inline por compatibilidad actual.

Las ramas gitop/integral-* no generan despliegues automáticos según vercel.json. Esta regla no desactiva main.

BLOQUEO adicional: las cuatro migraciones Domus locales tienen versiones distintas de las registradas remotamente. No ejecutar db push ni reparar historial de forma automática. Conciliar en pruebas antes de cualquier aplicación.
