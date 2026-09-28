const COVER_MAX_WIDTH = 1600
const COVER_RATIO = 3 / 2
const COVER_TARGET_BYTES = 500 * 1024
const COVER_QUALITIES = [0.84, 0.8, 0.76, 0.72]
const COVER_JPEG_QUALITIES = [0.9, 0.86, 0.82, 0.78]
const COVER_JPEG_TARGET_BYTES = 700 * 1024

const TEXT_VARIANTS = {
  viaje: [
    {
      title: (locality) => `Viaje Sonoro · ${locality}`,
      short: 'Un encuentro para detener el ritmo, respirar y volver a la escucha a través del sonido.',
      body: ({ dateText, timeText, placeText }) => `Te invitamos a un viaje sonoro el ${dateText}${timeText ? ` a las ${timeText}` : ''}${placeText ? ` en ${placeText}` : ''}. Una experiencia colectiva de sonido, vibración y presencia creada para abrir un espacio de calma y conexión interior.`,
    },
    {
      title: (locality) => `Viaje Sonoro · Volver a ti en ${locality}`,
      short: 'Una pausa consciente para escuchar, respirar y reconectar con el momento presente.',
      body: ({ dateText, timeText, placeText }) => `El ${dateText}${timeText ? ` a las ${timeText}` : ''} nos encontramos${placeText ? ` en ${placeText}` : ''} para compartir un viaje sonoro. Un espacio cercano donde el sonido y el silencio acompañan una escucha más profunda y serena.`,
    },
    {
      title: (locality) => `Viaje Sonoro · Un espacio de calma en ${locality}`,
      short: 'Sonido, presencia y escucha consciente en un encuentro creado para volver a lo esencial.',
      body: ({ dateText, timeText, placeText }) => `Compartiremos un viaje sonoro el ${dateText}${timeText ? ` a las ${timeText}` : ''}${placeText ? ` en ${placeText}` : ''}. Una propuesta para dejar fuera el ruido cotidiano y habitar con atención un paisaje de sonido, presencia y quietud.`,
    },
  ],
  privada: [
    {
      title: (locality) => `Sesión Privada · ${locality}`,
      short: 'Una experiencia íntima y personalizada de sonido, presencia y escucha.',
      body: ({ dateText, timeText, placeText }) => `Esta sesión privada tendrá lugar el ${dateText}${timeText ? ` a las ${timeText}` : ''}${placeText ? ` en ${placeText}` : ''}. Un encuentro íntimo que se adapta al momento y al ritmo de quienes participan, cuidando el espacio, la escucha y la presencia.`,
    },
    {
      title: (locality) => `Sesión Privada · Sonido y presencia en ${locality}`,
      short: 'Un encuentro cercano, cuidado y adaptado al ritmo de quienes participan.',
      body: ({ dateText, timeText, placeText }) => `El ${dateText}${timeText ? ` a las ${timeText}` : ''} abrimos una sesión privada${placeText ? ` en ${placeText}` : ''}. Una propuesta personalizada para compartir un tiempo de calma, sonido y conexión desde una atención cercana.`,
    },
    {
      title: (locality) => `Sesión Privada · Un tiempo para escuchar en ${locality}`,
      short: 'Una propuesta personal para detenerse y compartir una escucha más profunda.',
      body: ({ dateText, timeText, placeText }) => `Nos encontraremos el ${dateText}${timeText ? ` a las ${timeText}` : ''}${placeText ? ` en ${placeText}` : ''} para una sesión privada de Viajes Sonoros. La experiencia se construye desde la presencia y se acompaña con sensibilidad, respetando el ritmo del encuentro.`,
    },
  ],
  concierto: [
    {
      title: (locality) => `Concierto Meditativo · ${locality}`,
      short: 'Un paisaje sonoro para escuchar con todos los sentidos y habitar el presente.',
      body: ({ dateText, timeText, placeText }) => `El ${dateText}${timeText ? ` a las ${timeText}` : ''}${placeText ? ` en ${placeText}` : ''} compartiremos un concierto meditativo. Un encuentro sonoro que invita a la quietud, la contemplación y el disfrute consciente del presente.`,
    },
    {
      title: (locality) => `Concierto Meditativo · Paisajes del alma en ${locality}`,
      short: 'Música, silencio y presencia en una experiencia creada para escuchar de otra manera.',
      body: ({ dateText, timeText, placeText }) => `Te esperamos el ${dateText}${timeText ? ` a las ${timeText}` : ''}${placeText ? ` en ${placeText}` : ''} para vivir un concierto meditativo. Un paisaje envolvente de sonido y silencio que propone una escucha atenta, serena y compartida.`,
    },
    {
      title: (locality) => `Concierto Meditativo · Escucha y presencia en ${locality}`,
      short: 'Una invitación a detenerse y descubrir un paisaje de sonido, calma y contemplación.',
      body: ({ dateText, timeText, placeText }) => `Nos reuniremos el ${dateText}${timeText ? ` a las ${timeText}` : ''}${placeText ? ` en ${placeText}` : ''} en torno a un concierto meditativo. Una propuesta musical para escuchar con todos los sentidos y permanecer cerca del momento presente.`,
    },
  ],
}

