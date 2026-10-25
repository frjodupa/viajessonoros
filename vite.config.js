import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve('index.html'),
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
