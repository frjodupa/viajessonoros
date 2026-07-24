import './style.css'

const contact = {
  phoneDisplay: '610 056 859',
  phoneLink: 'tel:+34610056859',
  whatsapp:
    'https://wa.me/34610056859?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20las%20experiencias%20de%20Viajes%20Sonoros.',
}

const experiences = [
  {
    image: '/experiencia-grupo.jpg',
    title: 'Viajes sonoros en grupo',
    text: 'Encuentros colectivos para compartir silencio, escucha, relajación y presencia.',
    alt: 'Viaje sonoro en grupo',
  },
  {
    image: '/experiencia-privada.jpg',
    title: 'Sesiones privadas',
    text: 'Una experiencia cercana y personalizada, adaptada al momento de cada persona.',
    alt: 'Sesión privada de sonido',
  },
  {
    image: '/experiencia-retiros.jpg',
    title: 'Empresas, retiros y hoteles',
    text: 'Propuestas de bienestar para equipos, encuentros y espacios con sensibilidad.',
    alt: 'Experiencia de sonido para retiros y hoteles',
  },
  {
    image: '/experiencia-conciertos.jpg',
    title: 'Conciertos temáticos',
    text: 'Una puesta en escena envolvente para vivir el sonido con todos los sentidos.',
    alt: 'Concierto temático de Viajes Sonoros',
  },
]