const parseLocalDate = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null
}

export const formatAssistantDate = (value) => {
  const date = parseLocalDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export const buildExperienceDraft = ({
  template,
  date,
  time,
  place,
  locality,
  additional = '',
  variant = 0,
}) => {
  const variants = TEXT_VARIANTS[template]
  if (!variants) throw new Error('Selecciona primero un tipo de experiencia.')
  const cleanLocality = String(locality || '').trim()
  const dateText = formatAssistantDate(date)
  if (!dateText || !time || !String(place || '').trim() || !cleanLocality) {
    throw new Error('Completa fecha, hora, lugar y localidad antes de crear el contenido.')
  }
  const selected = variants[Math.abs(variant) % variants.length]
  const timeText = `${String(time).slice(0, 5)} h`
  const placeText = [String(place).trim(), cleanLocality].filter(Boolean).join(', ')

  return {
    title: selected.title(cleanLocality),
    shortText: selected.short,
    description: selected.body({ dateText, timeText, placeText }),
    additional: String(additional || '').trim(),
    dateText,
    timeText,
    coverTitle: template === 'viaje'
      ? 'Viaje Sonoro'
      : template === 'privada'
        ? 'Sesión Privada'
        : 'Concierto Meditativo',
  }
}

const canvasToBlob = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob?.type === 'image/webp') resolve(blob)
    else reject(new Error('Este navegador no permite exportar la portada en WebP.'))
  }, 'image/webp', quality)
})

const canvasToJPEG = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob?.type === 'image/jpeg') resolve(blob)
    else reject(new Error('Este navegador no permite exportar la portada en JPEG.'))
  }, 'image/jpeg', quality)
})

const loadBitmap = async (source) => {
  if (source instanceof Blob && 'createImageBitmap' in window) {
    return createImageBitmap(source, { imageOrientation: 'from-image' })
  }
  const url = source instanceof Blob ? URL.createObjectURL(source) : source
  const image = new Image()
  image.decoding = 'async'
  image.src = url
  try {
    await image.decode()
    return image
  } finally {
    if (source instanceof Blob) URL.revokeObjectURL(url)
  }
}

const closeBitmap = (image) => {
  if (typeof image?.close === 'function') image.close()
}

export const getExperienceCoverDimensions = (sourceWidth, sourceHeight) => {
  const width = Math.min(
    COVER_MAX_WIDTH,
    sourceWidth,
    Math.round(sourceHeight * COVER_RATIO),
  )
  return { width, height: Math.round(width / COVER_RATIO) }
}

