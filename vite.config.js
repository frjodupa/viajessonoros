import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve('index.html'),
        experiencias: resolve('experiencias.html'),
        tarjetaUsb: resolve('tarjeta-usb.html'),
        pendriveMadera: resolve('pendrive-madera.html'),
        resetPassword: resolve('reset-password.html'),
      },
    },
  },
})
