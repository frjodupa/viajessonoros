import './style.css'

const whatsappUrl =
  'https://wa.me/34610056859?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20las%20experiencias%20de%20Viajes%20Sonoros.'

document.querySelector('#app').innerHTML = `
  <header class="site-header" id="cabecera">
    <div class="container header-inner">
      <a class="brand" href="#inicio" aria-label="Ir al inicio">
        <img src="/logo-viajes-sonoros.png" alt="Viajes Sonoros FEEL">
      </a>

      <button
        class="menu-toggle"
        type="button"
        aria-expanded="false"
        aria-controls="main-nav"
      >
        <span></span>
        <span></span>
        <span></span>
        <span class="sr-only">Abrir menú</span>
      </button>

      <nav
        class="main-nav"
        id="main-nav"
        aria-label="Navegación principal"
      >
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

  <main>
    <section class="hero" id="inicio">
      <div class="container hero-grid">
        <div class="hero-content reveal">
          <div class="ornament" aria-hidden="true">
            <span></span>
            <b>✦</b>
            <span></span>
          </div>

          <p class="eyebrow">
            Experiencias de sonido y presencia
          </p>

          <h1>
            Detén el tiempo.
            <strong>Vuelve a ti.</strong>
          </h1>

          <p class="hero-copy">
            Sonido, meditación, relajación profunda y conexión interior
            en experiencias creadas para sentir, respirar y estar presente.
          </p>

          <div class="hero-actions">
            <a
              class="button button-primary"
              href="./experiencias.html"
            >
              Ver próximas experiencias
              <span aria-hidden="true">→</span>
            </a>

            <a
              class="button button-secondary"
              href="${whatsappUrl}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Reservar por WhatsApp
            </a>
          </div>
        </div>

        <figure class="hero-photo reveal">
          <img
            src="/hero-maria-jose.jpg"
            alt="María de la Osa y José Duque en un entorno natural"
          >
        </figure>
      </div>
    </section>

    <section
      class="section experiences-section"
      id="experiencias"
    >
      <div class="container">
        <header class="section-heading reveal">
          <p class="eyebrow">Experiencias</p>

          <h2>
            Mucho más que un concierto
          </h2>

          <p>
            Un viaje sonoro para recordar quién eres.
            Vibración, presencia y calma para conectar
            contigo y con lo esencial.
          </p>
        </header>

        <div class="experience-grid">
          <article class="experience-card reveal">
            <div class="experience-image">
              <img
                src="/experiencia-grupo.jpg"
                alt="Viaje sonoro en grupo"
              >
            </div>

            <div class="experience-body">
              <span>01</span>

              <h3>
                Viajes sonoros en grupo
              </h3>

              <p>
                Sesiones colectivas para compartir silencio,
                escucha, relajación y presencia.
              </p>
            </div>
          </article>

          <article class="experience-card reveal">
            <div class="experience-image">
              <img
                src="/experiencia-privada.jpg"
                alt="Sesión privada de sonido"
              >
            </div>

            <div class="experience-body">
              <span>02</span>

              <h3>
                Sesiones privadas
              </h3>

              <p>
                Una experiencia cercana y personalizada,
                adaptada al momento de cada persona.
              </p>
            </div>
          </article>

          <article class="experience-card reveal">
            <div class="experience-image">
              <img
                src="/experiencia-retiros.jpg"
                alt="Experiencia de sonido para retiros y hoteles"
              >
            </div>

            <div class="experience-body">
              <span>03</span>

              <h3>
                Empresas, retiros y hoteles
              </h3>

              <p>
                Propuestas de bienestar para equipos,
                encuentros y espacios con sensibilidad.
              </p>
            </div>
          </article>

          <article class="experience-card reveal">
            <div class="experience-image">
              <img
                src="/experiencia-conciertos.jpg"
                alt="Concierto temático"
              >
            </div>

            <div class="experience-body">
              <span>04</span>

              <h3>
                Conciertos temáticos
              </h3>

              <p>
                Una puesta en escena envolvente para vivir
                el sonido con todos los sentidos.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section
      class="section instruments-section"
      id="instrumentos"
    >
      <div class="container">
        <div class="instruments-intro reveal">
          <p class="eyebrow">Instrumentos</p>

          <h2>
            Sonidos que abren espacios interiores
          </h2>

          <p>
            Cada instrumento aporta una textura distinta.
            Juntos crean un paisaje orgánico, profundo y delicado
            que invita a bajar el ritmo y escuchar.
          </p>
        </div>

        <div class="instrument-stage">
          <article
            class="instrument-feature instrument-feature-main reveal"
          >
            <img
              src="/instrumentos-handpan.jpg"
              alt="Handpan"
            >

            <div class="instrument-caption">
              <span>01</span>

              <h3>Handpan</h3>

              <p>
                Melodía, pulso y resonancia.
              </p>
            </div>
          </article>

          <article class="instrument-feature reveal">
            <img
              src="/instrumentos-kora.jpg"
              alt="Kora africana"
            >

            <div class="instrument-caption">
              <span>02</span>

              <h3>Kora</h3>

              <p>
                Cuerdas cálidas y envolventes.
              </p>
            </div>
          </article>

          <article class="instrument-feature reveal">
            <img
              src="/instrumentos-cuencos.jpg"
              alt="Cuencos sonoros"
            >

            <div class="instrument-caption">
              <span>03</span>

              <h3>Cuencos</h3>

              <p>
                Vibración sutil y sostenida.
              </p>
            </div>
          </article>

          <article class="instrument-feature reveal">
            <img
              src="/instrumentos-gong.jpg"
              alt="Gong"
            >

            <div class="instrument-caption">
              <span>04</span>

              <h3>Gong</h3>

              <p>
                Profundidad, amplitud y presencia.
              </p>
            </div>
          </article>

          <article class="instrument-feature reveal">
            <img
              src="/instrumentos-naturaleza.jpg"
              alt="Instrumentos inspirados en la naturaleza"
            >

            <div class="instrument-caption">
              <span>05</span>

              <h3>Naturaleza</h3>

              <p>
                Agua, semillas, viento y texturas orgánicas.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section
      class="section about-section"
      id="nosotros"
    >
      <div class="container about-grid">
        <figure class="about-photo reveal">
          <img
            src="/sobre-viajes-sonoros2.jpg"
            alt="María de la Osa y José Duque, fundadores de Viajes Sonoros"
          >
        </figure>

        <div class="about-content reveal">
          <p class="eyebrow">
            Sobre Viajes Sonoros
          </p>

          <h2>
            Una experiencia creada desde la escucha
          </h2>

          <p class="about-lead">
            Viajes Sonoros nace del encuentro entre la voz,
            los instrumentos acústicos, la sensibilidad y el deseo
            de crear espacios de calma.
          </p>

          <p>
            María de la Osa y José Duque diseñan cada sesión
            con cuidado, respetando el ritmo del grupo,
            el lugar y la intención de cada encuentro.
          </p>

          <div class="about-signature">
            <strong>
              María de la Osa · José Duque
            </strong>

            <span>
              Voz, instrumentos y creación sonora
            </span>
          </div>
        </div>
      </div>
    </section>

    <section
      class="section quote-section"
      aria-label="Filosofía"
    >
      <div class="container quote-inner reveal">
        <span class="quote-mark">“</span>

        <blockquote>
          A veces no necesitamos hacer más.
          Solo detenernos, respirar y permitir
          que el sonido nos devuelva al presente.
        </blockquote>

        <span class="quote-line"></span>
      </div>
    </section>

    <section
      class="section dates-section"
      id="eventos"
    >
      <div class="container dates-grid">
        <div class="dates-copy reveal">
          <p class="eyebrow">
            Próximas experiencias
          </p>

          <h2>
            Encuentra tu próximo viaje
          </h2>

          <p>
            Consulta las próximas fechas, lugares y formatos disponibles.
            Las plazas suelen ser limitadas para cuidar
            la calidad de cada encuentro.
          </p>
        </div>

        <div class="dates-card reveal">
          <p>
            Calendario actualizado
          </p>

          <h3>
            Próximas fechas y reservas
          </h3>

          <a
            class="button button-primary"
            href="./experiencias.html"
          >
            Consultar experiencias
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>

    <section
      class="section shop-section"
      id="tienda"
    >
      <div class="container shop-inner reveal">
        <div>
          <p class="eyebrow">
            Tienda
          </p>

          <h2>
            Objetos para continuar el viaje
          </h2>

          <p>
            Estamos preparando una selección cuidada
            de instrumentos, bonos, experiencias y materiales
            vinculados al sonido y la presencia.
          </p>
        </div>

        <span class="coming-soon">
          Próximamente
        </span>
      </div>
    </section>

    <section
      class="section contact-section"
      id="contacto"
    >
      <div class="container contact-inner reveal">
        <p class="eyebrow">
          Reserva e información
        </p>

        <h2>
          Tu próxima experiencia puede comenzar aquí
        </h2>

        <p>
          Escríbenos para conocer próximas fechas,
          sesiones privadas, colaboraciones o propuestas
          para espacios y equipos.
        </p>

        <a
          class="button button-light"
          href="${whatsappUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Hablar por WhatsApp
          <span aria-hidden="true">→</span>
        </a>

        <strong>
          610 056 859
        </strong>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <a
        class="footer-brand"
        href="#inicio"
      >
        <img
          src="/logo-viajes-sonoros.png"
          alt="Viajes Sonoros FEEL"
        >
      </a>

      <p>
        Sonido · bienestar · presencia · conexión interior
      </p>

      <div class="footer-links">
        <a href="#experiencias">
          Experiencias
        </a>

        <a href="./experiencias.html">
          Próximas fechas
        </a>

        <a href="#contacto">
          Contacto
        </a>
      </div>
    </div>

    <div class="container footer-bottom">
      <span>
        © ${new Date().getFullYear()} Viajes Sonoros FEEL
      </span>

      <a href="#inicio">
        Volver al inicio
      </a>
    </div>
  </footer>

  <button
    class="back-to-top"
    type="button"
    aria-label="Volver arriba"
  >
    ↑
  </button>
`

