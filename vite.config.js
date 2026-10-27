import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [{
    name: 'domus-public-routes',
    enforce: 'post',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.split('?')[0] === '/talleres-domus/') req.url = req.url.replace('/talleres-domus/', '/talleres-domus/index.html')
        next()
      })
    },
    generateBundle(_options, bundle) {
      for (const path of ['public/talleres-domus/index.html', 'public/talleres-domus/admin.html']) {
        const page = bundle[path]
        if (page) {
          delete bundle[path]
          this.emitFile({ type: 'asset', fileName: path.replace(/^public\//, ''), source: page.source })
        }
      }
    },
  }],
  build: {
    rollupOptions: {
      input: {
        main: resolve('index.html'),
        domus: resolve('public/talleres-domus/index.html'),
        domusAdmin: resolve('public/talleres-domus/admin.html'),
        bannersAdmin: resolve('banners-admin.html'),
        experiencias: resolve('experiencias.html'),
        reserva: resolve('reserva.html'),
        reservasPremium: resolve('reservas-premium.html'),
        viajeSonoro24Oct: resolve('viaje-sonoro-24-octubre-2026.html'),
        tarjetaUsb: resolve('tarjeta-usb.html'),
        pendriveMadera: resolve('pendrive-madera.html'),
        resetPassword: resolve('reset-password.html'),
      },
    },
  },
})
