import './product-page.css'
import { installAudioPlayers, productAudioSamplesHTML } from './audio-player.js'

const samples = document.querySelector('[data-product-samples]')
if (samples) {
  samples.innerHTML = productAudioSamplesHTML()
  installAudioPlayers(samples)
}

const mainBuyButton = document.querySelector('.product-page-buy')
const productName = document.querySelector('.product-page-copy h1')
const productPrice = document.querySelector('.product-page-price')

if (mainBuyButton && productName && productPrice) {
  const mobileBuyBar = document.createElement('aside')
  const normalizedPrice = productPrice.textContent.replace(/\s+/g, ' ').trim()

  mobileBuyBar.className = 'mobile-buy-bar'
  mobileBuyBar.hidden = true
  mobileBuyBar.setAttribute('aria-label', `Compra de ${productName.textContent.trim()}`)
  mobileBuyBar.innerHTML = `
    <div class="mobile-buy-bar-inner">
      <p><strong>${productName.textContent.trim()}</strong><span>${normalizedPrice}</span></p>
      <a
        class="mobile-buy-bar-button"
        href="${mainBuyButton.href}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Comprar ${productName.textContent.trim()} por WhatsApp"
      >Comprar por WhatsApp</a>
    </div>
  `
  document.body.append(mobileBuyBar)

  const isMainBuyButtonVisible = () => {
    const rect = mainBuyButton.getBoundingClientRect()
    return rect.bottom > 0
      && rect.top < window.innerHeight
      && rect.right > 0
      && rect.left < window.innerWidth
  }

  let mainBuyButtonVisible = isMainBuyButtonVisible()
  let updateQueued = false

  const updateMobileBuyBar = () => {
    updateQueued = false
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const shouldShow = isMobile && !mainBuyButtonVisible

    mobileBuyBar.hidden = !shouldShow
    document.body.classList.toggle('mobile-buy-bar-visible', shouldShow)
  }

  const queueMobileBuyBarUpdate = () => {
    if (updateQueued) return
    updateQueued = true
    window.requestAnimationFrame(updateMobileBuyBar)
  }

  const measureAndUpdateMobileBuyBar = () => {
    mainBuyButtonVisible = isMainBuyButtonVisible()
    queueMobileBuyBarUpdate()
  }

  if ('IntersectionObserver' in window) {
    const mainBuyButtonObserver = new IntersectionObserver(([entry]) => {
      mainBuyButtonVisible = entry.isIntersecting
      queueMobileBuyBarUpdate()
    }, { threshold: 0 })

    mainBuyButtonObserver.observe(mainBuyButton)
  } else {
    window.addEventListener('scroll', measureAndUpdateMobileBuyBar, { passive: true })
  }

  window.addEventListener('resize', measureAndUpdateMobileBuyBar)
  window.addEventListener('load', measureAndUpdateMobileBuyBar, { once: true })
  updateMobileBuyBar()
}