const header = document.querySelector('.site-header')
const menuButton = document.querySelector('.menu-toggle')
const nav = document.querySelector('.main-nav')
const backToTop = document.querySelector('.back-to-top')

const navLinks = [
  ...document.querySelectorAll(
    '.main-nav a[href^="#"]'
  ),
]

const sections = [
  ...document.querySelectorAll(
    'main section[id]'
  ),
]

const revealItems = [
  ...document.querySelectorAll(
    '.reveal'
  ),
]

menuButton.addEventListener('click', () => {
  const isOpen =
    menuButton.getAttribute('aria-expanded') === 'true'

  menuButton.setAttribute(
    'aria-expanded',
    String(!isOpen)
  )

  nav.classList.toggle(
    'is-open',
    !isOpen
  )

  document.body.classList.toggle(
    'menu-open',
    !isOpen
  )
})

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute(
      'aria-expanded',
      'false'
    )

    nav.classList.remove('is-open')
    document.body.classList.remove('menu-open')
  })
})

const updateOnScroll = () => {
  const scrollY = window.scrollY

  header.classList.toggle(
    'is-scrolled',
    scrollY > 24
  )

  backToTop.classList.toggle(
    'is-visible',
    scrollY > 650
  )

  let current = 'inicio'

  sections.forEach((section) => {
    if (
      scrollY >=
      section.offsetTop - 180
    ) {
      current = section.id
    }
  })

  navLinks.forEach((link) => {
    link.classList.toggle(
      'active',
      link.getAttribute('href') ===
        `#${current}`
    )
  })
}

window.addEventListener(
  'scroll',
  updateOnScroll,
  { passive: true }
)

updateOnScroll()

backToTop.addEventListener(
  'click',
  () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
)

const revealObserver =
  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return
        }

        entry.target.classList.add(
          'is-visible'
        )

        revealObserver.unobserve(
          entry.target
        )
      })
    },
    {
      threshold: 0.12,
    }
  )

revealItems.forEach((item) => {
  revealObserver.observe(item)
})
