(() => {
  const MEASUREMENT_ID = 'G-V4CKPNWQGV'
  const CONSENT_KEY = 'vs_analytics_consent'
  const POLICY_VERSION = '2026-08-20'
  const pendingEvents = []
  let analyticsLoaded = false

  const readConsent = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONSENT_KEY))
      return saved?.version === POLICY_VERSION ? saved.choice : null
    } catch {
      return null
    }
  }

  let consent = readConsent()

  const deleteAnalyticsCookies = () => {
    document.cookie.split(';').forEach((entry) => {
      const name = entry.split('=')[0].trim()
      if (!name.startsWith('_ga')) return
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.viajessonoros.es; SameSite=Lax`
    })
  }

  const loadAnalytics = () => {
    if (analyticsLoaded || consent !== 'accepted') return
    analyticsLoaded = true
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    })

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
    script.dataset.vsAnalytics = 'true'
    document.head.append(script)

    pendingEvents.splice(0).forEach(({ name, parameters }) => {
      window.gtag('event', name, parameters)
    })
  }

  const track = (name, parameters = {}) => {
    if (consent === 'rejected') return
    const event = {
      name,
      parameters: { ...parameters, page_location: window.location.href },
    }
    if (consent !== 'accepted') {
      pendingEvents.push(event)
      return
    }
    loadAnalytics()
    window.gtag('event', event.name, event.parameters)
  }

  const updatePolicyControls = () => {
    document.querySelectorAll('[data-consent-status]').forEach((element) => {
      element.textContent = consent === 'accepted'
        ? 'Analíticas aceptadas.'
        : consent === 'rejected'
          ? 'Analíticas rechazadas.'
          : 'Todavía no has guardado una elección.'
    })
  }

  const closeBanner = () => document.querySelector('.analytics-consent')?.remove()

  const saveConsent = (choice) => {
    consent = choice
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, version: POLICY_VERSION }))
    } catch { /* El bloqueo del almacenamiento no debe impedir aplicar la elección actual. */ }
    closeBanner()
    updatePolicyControls()
    if (choice === 'accepted') {
      window[`ga-disable-${MEASUREMENT_ID}`] = false
      loadAnalytics()
    } else {
      pendingEvents.length = 0
      window[`ga-disable-${MEASUREMENT_ID}`] = true
      deleteAnalyticsCookies()
    }
  }

  const showBanner = () => {
    if (consent || document.querySelector('.analytics-consent')) return
    const banner = document.createElement('section')
    banner.className = 'analytics-consent'
    banner.setAttribute('role', 'region')
    banner.setAttribute('aria-label', 'Preferencias de analítica')
    banner.setAttribute('aria-describedby', 'analytics-consent-description')
    banner.innerHTML = `
      <div class="analytics-consent-inner">
        <div class="analytics-consent-copy">
          <h2>Ayúdanos a mejorar tu experiencia</h2>
          <p id="analytics-consent-description">Nos gustaría conocer, de forma anónima, qué contenidos te resultan más útiles para seguir mejorando Viajes Sonoros. Solo activaremos Google Analytics si nos das permiso. Gracias por ayudarnos a cuidar este espacio.</p>
          <a href="/politica-cookies.html">Más información sobre privacidad</a>
        </div>
        <div class="analytics-consent-actions">
          <button type="button" data-consent-choice="rejected">Ahora no</button>
          <button type="button" data-consent-choice="accepted">Sí, acepto</button>
        </div>
      </div>
    `
    document.body.append(banner)
  }

  const getProductName = (target) => target.closest('.product-detail-body, .product-card, .product-page-copy, .mobile-buy-bar')
    ?.querySelector('h1, h2, h3, strong')?.textContent.trim() || document.querySelector('.product-page-copy h1')?.textContent.trim()

  const getExperienceName = (target) => target.closest('.experience-detail-body, .experience-card-content, .experience-public-card, .event-card')
    ?.querySelector('h2, h3')?.textContent.trim()

  const getButtonLocation = (target) => {
    if (target.closest('.product-detail-dialog')) return 'product_modal'
    if (target.closest('.product-page-main, .mobile-buy-bar')) return 'product_page'
    if (target.closest('.product-card')) return 'product_card'
    if (target.closest('.experience-detail-dialog')) return 'experience_modal'
    if (target.closest('.experience-public-card, .event-card')) return 'experience_card'
    if (target.closest('.events-capture, .experiences-empty')) return 'diffusion_capture'
    return 'page'
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('a, button')
    if (!target) return
    const choice = target.dataset.consentChoice
    if (choice) {
      saveConsent(choice)
      return
    }

    const text = target.textContent.replace(/\s+/g, ' ').trim()
    const buttonLocation = getButtonLocation(target)
    const productName = getProductName(target)
    const experienceName = getExperienceName(target)

    if ((/^Elegir\b/i.test(text) || target.matches('.product-detail-button')) && productName) {
      track('product_select', { product_name: productName, button_location: buttonLocation })
    }
    if (/Comprar por WhatsApp/i.test(text) && productName) {
      track('whatsapp_purchase', { product_name: productName, button_location: buttonLocation })
    }
    if (target.matches('.whatsapp-reserve-button')) {
      track('experience_whatsapp', { experience_name: experienceName || 'Próximas experiencias', button_location: buttonLocation })
    }
    if (target.matches('.broadcast-list-link') || /lista de difusión|próximas fechas/i.test(text)) {
      track('diffusion_list_click', { button_location: buttonLocation })
    }
  })

  window.vsAnalytics = { track, accept: () => saveConsent('accepted'), reject: () => saveConsent('rejected') }

  if (consent === 'accepted') loadAnalytics()
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      showBanner()
      updatePolicyControls()
    }, { once: true })
  } else {
    showBanner()
    updatePolicyControls()
  }
})()
