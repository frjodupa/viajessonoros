const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const MAX_IMAGE_SIDE = 1600
const CARD_IMAGE_WIDTH = 640
const TARGET_IMAGE_BYTES = 500 * 1024
const WEBP_QUALITIES = [0.82, 0.78, 0.74]
const MIN_IMAGE_WIDTH = 640
const MIN_IMAGE_HEIGHT = 427
const IDEAL_RATIO_MIN = 381 / 260
const IDEAL_RATIO_MAX = 345 / 220

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('El navegador no pudo generar la imagen optimizada.'))
      },
      type,
      quality,
    )
  })

const loadOrientedImage = async (file) => {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch {
      // Safari antiguos y algunos WebP continúan por la vía Image, que aplica EXIF.
    }
  }

  const objectURL = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'
  image.src = objectURL

  try {
    await image.decode()
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(objectURL),
    }
  } catch {
    URL.revokeObjectURL(objectURL)
    throw new Error('No se ha podido leer la fotografía seleccionada.')
  }
}

const dimensionsWithin = (width, height, maxSide) => {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

const renderToCanvas = (source, width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) throw new Error('El navegador no permite procesar esta imagen.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, width, height)
  return canvas
}

const encodeWebP = async (canvas, originalSize) => {
  let selected = null

  for (const quality of WEBP_QUALITIES) {
    const blob = await canvasToBlob(canvas, 'image/webp', quality)
    if (blob.type !== 'image/webp') {
      throw new Error('Este navegador no permite crear imágenes WebP.')
    }
    selected = { blob, quality }
    if (blob.size <= TARGET_IMAGE_BYTES) break
  }

  return selected
}

const extensionForType = (type) =>
  ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[type]

export const formatImageBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const assessExperienceImage = (width, height, bytes) => {
  if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
    return {
      key: 'insufficient',
      label: 'Resolución insuficiente',
      message: `La fotografía debe tener al menos ${MIN_IMAGE_WIDTH} × ${MIN_IMAGE_HEIGHT} px para cubrir las tarjetas sin perder nitidez.`,
      blocksUpload: true,
    }
  }

  if (bytes > TARGET_IMAGE_BYTES) {
    return {
      key: 'heavy',
      label: 'Archivo demasiado pesado; se optimizará automáticamente',
      message: 'Puedes continuar: se reducirá antes de subirlo y conservará su encuadre original.',
      blocksUpload: false,
    }
  }

  const ratio = width / height
  if (ratio >= IDEAL_RATIO_MIN && ratio <= IDEAL_RATIO_MAX) {
    return {
      key: 'perfect',
      label: 'Perfecta para la web',
      message: 'Su proporción encaja con las tarjetas habituales y se mostrará completa en portada y detalle.',
      blocksUpload: false,
    }
  }

  return {
    key: 'compatible',
    label: 'Compatible, pero puede recortarse',
    message: 'La fotografía se conservará completa; solo las tarjetas pueden ocultar parte de los bordes. Ajusta el punto de enfoque si lo necesitas.',
    blocksUpload: false,
  }
}

export const optimizeExperienceImage = async (file) => {
  if (!(file instanceof File)) throw new Error('Selecciona una fotografía válida.')
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Formato no compatible. Utiliza una fotografía JPEG, PNG o WebP.')
  }

  const decoded = await loadOrientedImage(file)

  try {
    if (!decoded.width || !decoded.height) {
      throw new Error('La fotografía no contiene dimensiones válidas.')
    }

    const fullDimensions = dimensionsWithin(
      decoded.width,
      decoded.height,
      MAX_IMAGE_SIDE,
    )
    const fullCanvas = renderToCanvas(
      decoded.source,
      fullDimensions.width,
      fullDimensions.height,
    )
    const webp = await encodeWebP(fullCanvas, file.size)
    const needsPixelNormalization =
      fullDimensions.width !== decoded.width ||
      fullDimensions.height !== decoded.height

    let fullBlob
    let fullType
    let quality = null

    if (webp.blob.size < file.size || needsPixelNormalization) {
      fullBlob = webp.blob
      fullType = 'image/webp'
      quality = webp.quality
    } else {
      // Si WebP no ahorra y no hay que redimensionar, el original es el fallback
      // más fiel. Los navegadores aplican su orientación EXIF al mostrarlo.
      fullBlob = file
      fullType = file.type
    }

    let cardBlob = null
    let cardDimensions = null
    if (fullDimensions.width > CARD_IMAGE_WIDTH) {
      cardDimensions = {
        width: CARD_IMAGE_WIDTH,
        height: Math.max(
          1,
          Math.round(fullDimensions.height * CARD_IMAGE_WIDTH / fullDimensions.width),
        ),
      }
      const cardCanvas = renderToCanvas(
        decoded.source,
        cardDimensions.width,
        cardDimensions.height,
      )
      cardBlob = (await encodeWebP(cardCanvas, fullBlob.size)).blob
    }

    const previewURL = URL.createObjectURL(fullBlob)
    return {
      originalSize: file.size,
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
      fullBlob,
      fullType,
      fullExtension: extensionForType(fullType),
      width: fullDimensions.width,
      height: fullDimensions.height,
      cardBlob,
      cardWidth: cardDimensions?.width || null,
      cardHeight: cardDimensions?.height || null,
      optimizedSize: fullBlob.size,
      quality,
      previewURL,
      savingPercent: file.size
        ? Math.max(0, Math.round((1 - fullBlob.size / file.size) * 100))
        : 0,
      focusX: 50,
      focusY: 50,
    }
  } finally {
    decoded.close()
  }
}

export const releaseOptimizedImage = (result) => {
  if (result?.previewURL) URL.revokeObjectURL(result.previewURL)
}

export const buildExperienceImagePaths = (fileName, result) => {
  const stem = String(fileName || 'experiencia')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'experiencia'
  const base = `${Date.now()}_${stem}`
  const focusX = Math.min(100, Math.max(0, Math.round(result.focusX ?? 50)))
  const focusY = Math.min(100, Math.max(0, Math.round(result.focusY ?? 50)))
  const imageBase = `${base}__focus-${focusX}-${focusY}`

  return {
    full: `${imageBase}__full-${result.width}x${result.height}.${result.fullExtension}`,
    card: result.cardBlob ? `${imageBase}__card.webp` : null,
  }
}

export const getOptimizedExperienceImage = (value) => {
  const url = String(value || '')
  const match = url.match(/(?:__focus-(\d{1,3})-(\d{1,3}))?__full-(\d+)x(\d+)\.(?:webp|jpe?g|png)(?:\?.*)?$/i)
  if (!match) return null

  const width = Number(match[3])
  const height = Number(match[4])
  const cardWidth = Math.min(CARD_IMAGE_WIDTH, width)
  const cardHeight = Math.max(1, Math.round(height * cardWidth / width))
  const focusX = Math.min(100, Math.max(0, Number(match[1] || 50)))
  const focusY = Math.min(100, Math.max(0, Number(match[2] || 50)))

  return {
    url,
    width,
    height,
    cardURL: width > CARD_IMAGE_WIDTH
      ? url.replace(/__full-\d+x\d+\.(?:webp|jpe?g|png)(?=\?|$)/i, '__card.webp')
      : null,
    cardWidth,
    cardHeight,
    isWebP: /\.webp(?:\?|$)/i.test(url),
    focusX,
    focusY,
  }
}