const instruments = [
  {
    image: '/instrumentos-handpan.jpg',
    name: 'Handpan',
    detail: 'Melodía y resonancia',
  },
  {
    image: '/instrumentos-kora.jpg',
    name: 'Kora',
    detail: 'Cuerdas cálidas',
  },
  {
    image: '/instrumentos-cuencos.jpg',
    name: 'Cuencos',
    detail: 'Vibración sutil',
  },
  {
    image: '/instrumentos-gong.jpg',
    name: 'Gong',
    detail: 'Profundidad y presencia',
  },
  {
    image: '/instrumentos-naturaleza.jpg',
    name: 'Naturaleza',
    detail: 'Texturas orgánicas',
  },
]

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
        aria-expanded="false"
        aria-controls="main-nav"
        aria-label="Abrir menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav class="main-nav" id="main-nav" aria-label="Navegación principal">
        <a href="#inicio" class="active">Inicio</a>
        <a href="#experiencias">Experiencias</a>
        <a href="#instrumentos">Instrumentos</a>
        <a href="./experiencias.html">Próximas fechas</a>
        <a href="#tienda">Tienda</a>
        <a href="#nosotros">Sobre nosotros</a>
        <a href="#contacto">Contacto</a>
      </nav>
    </div>
  </header>

  <main id="contenido">
    <section class="hero" id="inicio" aria-labelledby="hero-title">
      <div class="container hero-grid">
        <div class="hero-content reveal">
          <p class="eyebrow">Experiencias de sonido y presencia</p>
          <h1 id="hero-title">Detén el tiempo. <em>Vuelve a ti.</em></h1>
          <p class="hero-copy">
            Sonido, meditación y relajación profunda en experiencias creadas
            para sentir, respirar y volver al presente.
          </p>
          <div class="hero-actions">
            <a class="button button-primary" href="./experiencias.html">
              Ver próximas experiencias
              <span aria-hidden="true">→</span>
            </a>
            <a
              class="button button-ghost"
              href="${contact.whatsapp}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Reservar por WhatsApp
            </a>
          </div>
          <div class="hero-note" aria-label="Características de las experiencias">
            <span>Sonido en directo</span>
            <span>Presencia</span>
            <span>Calma</span>
          </div>
        </div>

        <div class="hero-visual reveal">
          <span class="hero-halo" aria-hidden="true"></span>
          <figure class="hero-photo">
            <img
              src="/hero-maria-jose.jpg"
              alt="María de la Osa y José Duque en un entorno natural"
            >
          </figure>
          <p class="hero-caption">Viajes Sonoros <span>FEEL</span></p>
        </div>
      </div>
    </section>

    <section class="section experiences-section" id="experiencias" aria-labelledby="experiences-title">
      <div class="container">
        <header class="section-heading reveal">
          <p class="eyebrow">Experiencias</p>
          <h2 id="experiences-title">Mucho más que un concierto</h2>
          <p>
            Un viaje sonoro para recordar quién eres. Vibración, presencia y
            calma para conectar contigo y con lo esencial.
          </p>
        </header>

        <div class="experience-grid">
          ${experiences
            .map(
              (experience, index) => `
                <article class="experience-card reveal">
                  <div class="experience-image">
                    <img src="${experience.image}" alt="${experience.alt}" loading="lazy">
                  </div>
                  <div class="experience-body">
                    <span class="card-number">${String(index + 1).padStart(2, '0')}</span>
                    <h3>${experience.title}</h3>
                    <p>${experience.text}</p>
                  </div>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="section instruments-section" id="instrumentos" aria-labelledby="instruments-title">
      <div class="container">
        <header class="section-heading section-heading-narrow reveal">
          <p class="eyebrow">Instrumentos</p>
          <h2 id="instruments-title">Un paisaje sonoro vivo y orgánico</h2>
          <p>
            Cada instrumento aporta una textura distinta. Juntos abren un
            espacio delicado que invita a bajar el ritmo y escuchar.
          </p>
        </header>

        <div class="instrument-row">
          ${instruments
            .map(
              (instrument) => `
                <article class="instrument reveal">
                  <div class="instrument-photo">
                    <img src="${instrument.image}" alt="${instrument.name}" loading="lazy">
                  </div>
                  <h3>${instrument.name}</h3>
                  <p>${instrument.detail}</p>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="section about-section" id="nosotros" aria-labelledby="about-title">
      <div class="container about-grid">
        <div class="about-visual reveal">
          <figure>
            <img
              src="/sobre-viajes-sonoros2.jpg"
              alt="María de la Osa y José Duque, creadores de Viajes Sonoros"
              loading="lazy"
            >
          </figure>
          <span class="about-seal" aria-hidden="true">Sentir<br>·<br>Escuchar</span>
        </div>

        <div class="about-content reveal">
          <p class="eyebrow">Sobre Viajes Sonoros</p>
          <h2 id="about-title">Una experiencia creada desde la escucha</h2>
          <p class="lead">
            Viajes Sonoros nace del encuentro entre la voz, los instrumentos
            acústicos, la sensibilidad y el deseo de crear espacios de calma.
          </p>
          <p>
            María de la Osa y José Duque diseñan cada sesión con cuidado,
            respetando el ritmo del grupo, el lugar y la intención de cada
            encuentro.
          </p>
          <div class="signature">
            <strong>María de la Osa · José Duque</strong>
            <span>Voz, instrumentos y creación sonora</span>
          </div>
        </div>
      </div>
    </section>

    <section class="quote-section" aria-label="Filosofía de Viajes Sonoros">
      <div class="container quote-inner reveal">
        <span class="quote-mark" aria-hidden="true">“</span>
        <blockquote>
          A veces no necesitamos hacer más. Solo detenernos, respirar y
          permitir que el sonido nos devuelva al presente.
        </blockquote>
        <span class="gold-line" aria-hidden="true"></span>
      </div>
    </section>

    <section class="section dates-section" id="eventos" aria-labelledby="dates-title">
      <div class="container dates-panel reveal">
        <div class="dates-copy">
          <p class="eyebrow">Próximas experiencias</p>
          <h2 id="dates-title">Encuentra tu próximo viaje</h2>
          <p>
            Consulta las próximas fechas, lugares y formatos. Las plazas son
            limitadas para cuidar la calidad de cada encuentro.
          </p>
        </div>
        <div class="dates-action">
          <span>Calendario actualizado</span>
          <a class="button button-light" href="./experiencias.html">
            Consultar experiencias
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>

    <section class="section shop-section" id="tienda" aria-labelledby="shop-title">
      <div class="container shop-grid reveal">
        <div class="shop-image">
          <img
            src="/diseno-final-viajes-sonoros.png"
            alt="Diseño editorial de Viajes Sonoros"
            loading="lazy"
          >
        </div>
        <div class="shop-copy">
          <p class="eyebrow">Tienda</p>
          <h2 id="shop-title">Objetos para continuar el viaje</h2>
          <p>
            Estamos preparando una selección cuidada de instrumentos, bonos,
            experiencias y materiales vinculados al sonido y la presencia.
          </p>
          <span class="coming-soon">Próximamente</span>
        </div>
      </div>
    </section>

    <section class="contact-section" id="contacto" aria-labelledby="contact-title">
      <div class="container contact-inner reveal">
        <p class="eyebrow">Reserva e información</p>
        <h2 id="contact-title">Tu próxima experiencia puede comenzar aquí</h2>
        <p>
          Escríbenos para conocer fechas, sesiones privadas, colaboraciones o
          propuestas para espacios y equipos.
        </p>
        <div class="contact-actions">
          <a
            class="button button-light"
            href="${contact.whatsapp}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hablar por WhatsApp
            <span aria-hidden="true">→</span>
          </a>
          <a class="phone-link" href="${contact.phoneLink}">
            ${contact.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-main">
      <a class="footer-brand" href="#inicio" aria-label="Volver al inicio">
        <img src="/logo-viajes-blanco.png" alt="Viajes Sonoros FEEL">
      </a>
      <p>Sonido · bienestar · presencia · conexión interior</p>
      <nav class="footer-links" aria-label="Navegación secundaria">
        <a href="#experiencias">Experiencias</a>
        <a href="./experiencias.html">Próximas fechas</a>
        <a href="#contacto">Contacto</a>
      </nav>
    </div>
    <div class="container footer-bottom">
      <span>© ${new Date().getFullYear()} Viajes Sonoros FEEL</span>
      <a href="#inicio">Volver al inicio ↑</a>
    </div>
  </footer>

  <button class="back-to-top" type="button" aria-label="Volver arriba">↑</button>
`

const header = document.querySelector('[data-header]')
const menuButton = document.querySelector('.menu-toggle')
const navigation = document.querySelector('.main-nav')
const backToTop = document.querySelector('.back-to-top')
const internalNavLinks = [...navigation.querySelectorAll('a[href^="#"]')]
const trackedSections = internalNavLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean)

const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false')
  menuButton.setAttribute('aria-label', 'Abrir menú')
  navigation.classList.remove('is-open')
  document.body.classList.remove('menu-open')
}

menuButton.addEventListener('click', () => {
  const willOpen = menuButton.getAttribute('aria-expanded') !== 'true'

  menuButton.setAttribute('aria-expanded', String(willOpen))
  menuButton.setAttribute('aria-label', willOpen ? 'Cerrar menú' : 'Abrir menú')
  navigation.classList.toggle('is-open', willOpen)
  document.body.classList.toggle('menu-open', willOpen)
})

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu)
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu()
  }
})

const updatePageState = () => {
  const scrollPosition = window.scrollY
  const activationLine = scrollPosition + window.innerHeight * 0.35
  let currentSection = 'inicio'

  header.classList.toggle('is-scrolled', scrollPosition > 24)
  backToTop.classList.toggle('is-visible', scrollPosition > 600)

  trackedSections.forEach((section) => {
    if (section.offsetTop <= activationLine) {
      currentSection = section.id
    }
  })

  internalNavLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${currentSection}`
    link.classList.toggle('active', isActive)

    if (isActive) {
      link.setAttribute('aria-current', 'page')
    } else {
      link.removeAttribute('aria-current')
    }
  })
}

let scrollTicking = false

window.addEventListener(
  'scroll',
  () => {
    if (scrollTicking) return

    window.requestAnimationFrame(() => {
      updatePageState()
      scrollTicking = false
    })

    scrollTicking = true
  },
  { passive: true },
)

window.addEventListener('resize', () => {
  if (window.innerWidth > 860) {
    closeMenu()
  }
})

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

const revealItems = document.querySelectorAll('.reveal')

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return

        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    },
    {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.1,
    },
  )

  revealItems.forEach((item) => revealObserver.observe(item))
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'))
}

updatePageState()