const drawCoverImage = (context, image, width, height, focusX, focusY) => {
  const sourceWidth = image.width || image.naturalWidth
  const sourceHeight = image.height || image.naturalHeight
  const scale = Math.max(width / sourceWidth, height / sourceHeight)
  const visibleWidth = width / scale
  const visibleHeight = height / scale
  const maxX = Math.max(0, sourceWidth - visibleWidth)
  const maxY = Math.max(0, sourceHeight - visibleHeight)
  const sourceX = maxX * Math.min(100, Math.max(0, focusX)) / 100
  const sourceY = maxY * Math.min(100, Math.max(0, focusY)) / 100
  context.drawImage(image, sourceX, sourceY, visibleWidth, visibleHeight, 0, 0, width, height)
}

const fitLogo = (logo, maxWidth, maxHeight) => {
  const width = logo.width || logo.naturalWidth
  const height = logo.height || logo.naturalHeight
  const scale = Math.min(maxWidth / width, maxHeight / height, 1)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

const encodeCover = async (canvas) => {
  let result = null
  for (const quality of COVER_QUALITIES) {
    const blob = await canvasToBlob(canvas, quality)
    result = { blob, quality }
    if (blob.size <= COVER_TARGET_BYTES) break
  }
  return result
}

const encodeCoverJPEG = async (canvas) => {
  let result = null
  for (const quality of COVER_JPEG_QUALITIES) {
    const blob = await canvasToJPEG(canvas, quality)
    result = { blob, quality }
    if (blob.size <= COVER_JPEG_TARGET_BYTES) break
  }
  return result
}

export const createExperienceCover = async ({
  photo,
  logoURL,
  title,
  dateText,
  timeText,
  locality,
  focusX = 50,
  focusY = 50,
}) => {
  if (!(photo instanceof Blob)) throw new Error('Selecciona una fotografía real antes de crear la portada.')
  const [image, logo] = await Promise.all([loadBitmap(photo), loadBitmap(logoURL)])

  try {
    const sourceWidth = image.width || image.naturalWidth
    const sourceHeight = image.height || image.naturalHeight
    const width = Math.min(COVER_MAX_WIDTH, Math.max(1200, sourceWidth))
    const height = Math.round(width / COVER_RATIO)
    if (sourceWidth < 640 || sourceHeight < 427) {
      throw new Error('La fotografía no tiene resolución suficiente para crear la portada.')
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('El navegador no permite componer la portada.')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    // Arquitectura editorial: fotografía y contenido nunca comparten la misma zona.
    // El 57% izquierdo se reserva a imagen y el 43% derecho a identidad y datos.
    const photoWidth = Math.round(width * 0.57)
    const textX = photoWidth
    const textWidth = width - photoWidth

    context.fillStyle = '#fffaf5'
    context.fillRect(0, 0, width, height)

    const sourceScale = Math.max(photoWidth / sourceWidth, height / sourceHeight)
    const visibleWidth = photoWidth / sourceScale
    const visibleHeight = height / sourceScale
    const maxX = Math.max(0, sourceWidth - visibleWidth)
    const maxY = Math.max(0, sourceHeight - visibleHeight)
    const sourceX = maxX * Math.min(100, Math.max(0, focusX)) / 100
    const sourceY = maxY * Math.min(100, Math.max(0, focusY)) / 100
    context.drawImage(image, sourceX, sourceY, visibleWidth, visibleHeight, 0, 0, photoWidth, height)

    const panelGradient = context.createLinearGradient(textX, 0, width, height)
    panelGradient.addColorStop(0, '#fffaf5')
    panelGradient.addColorStop(0.72, '#fffdf9')
    panelGradient.addColorStop(1, '#f4e8f7')
    context.fillStyle = panelGradient
    context.fillRect(textX, 0, textWidth, height)

    const pad = Math.round(textWidth * 0.12)
    const contentX = textX + pad
    const maxContentWidth = textWidth - pad * 2
    const logoSize = fitLogo(logo, textWidth * 0.48, height * 0.17)
    const logoX = textX + Math.round((textWidth - logoSize.width) / 2)
    const logoY = Math.round(height * 0.09)
    context.drawImage(logo, logoX, logoY, logoSize.width, logoSize.height)

    context.fillStyle = '#5b236f'
    context.textBaseline = 'alphabetic'
    context.shadowBlur = 0
    context.font = `600 ${Math.round(width * 0.046)}px Georgia, serif`
    const cleanTitle = String(title || '').slice(0, 42)
    context.fillText(cleanTitle, contentX, Math.round(height * 0.53), maxContentWidth)

    context.fillStyle = '#b36a19'
    context.font = `600 ${Math.round(width * 0.020)}px Montserrat, Arial, sans-serif`
    context.fillText('▣', contentX, Math.round(height * 0.66))
    context.fillStyle = '#5b236f'
    context.font = `500 ${Math.round(width * 0.020)}px Montserrat, Arial, sans-serif`
    context.fillText(String(dateText || '').slice(0, 48), contentX + Math.round(width * 0.032), Math.round(height * 0.66), maxContentWidth - Math.round(width * 0.032))

    context.fillStyle = '#b36a19'
    context.font = `600 ${Math.round(width * 0.020)}px Montserrat, Arial, sans-serif`
    context.fillText('⌖', contentX, Math.round(height * 0.75))
    context.fillStyle = '#5b236f'
    context.font = `500 ${Math.round(width * 0.020)}px Montserrat, Arial, sans-serif`
    context.fillText([timeText, locality].filter(Boolean).join(' · ').slice(0, 48), contentX + Math.round(width * 0.032), Math.round(height * 0.75), maxContentWidth - Math.round(width * 0.032))

    context.strokeStyle = 'rgba(179,106,25,.38)'
    context.lineWidth = Math.max(1, Math.round(width * 0.0012))
    context.beginPath()
    context.moveTo(contentX, Math.round(height * 0.84))
    context.lineTo(contentX + maxContentWidth, Math.round(height * 0.84))
    context.stroke()

    const encoded = await encodeCoverJPEG(canvas)
    const cardCanvas = document.createElement('canvas')
    cardCanvas.width = 960
    cardCanvas.height = Math.round(960 / COVER_RATIO)
    const cardContext = cardCanvas.getContext('2d', { alpha: false })
    if (!cardContext) throw new Error('No se pudo generar la variante para tarjetas.')
    cardContext.imageSmoothingEnabled = true
    cardContext.imageSmoothingQuality = 'high'
    cardContext.drawImage(canvas, 0, 0, cardCanvas.width, cardCanvas.height)
    const cardBlob = (await encodeCover(cardCanvas)).blob
    const previewURL = URL.createObjectURL(encoded.blob)

    return {
      originalSize: photo.size,
      sourceWidth,
      sourceHeight,
      fullBlob: encoded.blob,
      fullType: 'image/jpeg',
      fullExtension: 'jpg',
      width,
      height,
      cardBlob,
      cardWidth: cardCanvas.width,
      cardHeight: cardCanvas.height,
      optimizedSize: encoded.blob.size,
      quality: encoded.quality,
      previewURL,
      savingPercent: photo.size
        ? Math.max(0, Math.round((1 - encoded.blob.size / photo.size) * 100))
        : 0,
      focusX,
      focusY,
      isGeneratedCover: true,
    }
  } finally {
    closeBitmap(image)
    closeBitmap(logo)
  }
}

export const assistantRequiredFields = ({ template, date, time, place, locality, photo }) => [
  !template && 'tipo de experiencia',
  !date && 'fecha',
  !time && 'hora',
  !String(place || '').trim() && 'lugar',
  !String(locality || '').trim() && 'localidad',
  !photo && 'fotografía',
].filter(Boolean)
