import './product-page.css'
import { installAudioPlayers, productAudioSamplesHTML } from './audio-player.js'

const samples = document.querySelector('[data-product-samples]')
if (samples) {
  samples.innerHTML = productAudioSamplesHTML()
  installAudioPlayers(samples)
}
