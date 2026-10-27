import { existsSync, readFileSync } from 'node:fs'
for (const page of ['index.html', 'admin.html']) {
  const file = `dist/talleres-domus/${page}`
  const html = readFileSync(file, 'utf8')
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1])
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1])
  if (!scripts.length || scripts.some(src => !src.startsWith('/assets/')) || !assets.length || assets.some(asset => !existsSync(`dist${asset}`)) || existsSync(`dist/public/talleres-domus/${page}`)) {
    throw new Error(`Domus: empaquetado incompleto en ${file}`)
  }
}
console.log('Domus: ambas rutas incluyen sus módulos compilados y todos los assets existen.')
