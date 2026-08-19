const escapeHTML = (value = '') =>
  String(value).replace(/[&<>'"]/g, (character) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character],
  )

const safeImageURL = (value) => {
  try {
    const url = new URL(String(value || ''), window.location.origin)
    return url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
      ? url.href
      : ''
  } catch {
    return ''
  }
}

const formatDate = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return String(value || '')
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

const formatTime = (value) => {
  const match = String(value || '').match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]} h` : ''
}

const formatContribution = (value) => {
  const text = String(value || '').trim()
  return text && !/^aportaci[oó]n\b/i.test(text) && !/^gratuito$/i.test(text)
    ? `Aportación ${text}`
    : text
}

const whatsappIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.84 9.84 0 0 0-8.4 14.96L2.05 22l5.18-1.54A9.98 9.98 0 1 0 12.04 2Zm0 17.98a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.07.91.92-2.99-.2-.31a8.02 8.02 0 1 1 6.78 3.7Zm4.44-6.02c-.24-.12-1.44-.71-1.66-.79-.23-.08-.39-.12-.56.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2a7.2 7.2 0 0 1-1.34-1.67c-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.76-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.3-.23.24-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.46-.28Z"/></svg>'

export const installExperienceDetail = ({ getExperiences, getWhatsAppLink, isReservable }) => {
  let detailTrigger = null

  const detailHTML = (experience) => {
    const image = safeImageURL(experience.imagen_url)
    const title = escapeHTML(experience.titulo)
    const description = escapeHTML(experience.descripcion || '')
    const date = escapeHTML(formatDate(experience.fecha))
    const time = escapeHTML(formatTime(experience.hora))
    const place = escapeHTML(experience.lugar)
    const contribution = escapeHTML(formatContribution(experience.precio))
    const availability = escapeHTML(experience.plazas ?? experience.estado ?? '')
    const extra = escapeHTML(experience.informacion_adicional ?? experience.info_adicional ?? experience.detalles ?? '')
    const duration = escapeHTML(experience.duracion ?? '')
    const reserveLink = isReservable(experience)
      ? `<a class="whatsapp-reserve-button experience-detail-reserve" href="${escapeHTML(getWhatsAppLink(experience))}" target="_blank" rel="noopener noreferrer">${whatsappIcon}Reservar por WhatsApp</a>`
      : ''

    return `<article class="experience-detail-panel"><div class="experience-detail-media"><button class="experience-detail-close" type="button" aria-label="Cerrar experiencia" onclick="window.cerrarExperiencia()">×</button>${image ? `<img class="experience-detail-image" src="${escapeHTML(image)}" alt="Imagen de ${title}">` : ''}</div><div class="experience-detail-body"><h2 id="experience-detail-title">${title}</h2>${date || time || place || contribution || availability || duration ? `<dl class="experience-detail-data">${date ? `<div><dt>Fecha</dt><dd>${date}</dd></div>` : ''}${time ? `<div><dt>Hora</dt><dd>${time}</dd></div>` : ''}${place ? `<div><dt>Lugar</dt><dd>${place}</dd></div>` : ''}${contribution ? `<div><dt>Precio</dt><dd>${contribution}</dd></div>` : ''}${availability ? `<div><dt>Plazas o estado</dt><dd>${availability}</dd></div>` : ''}${duration ? `<div><dt>Duración</dt><dd>${duration}</dd></div>` : ''}</dl>` : ''}${description ? `<p class="experience-detail-description">${description}</p>` : ''}${extra ? `<section class="experience-detail-extra" aria-labelledby="experience-detail-extra-title"><h3 id="experience-detail-extra-title">Información adicional</h3><p>${extra}</p></section>` : ''}${reserveLink}</div></article>`
  }

  window.cerrarExperiencia = () => {
    const dialog = document.getElementById('experience-detail-dialog')
    if (dialog?.open) dialog.close()
  }

  window.abrirExperiencia = (id, trigger) => {
    const experience = getExperiences().find((item) => String(item.id) === String(id))
    const dialog = document.getElementById('experience-detail-dialog')
    const content = document.getElementById('experience-detail-content')
    if (!experience || !dialog || !content) return
    detailTrigger = trigger || document.activeElement
    content.innerHTML = detailHTML(experience)
    dialog.showModal()
    document.body.classList.add('experience-detail-open')
    dialog.querySelector('.experience-detail-close')?.focus()
  }

  return {
    modalHTML: `<dialog id="experience-detail-dialog" class="experience-detail-dialog" aria-labelledby="experience-detail-title" onclick="if(event.target===this)window.cerrarExperiencia()"><div id="experience-detail-content"></div></dialog>`,
    bind: () => {
      const dialog = document.getElementById('experience-detail-dialog')
      if (!dialog || dialog.dataset.bound === 'true') return
      dialog.dataset.bound = 'true'
      dialog.addEventListener('close', () => {
        document.body.classList.remove('experience-detail-open')
        detailTrigger?.focus()
        detailTrigger = null
      })
    },
  }
}
