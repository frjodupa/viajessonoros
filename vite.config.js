import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve('index.html'),
        experiencias: resolve('experiencias.html'),
        resetPassword: resolve('reset-password.html'),
      },
    },
  },
})
