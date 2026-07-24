import './style.css'
import { supabase } from './supabase.js'

const PHONE = '34610056859'
const LANDING_EVENTS_LIMIT = 3

const whatsappLink = (message) =>
  `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`

const icons = {
  arrow: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  `,
  heart: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  `,
  lotus: `
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 51c-8-9-9-20 0-37 9 17 8 28 0 37Z" />
      <path d="M31 51C19 48 12 39 12 24c13 5 19 14 19 27ZM33 51c12-3 19-12 19-27-13 5-19 14-19 27Z" />
      <path d="M28 52C16 54 7 49 3 39c11-1 20 3 25 13ZM36 52c12 2 21-3 25-13-11-1-20 3-25 13Z" />
      <path d="M8 55h48" />
    </svg>
  `,
  users: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 14c3.9-.8 6.1 1 6.5 5" />
    </svg>
  `,
  person: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5.5 20c.5-5 2.7-7.5 6.5-7.5s6 2.5 6.5 7.5" />
      <path d="M9.5 16.5 12 19l2.5-2.5" />
    </svg>
  `,
  briefcase: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 12h18M10 12v2h4v-2" />
    </svg>
  `,
  music: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18V5l11-2v13" />
      <ellipse cx="6" cy="18" rx="3" ry="2.3" />
      <ellipse cx="17" cy="16" rx="3" ry="2.3" />
    </svg>
  `,
  handpan: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="13" rx="9" ry="6.5" />
      <circle cx="12" cy="10" r="2.2" />
      <circle cx="7.5" cy="13.5" r="1.2" />
      <circle cx="16.5" cy="13.5" r="1.2" />
      <path d="M4 15.5c4.5 2 11.5 2 16 0" />
    </svg>
  `,
  whatsapp: `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.84 9.84 0 0 0-8.4 14.96L2.05 22l5.18-1.54A9.98 9.98 0 1 0 12.04 2Zm0 17.98a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.07.91.92-2.99-.2-.31a8.02 8.02 0 1 1 6.78 3.7Zm4.44-6.02c-.24-.12-1.44-.71-1.66-.79-.23-.08-.39-.12-.56.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2a7.2 7.2 0 0 1-1.34-1.67c-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.76-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.3-.23.24-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  `,
  instagram: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.7" r="1" class="icon-fill" />
    </svg>
  `,
  mail: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  `,
  globe: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21M12 3C9.7 5.5 8.5 8.5 8.5 12s1.2 6.5 3.5 9" />
    </svg>
  `,
  diamond: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 3 7 9-7 9-7-9 7-9Z" />
    </svg>
  `,
}

const renderIcon = (name, className = '') =>
  `<span class="icon ${className}" aria-hidden="true">${icons[name]}</span>`

const links = {
  general: whatsappLink(
    'Hola, quiero información sobre las experiencias de Viajes Sonoros.',
  ),
  usbCard: whatsappLink(
    'Hola.\nQuiero comprar la Tarjeta USB de Viajes Sonoros.',
  ),
  woodenDrive: whatsappLink(
    'Hola.\nQuiero comprar el Pendrive de madera de Viajes Sonoros.',
  ),
}

const experiences = [
  {
    image: '/experiencia-grupo.jpg',
    icon: 'users',
    title: 'Viajes sonoros en grupo',
    description:
      'Sesiones colectivas para conectar, relajarte y elevar tu energía.',
  },
  {
    image: '/experiencia-privada.jpg',
    icon: 'person',
    title: 'Sesiones privadas',
    description:
      'Acompañamiento personalizado según tus necesidades.',
  },
  {
    image: '/experiencia-retiros.jpg',
    icon: 'briefcase',
    title: 'Empresas, retiros y hoteles',
    description:
      'Bienestar y equilibrio para equipos, huéspedes y espacios conscientes.',
  },
  {
    image: '/experiencia-conciertos.jpg',
    icon: 'music',
    title: 'Conciertos temáticos',
    description:
      'Vive la magia del sonido en directo. Una experiencia para el alma.',
  },
]

const instruments = [
  {
    image: '/instrumentos-handpan.jpg',
    title: 'Handpan',
  },
  {
    image: '/instrumentos-kora.jpg',
    title: 'Kora africana',
  },
  {
    image: '/instrumentos-cuencos.jpg',
    title: 'Cuencos tibetanos y de cuarzo',
  },
  {
    image: '/instrumentos-gong.jpg',
    title: 'Gong',
  },
  {
    image: '/instrumentos-naturaleza.jpg',
    title: 'Instrumentos de naturaleza',
  },
]

const steps = [
  {
    number: '1',
    title: 'Llegar',
    description:
      'Te damos la bienvenida a un espacio seguro y acogedor.',
  },
  {
    number: '2',
    title: 'Soltar',
    description:
      'El sonido te guía para liberar tensiones y calmar tu mente.',
  },
  {
    number: '3',
    title: 'Sentir',
    description:
      'Reconectas con tu esencia y con la paz que ya habita en ti.',
  },
]

const spanishMonths = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
}

const escapeHTML = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const safeImageURL = (value = '') => {
  const url = String(value).trim()

  if (
    url.startsWith('/') ||
    url.startsWith('https://') ||
    url.startsWith('http://') ||
    url.startsWith('data:image/')
  ) {
    return url
  }

  return '/experiencia-grupo.jpg'
}

const parseExperienceDate = (value) => {
  if (!value) return null

  const source = String(value).trim()
  const isoMatch = source.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)

  if (isoMatch) {
    return new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    )
  }

  const numericMatch = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)

  if (numericMatch) {
    return new Date(
      Number(numericMatch[3]),
      Number(numericMatch[2]) - 1,
      Number(numericMatch[1]),
    )
  }

  const normalized = source
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bde\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const textMatch = normalized.match(
    /^(\d{1,2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{4})/,
  )

  if (!textMatch) return null

  return new Date(
    Number(textMatch[3]),
    spanishMonths[textMatch[2]],
    Number(textMatch[1]),
  )
}

const isPublishedExperience = (experience) => {
  if (
    experience.activo === false ||
    experience.active === false ||
    experience.publicado === false ||
    experience.published === false
  ) {
    return false
  }

  const status = String(experience.estado || experience.status || '')
    .trim()
    .toLocaleLowerCase('es')
  const hiddenStatuses = [
    'archivado',
    'archived',
    'borrador',
    'cancelado',
    'caducado',
    'draft',
    'inactivo',
    'inactive',
    'no publicado',
    'unpublished',
  ]

  return !hiddenStatuses.includes(status)
}

const getExperienceDate = (experience) =>
  parseExperienceDate(
    experience.fecha_fin ||
      experience.end_date ||
      experience.fecha_texto ||
      experience.fecha,
  )

const getExperienceIdentity = (experience) => {
  if (experience.id != null) return `id:${experience.id}`

  return [
    experience.titulo,
    experience.fecha_texto || experience.fecha,
    experience.lugar,
  ]
    .map((value) => String(value || '').trim().toLocaleLowerCase('es'))
    .join('|')
}

const selectLandingExperiences = (items) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const unique = new Map()

  items.forEach((experience) => {
    if (!experience || !isPublishedExperience(experience)) return

    const date = getExperienceDate(experience)
    if (date && date < today) return

    const identity = getExperienceIdentity(experience)
    if (!unique.has(identity)) unique.set(identity, experience)
  })

  return [...unique.values()]
    .sort((first, second) => {
      const firstDate = getExperienceDate(first)
      const secondDate = getExperienceDate(second)

      if (firstDate && secondDate) return firstDate - secondDate
      if (firstDate) return -1
      if (secondDate) return 1

      return String(second.created_at || '').localeCompare(
        String(first.created_at || ''),
      )
    })
    .slice(0, LANDING_EVENTS_LIMIT)
}

const getEventIcon = (experience) => {
  const title = String(experience.titulo || '').toLocaleLowerCase('es')

  if (title.includes('handpan')) return 'handpan'
  if (
    title.includes('kirtan') ||
    title.includes('concierto') ||
    title.includes('música')
  ) {
    return 'music'
  }

  return 'users'
}

const getEventWhatsAppLink = (experience) => {
  const title = experience.titulo || ''
  const date = experience.fecha_texto || experience.fecha || ''
  const price = experience.precio || experience.price || ''
  const place = experience.lugar || ''
  const message = `Hola! Quiero reservar la experiencia "${title}" del ${date} (${price}) en ${place}. ¿Queda plaza? Mi nombre es:`

  return whatsappLink(message)
}

let experiencesSubscription = null

const readExperiences = async () => {
  const { data, error } = await supabase
    .from('experiencias')
    .select('titulo,fecha,precio,lugar,descripcion,imagen_url')
    .order('created_at', { ascending: false })
    .limit(LANDING_EVENTS_LIMIT)

  if (error) throw error
  return data || []
}

const renderLandingEvent = (experience) => {
  const title = escapeHTML(experience.titulo || 'Experiencia Viajes Sonoros')
  const date = escapeHTML(
    experience.fecha_texto || experience.fecha || 'Fecha por confirmar',
  )
  const place = escapeHTML(experience.lugar || 'Lugar por confirmar')
  const price = escapeHTML(experience.precio || experience.price || '')
  const description = escapeHTML(experience.descripcion || '')
  const status = escapeHTML(
    experience.badge ||
      experience.estado ||
      experience.status ||
      'Próxima experiencia',
  )
  const iconName = getEventIcon(experience)

  return `
    <article class="event-card reveal is-visible">
      <div class="event-image">
        <img
          src="${escapeHTML(safeImageURL(experience.imagen_url))}"
          alt="${title}"
          loading="lazy"
        >
        <span class="event-tag">${status}</span>
      </div>
      <span class="round-icon event-icon" aria-hidden="true">${icons[iconName]}</span>
      <div class="event-content">
        <h3>${title}</h3>
        <ul>
          <li>${date}</li>
          <li>${place}</li>
          ${price ? `<li>${price}</li>` : ''}
        </ul>
        ${description ? `<p class="event-description">${description}</p>` : ''}
        <a
          class="event-button"
          href="${getEventWhatsAppLink(experience)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Reservar por WhatsApp
          ${renderIcon('whatsapp', 'icon-brand icon-whatsapp')}
        </a>
      </div>
    </article>
  `
}

const app = document.querySelector('#app')

app.innerHTML = `
  <a class="skip-link" href="#contenido">Saltar al contenido</a>

  <header class="site-header" data-header>
    <div class="container header-inner">
      <a class="brand" href="#inicio" aria-label="Viajes Sonoros, ir al inicio">
        <img src="/logo-viajes-sonoros.png" alt="Viajes Sonoros FEEL">
      </a>

      <button
        class="menu-toggle"
        type="button"
        aria-controls="main-nav"
        aria-expanded="false"
        aria-label="Abrir menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav class="main-nav" id="main-nav" aria-label="Navegación principal">
        <a class="active" href="#inicio">Inicio</a>
        <a href="#experiencias">Experiencias</a>
        <a href="#instrumentos">Instrumentos</a>
        <a href="/experiencias.html">Próximas fechas</a>
        <a href="#tienda">Tienda</a>
        <a href="#nosotros">Sobre nosotros</a>
        <a href="#contacto">Contacto</a>
      </nav>
    </div>
  </header>

  <main id="contenido">
    <section class="hero" id="inicio" aria-labelledby="hero-title">
      <div class="container hero-inner">
        <div class="hero-copy reveal">
          <div class="hero-ornament" aria-hidden="true">
            <span></span>
            <b>${renderIcon('heart')}</b>
            <span></span>
          </div>
          <h1 id="hero-title">Detén el tiempo.<strong>Vuelve a ti.</strong></h1>
          <p>
            Experiencias de sonido, meditación,<br>
            relajación profunda y conexión interior.
          </p>
          <div class="hero-actions">
            <a class="button button-primary" href="/experiencias.html">
              Ver próximas experiencias ${renderIcon('arrow', 'icon-arrow')}
            </a>
            <a
              class="button button-whatsapp"
              href="${links.general}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${renderIcon('whatsapp', 'icon-brand icon-whatsapp')}
              Reservar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="intro-section" aria-labelledby="intro-title">
      <div class="container intro-inner reveal">
        <span class="lotus-mark" aria-hidden="true">${icons.lotus}</span>
        <h2 id="intro-title">Mucho más que un concierto</h2>
        <p>
          Un viaje sonoro para recordar quién eres. Vibración, presencia y calma
          para conectar contigo y con lo esencial.
        </p>
        <span class="heart-mark" aria-hidden="true">${icons.heart}</span>
      </div>
    </section>

    <section class="experiences-section" id="experiencias" aria-labelledby="experiences-title">
      <div class="container editorial-layout">
        <aside class="section-intro reveal">
          <p class="eyebrow">Experiencias</p>
          <h2 id="experiences-title">Elige tu<br>camino.</h2>
          <span class="short-line" aria-hidden="true"></span>
          <p>Propuestas únicas para cada momento de tu vida.</p>
          <a class="outline-link" href="/experiencias.html">
            Ver todas las experiencias
          </a>
        </aside>

        <div class="experience-grid">
          ${experiences
            .map(
              ({ image, icon, title, description }) => `
                <article class="experience-card reveal">
                  <div class="experience-image">
                    <img src="${image}" alt="${title}" loading="lazy">
                  </div>
                  <span class="round-icon" aria-hidden="true">${icons[icon]}</span>
                  <div class="experience-content">
                    <h3>${title}</h3>
                    <p>${description}</p>
                  </div>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="instruments-section" id="instrumentos" aria-labelledby="instruments-title">
      <div class="container editorial-layout instruments-layout">
        <aside class="section-intro reveal">
          <p class="eyebrow">Instrumentos</p>
          <h2 id="instruments-title">Sonidos que<br>te transforman.</h2>
        </aside>

        <div class="instrument-grid">
          ${instruments
            .map(
              ({ image, title }) => `
                <article class="instrument reveal">
                  <div class="instrument-image">
                    <img src="${image}" alt="${title}" loading="lazy">
                  </div>
                  <h3>${title}</h3>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="journey-section" aria-labelledby="journey-title">
      <div class="container editorial-layout journey-layout">
        <aside class="section-intro reveal">
          <p class="eyebrow">Qué vivirás</p>
          <h2 id="journey-title">Un viaje en<br>tres pasos.</h2>
        </aside>

        <div class="steps">
          ${steps
            .map(
              ({ number, title, description }, index) => `
                <article class="step reveal">
                  <span class="step-number">${number}</span>
                  <div>
                    <h3>${title}</h3>
                    <p>${description}</p>
                  </div>
                  ${
                    index < steps.length - 1
                      ? `<span class="step-arrow" aria-hidden="true">${icons.arrow}</span>`
                      : ''
                  }
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="events-section" id="eventos" aria-labelledby="events-title">
      <div class="container editorial-layout">
        <aside class="section-intro reveal">
          <p class="eyebrow">Próximos eventos</p>
          <h2 id="events-title">Próximos<br>eventos</h2>
          <p>Próximas experiencias para encontrarte, respirar y volver a ti.</p>
          <a class="outline-link" href="/experiencias.html">
            Ver agenda completa ${renderIcon('arrow', 'icon-arrow')}
          </a>
        </aside>

        <div
          class="events-grid"
          id="landing-events"
          aria-live="polite"
          aria-busy="true"
        >
          <div class="events-loading" role="status">
            Cargando próximas experiencias…
          </div>
        </div>
      </div>
    </section>

    <section class="about-section" id="nosotros" aria-labelledby="about-title">
      <div class="container">
        <article class="about-block reveal">
          <p class="eyebrow">Sobre nosotros</p>
          <h2 id="about-title">María de la Osa & José Duque</h2>
          <p>
            Músicos, facilitadores y viajeros del alma. Nuestro camino une la
            música, la meditación y el sonido como medicina para acompañarte de
            vuelta a ti.
          </p>
          <a class="outline-link" href="#contacto">
            Conócenos mejor ${renderIcon('arrow', 'icon-arrow')}
          </a>
          <span class="about-lotus" aria-hidden="true">${icons.lotus}</span>
        </article>
      </div>
    </section>

    <section class="shop-section" id="tienda" aria-labelledby="shop-title">
      <div class="container shop-block">
          <div class="shop-intro reveal">
            <p class="eyebrow">Tienda</p>
            <h2 id="shop-title">Lleva el sonido contigo.</h2>
            <p>Recursos para tu práctica diaria y tu bienestar.</p>
            <a class="outline-link" href="#tienda">
              Ver toda la tienda ${renderIcon('arrow', 'icon-arrow')}
            </a>
          </div>

          <div class="product-grid">
            <article class="product-card product-card-usb reveal">
              <div class="product-image">
                <img
                  src="/tarjeta-oficial.jpeg"
                  alt="Tarjeta USB de Viajes Sonoros"
                  loading="lazy"
                >
              </div>
              <div class="product-content">
                <h3>Tarjeta USB</h3>
                <strong>10 € <small>+ envío</small></strong>
                <p>
                  Contiene audio listo para tu práctica diaria. Música,
                  meditaciones y recursos para inspirarte.
                </p>
                <a
                  class="product-button"
                  href="${links.usbCard}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ${renderIcon('whatsapp', 'icon-brand icon-whatsapp')}
                  Pedir por WhatsApp
                </a>
              </div>
            </article>

            <article class="product-card product-card-wood reveal">
              <div class="product-image">
                <img
                  src="/pendrive-oficial.jpg"
                  alt="Pendrive de madera de Viajes Sonoros"
                  loading="lazy"
                >
              </div>
              <div class="product-content">
                <h3>Pendrive de madera</h3>
                <strong>20 € <small>+ envío</small></strong>
                <p>
                  Belleza natural con todo el contenido de Viajes Sonoros. Un
                  bonito regalo para ti o para alguien especial.
                </p>
                <a
                  class="product-button"
                  href="${links.woodenDrive}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ${renderIcon('whatsapp', 'icon-brand icon-whatsapp')}
                  Pedir por WhatsApp
                </a>
              </div>
            </article>
          </div>
      </div>
    </section>

    <section class="final-quote" aria-label="Frase final">
      <div class="container final-quote-inner reveal">
        <p>
          El viaje más importante no es el que haces hacia un lugar,<br>
          sino el que te devuelve a ti.
        </p>
        <a
          class="button button-gold"
          href="${links.general}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Reserva tu experiencia ${renderIcon('arrow', 'icon-arrow')}
        </a>
      </div>
    </section>
  </main>

  <footer class="site-footer" id="contacto">
    <div class="container footer-grid">
      <a class="footer-logo" href="#inicio" aria-label="Volver al inicio">
        <img src="/logo-viajes-sonoros.png" alt="Viajes Sonoros FEEL">
      </a>
      <a
        class="contact-item"
        href="tel:+34610056859"
      >
        ${renderIcon('whatsapp', 'contact-icon icon-brand icon-whatsapp')}
        <small>WhatsApp</small>
        <strong>610 056 859</strong>
      </a>
      <a class="contact-item" href="mailto:info@viajessonoros.es">
        ${renderIcon('mail', 'contact-icon')}
        <small>Email</small>
        <strong>info@viajessonoros.es</strong>
      </a>
      <a class="contact-item" href="https://instagram.com/viajessonoros" target="_blank" rel="noopener noreferrer">
        ${renderIcon('instagram', 'contact-icon icon-instagram')}
        <small>Instagram</small>
        <strong>@viajessonoros</strong>
      </a>
      <a class="contact-item" href="https://viajessonoros.es" target="_blank" rel="noopener noreferrer">
        ${renderIcon('globe', 'contact-icon')}
        <small>Web</small>
        <strong>viajessonoros.es</strong>
      </a>
    </div>
    <div class="footer-bottom">
      <nav class="legal-links" aria-label="Información legal">
        <a href="/aviso-legal.html">Aviso Legal</a>
        <a href="/politica-privacidad.html">Privacidad</a>
        <a href="/politica-cookies.html">Cookies</a>
        <a href="/condiciones-reserva.html">Condiciones</a>
      </nav>
      <p>© ${new Date().getFullYear()} Viajes Sonoros Feel · Todos los derechos reservados</p>
    </div>
  </footer>

  <button class="back-to-top" type="button" aria-label="Volver arriba">↑</button>
`

const eventsGrid = document.querySelector('#landing-events')
let eventsRequestId = 0

const loadLandingEvents = async () => {
  const requestId = ++eventsRequestId
  eventsGrid.setAttribute('aria-busy', 'true')

  try {
    const experiences = await readExperiences()
    if (requestId !== eventsRequestId) return

    eventsGrid.innerHTML = experiences.length
      ? experiences.map(renderLandingEvent).join('')
      : `
          <div class="events-empty">
            <strong>No hay próximas experiencias publicadas.</strong>
            <span>Consulta la agenda completa para conocer nuevas fechas.</span>
            <a class="outline-link" href="/experiencias.html">
              Ver agenda completa ${renderIcon('arrow', 'icon-arrow')}
            </a>
          </div>
        `
  } catch (error) {
    if (requestId !== eventsRequestId) return

    console.error('No se pudieron cargar las experiencias:', error)
    eventsGrid.innerHTML = `
      <div class="events-empty events-error">
        <strong>No hemos podido cargar las próximas experiencias.</strong>
        <a class="outline-link" href="/experiencias.html">
          Consultar la página Experiencias ${renderIcon('arrow', 'icon-arrow')}
        </a>
      </div>
    `
  } finally {
    if (requestId === eventsRequestId) {
      eventsGrid.setAttribute('aria-busy', 'false')
    }
  }
}

const startExperiencesSync = () => {
  if (experiencesSubscription) return

  experiencesSubscription = supabase
    .channel('landing-eventos')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'experiencias',
      },
      loadLandingEvents,
    )
    .subscribe()
}

const header = document.querySelector('[data-header]')
const menuButton = document.querySelector('.menu-toggle')
const navigation = document.querySelector('.main-nav')
const backToTop = document.querySelector('.back-to-top')
const navigationLinks = [...navigation.querySelectorAll('a')]
const internalLinks = navigationLinks.filter((link) =>
  link.getAttribute('href').startsWith('#'),
)
const trackedSections = internalLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean)

const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false')
  menuButton.setAttribute('aria-label', 'Abrir menú')
  navigation.classList.remove('is-open')
  document.body.classList.remove('menu-open')
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true'
  const nextState = !isOpen

  menuButton.setAttribute('aria-expanded', String(nextState))
  menuButton.setAttribute('aria-label', nextState ? 'Cerrar menú' : 'Abrir menú')
  navigation.classList.toggle('is-open', nextState)
  document.body.classList.toggle('menu-open', nextState)
})

