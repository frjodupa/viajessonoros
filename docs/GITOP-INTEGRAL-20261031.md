# Viajes Sonoros — dependencies

Lock actualizado dentro de los rangos existentes; override zod 4.6.6 dentro de major 4. Vite 8.3.5, source-map-js 1.2.2, undici 6.29.1, @vercel/blob 2.8.2. npm audit pasa de 7 high a 0; no se usa --force. Instalación limpia con --ignore-scripts, integridades de tarballs verificadas por npm contra lock. No garantiza ausencia de vulnerabilidades desconocidas. Dependencias actualizadas deben validarse con candidato conjunto antes de publicar. Reversión: restaurar package.json y lock conjuntamente y reinstalar en entorno de pruebas.

Las ramas gitop/integral-* no generan despliegues automáticos según vercel.json. Esta regla no desactiva main.
