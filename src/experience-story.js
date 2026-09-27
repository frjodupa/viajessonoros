const STORY_WIDTH = 1080
const STORY_HEIGHT = 1920
const PHOTO_Y = 760
const PHOTO_HEIGHT = 790
const FOOTER_Y = PHOTO_Y + PHOTO_HEIGHT

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('No se pudo cargar la imagen para la historia.'))
  image.src = src
})

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo generar la historia.')), 'image/jpeg', 0.9)
})

const drawCover = (ctx, image, x, y, w, h) => {
  const scale = Math.max(w / image.width, h / image.height)
  const sw = w / scale
  const sh = h / scale
  const sx = Math.max(0, (image.width - sw) / 2)
  const sy = Math.max(0, (image.height - sh) / 2)
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h)
}

const roundedRect = (ctx, x, y, w, h, radius) => {
  const r = Math.min(radius, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const wrapLines = (ctx, text, maxWidth, maxLines = 4) => {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const lines = []
  let current = words.shift()
  while (words.length) {
    const next = words[0]
    const candidate = current + ' ' + next
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
      words.shift()
    } else {
      lines.push(current)
      current = words.shift()
      if (lines.length >= maxLines - 1) break
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  if (words.length && lines.length) {
    let last = lines[lines.length - 1]
    while (ctx.measureText(last + '…').width > maxWidth && last.length > 3) last = last.slice(0, -1)
    lines[lines.length - 1] = last.replace(/[\s,.;:-]+$/, '') + '…'
  }
  return lines
}

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value + 'T12:00:00')
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(date)
}

export async function createExperienceStory({ experience, logoURL = '/logo-oficial.png' }) {
  if (!experience?.imagen_url) throw new Error('La experiencia necesita una imagen antes de generar la historia.')
  await document.fonts?.ready
  const [photo, logo] = await Promise.all([loadImage(experience.imagen_url), loadImage(logoURL)])
  const canvas = document.createElement('canvas')
  canvas.width = STORY_WIDTH
  canvas.height = STORY_HEIGHT
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#fffaf4'
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT)

  const topGradient = ctx.createLinearGradient(0, 0, STORY_WIDTH, 0)
  topGradient.addColorStop(0, '#f7efe9')
  topGradient.addColorStop(0.55, '#fffaf4')
  topGradient.addColorStop(1, '#f4e9f5')
  ctx.fillStyle = topGradient
  ctx.fillRect(0, 0, STORY_WIDTH, PHOTO_Y)

  const logoW = 330
  const logoH = logo.height * (logoW / logo.width)
  ctx.drawImage(logo, 82, 82, logoW, logoH)

  ctx.fillStyle = '#5B3F98'
  ctx.font = '600 38px Montserrat, Arial, sans-serif'
  ctx.fillText('EXPERIENCIA VIAJES SONOROS', 82, 300)

  ctx.fillStyle = '#34255F'
  ctx.font = '600 78px "Cormorant Garamond", Georgia, serif'
  const titleLines = wrapLines(ctx, experience.titulo || 'Viaje Sonoro', 900, 3)
  let y = 400
  titleLines.forEach((line) => {
    ctx.fillText(line, 82, y)
    y += 82
  })

  const dateText = [formatDate(experience.fecha), String(experience.hora || '').slice(0, 5)].filter(Boolean).join(' · ')
  const placeText = [experience.lugar, experience.localidad].filter(Boolean).join(' · ')
  const priceText = String(experience.precio || '').trim()
  const info = [dateText, placeText, priceText].filter(Boolean)

  ctx.font = '600 31px Montserrat, Arial, sans-serif'
  info.slice(0, 3).forEach((text, index) => {
    const py = 610 + index * 58
    ctx.fillStyle = index === 0 ? '#D5007F' : '#34255F'
    ctx.fillText(text, 86, py)
  })

  drawCover(ctx, photo, 0, PHOTO_Y, STORY_WIDTH, PHOTO_HEIGHT)

  const footerGradient = ctx.createLinearGradient(0, FOOTER_Y, STORY_WIDTH, STORY_HEIGHT)
  footerGradient.addColorStop(0, '#fffaf4')
  footerGradient.addColorStop(1, '#f2e7f5')
  ctx.fillStyle = footerGradient
  ctx.fillRect(0, FOOTER_Y, STORY_WIDTH, STORY_HEIGHT - FOOTER_Y)

  ctx.fillStyle = '#34255F'
  ctx.font = '600 34px Montserrat, Arial, sans-serif'
  ctx.fillText('Reserva tu plaza', 82, 1640)

  roundedRect(ctx, 82, 1680, 916, 124, 56)
  ctx.fillStyle = '#5B3F98'
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = '600 30px Montserrat, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('🌐  viajessonoros.es', 128, 1733)
  ctx.fillText('☎  Reservar por WhatsApp · 610 056 859', 128, 1780)

  ctx.fillStyle = '#665F6B'
  ctx.font = '500 25px Montserrat, Arial, sans-serif'
  ctx.fillText('Meditar es pasar tiempo con tu alma', 82, 1860)

  const blob = await canvasToBlob(canvas)
  return { blob, previewURL: URL.createObjectURL(blob), width: STORY_WIDTH, height: STORY_HEIGHT, mimeType: 'image/jpeg' }
}

export function releaseExperienceStory(story) {
  if (story?.previewURL?.startsWith('blob:')) URL.revokeObjectURL(story.previewURL)
}