navigationLinks.forEach((link) => link.addEventListener('click', closeMenu))

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu()
})

const updateScrollState = () => {
  const scrollTop = window.scrollY
  const marker = scrollTop + window.innerHeight * 0.32
  let activeSection = 'inicio'

  header.classList.toggle('is-scrolled', scrollTop > 24)
  backToTop.classList.toggle('is-visible', scrollTop > 600)

  trackedSections.forEach((section) => {
    if (section.offsetTop <= marker) activeSection = section.id
  })

  internalLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${activeSection}`
    link.classList.toggle('active', isActive)

    if (isActive) {
      link.setAttribute('aria-current', 'page')
    } else {
      link.removeAttribute('aria-current')
    }
  })
}

let scrollFramePending = false

window.addEventListener(
  'scroll',
  () => {
    if (scrollFramePending) return
    scrollFramePending = true

    window.requestAnimationFrame(() => {
      updateScrollState()
      scrollFramePending = false
    })
  },
  { passive: true },
)

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeMenu()
})

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

const revealElements = document.querySelectorAll('.reveal')

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries, revealObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        revealObserver.unobserve(entry.target)
      })
    },
    {
      rootMargin: '0px 0px -7% 0px',
      threshold: 0.08,
    },
  )

  revealElements.forEach((element) => observer.observe(element))
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'))
}

updateScrollState()
loadLandingEvents()
startExperiencesSync()

window.addEventListener('storage', (event) => {
  if (event.key === 'vs_eventos' || event.key === 'sb_anon_key') {
    loadLandingEvents()
    startExperiencesSync()
  }
})

window.addEventListener('focus', loadLandingEvents)

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') loadLandingEvents()
})
