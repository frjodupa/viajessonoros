import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const errors = [];
const read = (path) => readFileSync(join(root, path), 'utf8');
const fail = (scope, message) => errors.push(`${scope}: ${message}`);

const requiredFiles = [
  'index.html',
  'experiencias.html',
  'reset-password.html',
  'vercel.json',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/politica-privacidad.html',
  'public/politica-cookies.html',
  'public/aviso-legal.html',
  'public/condiciones-reserva.html',
  'public/analytics.js',
  'src/main.js',
  'src/supabase.js',
];

for (const path of requiredFiles) {
  if (!existsSync(join(root, path))) fail('estructura', `falta ${path}`);
}

if (!errors.length) {
  const index = read('index.html');
  const experiences = read('experiencias.html');
  const reset = read('reset-password.html');
  const robots = read('public/robots.txt');
  const sitemap = read('public/sitemap.xml');
  const vercel = read('vercel.json');
  const security = read('SECURITY.md');

  const publicPages = [
    ['index.html', index, 'https://viajessonoros.es/'],
    ['experiencias.html', experiences, 'https://viajessonoros.es/experiencias.html'],
  ];

  for (const [filename, html, canonical] of publicPages) {
    for (const [pattern, label] of [
      [/<!doctype html>/i, 'doctype'],
      [/<html[^>]+lang=["']es["']/i, 'lang=es'],
      [/<meta[^>]+name=["']description["']/i, 'meta description'],
      [/<meta[^>]+name=["']robots["'][^>]+index/i, 'robots index'],
      [/property=["']og:/i, 'Open Graph'],
      [/name=["']twitter:/i, 'Twitter Card'],
    ]) {
      if (!pattern.test(html)) fail(filename, `falta ${label}`);
    }
    if (!html.includes(canonical)) fail(filename, `canonical incorrecto: ${canonical}`);
  }

  if (!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(reset)) {
    fail('reset-password.html', 'la página privada debe ser noindex');
  }

  if (!/Sitemap:\s*https:\/\/viajessonoros\.es\/sitemap\.xml/i.test(robots)) {
    fail('robots.txt', 'sitemap canónico incorrecto');
  }

  for (const url of [
    'https://viajessonoros.es/',
    'https://viajessonoros.es/experiencias.html',
    'https://viajessonoros.es/aviso-legal.html',
    'https://viajessonoros.es/politica-privacidad.html',
    'https://viajessonoros.es/politica-cookies.html',
  ]) {
    if (!sitemap.includes(url)) fail('sitemap.xml', `falta ${url}`);
  }

  let config;
  try { config = JSON.parse(vercel); } catch (error) {
    fail('vercel.json', `JSON inválido: ${error.message}`);
  }

  if (config) {
    const serialized = JSON.stringify(config);
    for (const header of ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy']) {
      if (!serialized.includes(header)) fail('vercel.json', `falta cabecera ${header}`);
    }
  }

  if (!/Supabase Auth/i.test(security) || !/RLS/i.test(security)) {
    fail('SECURITY.md', 'debe documentar Supabase Auth y RLS');
  }

  const source = read('src/supabase.js');
  if (/service_role/i.test(source)) fail('src/supabase.js', 'no debe contener service_role');
  if (!source.includes('VITE_SUPABASE_URL') || !source.includes('VITE_SUPABASE_ANON_KEY')) {
    fail('src/supabase.js', 'faltan variables públicas esperadas de Supabase');
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(error));
  process.exit(1);
}

console.log('Validación Viajes Sonoros completada: estructura, SEO, seguridad documental y configuración pública correctos.');
