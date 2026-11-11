import test from 'node:test'
import assert from 'node:assert/strict'
import { createExperienceCover } from '../src/experience-creation-assistant.js'
import { optimizeExperienceImage, buildExperienceImagePaths, getOptimizedExperienceImage } from '../src/admin-image-optimizer.js'

// DOM simulado para probar el contrato de exportación sin usar datos de producción.
// La validación visual en Safari real es una comprobación adicional, no sustituida aquí.
const mockBrowser = (webp = 'unsupported') => {
  const prior = {
    document: globalThis.document, window: globalThis.window,
    createImageBitmap: globalThis.createImageBitmap,
  }
  globalThis.window = { location: { origin: 'https://example.test' } }
  globalThis.createImageBitmap = async () => ({
    width: 1200, height: 800, close() {},
  })
  globalThis.window.createImageBitmap = globalThis.createImageBitmap
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'canvas')
      return {
        width: 0, height: 0,
        getContext() {
          return {
            drawImage() {}, fillRect() {}, fillText() {},
            stroke() {}, beginPath() {}, moveTo() {}, lineTo() {},
            createLinearGradient() { return { addColorStop() {} } },
          }
        },
        toBlob(callback, type) {
          if (type === 'image/webp' && webp === 'unsupported') {
            callback(new Blob(['jpeg fallback'], { type: 'image/jpeg' }))
          } else if (type === 'image/webp' && webp === 'null') {
            callback(null)
          } else {
            callback(new Blob(['mock image'], { type }))
          }
        },
      }
    },
  }
  return () => {
    globalThis.document = prior.document
    globalThis.window = prior.window
    globalThis.createImageBitmap = prior.createImageBitmap
  }
}

for (const webp of ['unsupported', 'null', 'supported']) {
  test('generación de portada con WebP: ' + webp, async () => {
    const restore = mockBrowser(webp)
    try {
      const input = new Blob(['foto de prueba'], { type: 'image/jpeg' })
      const result = await createExperienceCover({
        photo: input, logoURL: input, title: 'Prueba QA',
        dateText: '11-11-2026', timeText: '20:00',
        locality: 'Cáceres',
      })
      assert.equal(result.fullType, 'image/jpeg')
      assert.equal(result.fullBlob.type, 'image/jpeg')
      assert.equal(Boolean(result.cardBlob), webp === 'supported')
      if (result.cardBlob) assert.equal(result.cardBlob.type, 'image/webp')
      URL.revokeObjectURL(result.previewURL)
    } finally { restore() }
  })
}

test('optimización de fotografía en navegador sin WebP', async () => {
  const restore = mockBrowser('unsupported')
  try {
    const file = new File(['foto de prueba'], 'real.jpg', { type: 'image/jpeg' })
    const result = await optimizeExperienceImage(file)
    assert.equal(result.fullType, 'image/jpeg')
    assert.equal(result.cardBlob, null)
    const paths = buildExperienceImagePaths(file.name, result)
    assert.equal(paths.card, null)
    assert.match(paths.full, /__nocard__full-\d+x\d+\.jpg$/)
    const parsed = getOptimizedExperienceImage('https://example.test/' + paths.full)
    assert.equal(parsed.cardURL, null)
    URL.revokeObjectURL(result.previewURL)
  } finally { restore() }
})

test('las rutas de miniaturas WebP antiguas no cambian', () => {
  globalThis.window = { location: { origin: 'https://example.test' } }
  const old = getOptimizedExperienceImage(
    'https://example.test/123__focus-50-50__full-1200x800.jpg'
  )
  assert.match(old.cardURL, /__card\.webp$/)
})

test('ruta WebP con miniatura existente conserva su formato', () => {
  const restore = mockBrowser('supported')
  try {
    const paths = buildExperienceImagePaths('foto.jpg', {
      width: 1200, height: 800, fullExtension: 'jpg',
      focusX: 50, focusY: 50, cardBlob: new Blob(['webp'], { type: 'image/webp' }),
    })
    assert.match(paths.full, /__full-1200x800\.jpg$/)
    assert.match(paths.card, /__card\.webp$/)
  } finally { restore() }
})
