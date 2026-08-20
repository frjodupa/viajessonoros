import './product-page.css'
import { installAudioPlayers, productAudioSamplesHTML } from './audio-player.js'

const samples = document.querySelector('[data-product-samples]')
const pageProductName = document.querySelector('.product-page-copy h1')?.textContent.trim() || ''
if (samples) {
  samples.innerHTML = productAudioSamplesHTML()
  installAudioPlayers(samples, {
    productName: pageProductName,
    buttonLocation: 'product_page',
  })
}

window.vsAnalytics?.track('product_detail_view', {
  product_name: pageProductName,
  button_location: 'product_page',
})

const shareButton = document.querySelector('[data-product-share]')
const shareStatus = document.querySelector('[data-share-status]')
const canonicalURL = document.querySelector('link[rel="canonical"]')?.href || window.location.href

const copyProductURL = async () => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(canonicalURL)
    return
  }

  const temporaryInput = document.createElement('textarea')
  temporaryInput.value = canonicalURL
  temporaryInput.setAttribute('readonly', '')
  temporaryInput.style.position = 'fixed'
  temporaryInput.style.opacity = '0'
  document.body.append(temporaryInput)
  temporaryInput.select()
  const copied = document.execCommand('copy')
  temporaryInput.remove()
  if (!copied) throw new Error('No se pudo copiar el enlace')
}

shareButton?.addEventListener('click', async () => {
  shareStatus.textContent = ''
  const shareData = {
    title: pageProductName,
    text: shareButton.dataset.shareText,
    url: canonicalURL,
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
      window.vsAnalytics?.track('product_share', {
        product_name: pageProductName,
        share_method: 'native',
      })
    } catch (error) {
      if (error?.name !== 'AbortError') console.error('No se pudo compartir el producto', error)
    }
    return
  }

  try {
    await copyProductURL()
    shareStatus.textContent = 'Enlace copiado'
    window.vsAnalytics?.track('product_share', {
      product_name: pageProductName,
      share_method: 'clipboard',
    })
  } catch (error) {
    console.error('No se pudo copiar el enlace del producto', error)
  }
})

document.querySelector('[data-product-recommendation]')?.addEventListener('click', (event) => {
  window.vsAnalytics?.track('product_select', {
    product_name: event.currentTarget.dataset.productName,
    button_location: 'product_recommendation',
  })
})

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
