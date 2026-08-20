import './audio-player.css'

export const productAudioSamples = [
  {
    title: 'Arco de la Estrella',
    src: '/audios/muestra-arco-de-la-estrella.mp3',
  },
  {
    title: 'Flauta doble F#',
    src: '/audios/muestra-flauta-doble-f-sharp.mp3',
  },
  {
    title: 'Lokah Samastah',
    src: '/audios/muestra-lokah-samastah-desde-el-inicio.mp3',
  },
  {
    title: 'Suspiros — en vivo',
    src: '/audios/muestra-suspiros-en-vivo.mp3',
  },
]

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

export const productAudioSamplesHTML = (compact = false) => `
  <div class="audio-samples${compact ? ' audio-samples-compact' : ''}" data-audio-player>
    ${productAudioSamples
      .map(
        ({ title, src }, index) => `
          <article class="audio-sample" data-audio-sample>
            <audio preload="metadata" src="${src}" controlslist="nodownload" data-audio></audio>
            <button class="audio-sample-toggle" type="button" aria-label="Reproducir ${title}" aria-pressed="false" data-audio-toggle>
              <span class="audio-play-icon" aria-hidden="true"></span>
            </button>
            <div class="audio-sample-main">
              <strong>${title}</strong>
              <div class="audio-sample-timeline">
                <input type="range" min="0" max="100" value="0" step="0.1" aria-label="Progreso de ${title}" data-audio-progress>
                <span data-audio-time aria-label="Duración">0:00 / 0:00</span>
              </div>
            </div>
          </article>
        `,
      )
      .join('')}
  </div>
`

const pauseOtherSamples = (activeAudio) => {
  document.querySelectorAll('audio[data-audio]').forEach((audio) => {
    if (audio !== activeAudio && !audio.paused) audio.pause()
  })
}

export const installAudioPlayers = (
  root = document,
  { productName = '', buttonLocation = 'audio_player' } = {},
) => {
  root.querySelectorAll('[data-audio-player]').forEach((player) => {
    if (player.dataset.audioPlayerReady === 'true') return
    player.dataset.audioPlayerReady = 'true'

    player.querySelectorAll('[data-audio-sample]').forEach((sample) => {
      const audio = sample.querySelector('[data-audio]')
      const toggle = sample.querySelector('[data-audio-toggle]')
      const progress = sample.querySelector('[data-audio-progress]')
      const time = sample.querySelector('[data-audio-time]')
      const title = sample.querySelector('strong')?.textContent || 'muestra de audio'
      if (!audio || !toggle || !progress || !time) return

      const updateTimeline = () => {
        const duration = Number.isFinite(audio.duration) ? audio.duration : 0
        const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0
        progress.value = duration ? String((currentTime / duration) * 100) : '0'
        time.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`
      }

      const updateState = () => {
        const isPlaying = !audio.paused && !audio.ended
        sample.classList.toggle('is-playing', isPlaying)
        toggle.setAttribute('aria-pressed', String(isPlaying))
        toggle.setAttribute(
          'aria-label',
          `${isPlaying ? 'Pausar' : 'Reproducir'} ${title}`,
        )
      }

      toggle.addEventListener('click', async () => {
        if (audio.paused) {
          pauseOtherSamples(audio)
          try {
            await audio.play()
          } catch {
            updateState()
          }
        } else {
          audio.pause()
        }
      })

      progress.addEventListener('input', () => {
        if (!Number.isFinite(audio.duration) || !audio.duration) return
        audio.currentTime = (Number(progress.value) / 100) * audio.duration
        updateTimeline()
      })

      audio.addEventListener('loadedmetadata', updateTimeline)
      audio.addEventListener('durationchange', updateTimeline)
      audio.addEventListener('timeupdate', updateTimeline)
      audio.addEventListener('play', () => {
        pauseOtherSamples(audio)
        updateState()
        window.vsAnalytics?.track('audio_sample_play', {
          audio_name: title,
          product_name: productName,
          button_location: buttonLocation,
        })
      })
      audio.addEventListener('pause', updateState)
      audio.addEventListener('ended', () => {
        audio.currentTime = 0
        updateTimeline()
        updateState()
      })

      updateTimeline()
      updateState()
    })
  })
}
