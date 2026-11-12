import { test, expect } from '@playwright/test'

// Comprobaciones públicas, sin iniciar sesión, escribir datos ni crear reservas.
const baseURL = 'https://viajessonoros.es'

test('la portada pública responde y muestra la marca', async ({ page }) => {
  const response = await page.goto(baseURL + '/', { waitUntil: 'domcontentloaded' })
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('body')).toContainText(/Viajes Sonoros/i)
})

test('la experiencia conserva su enlace a reserva', async ({ page }) => {
  const response = await page.goto(baseURL + '/viaje-sonoro-24-octubre-2026.html', { waitUntil: 'domcontentloaded' })
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('a[href*="reserva.html?experiencia=14"]')).toBeVisible()
  await expect(page.locator('img.visual')).toBeVisible()
})

test('formulario accesible sin enviar ninguna solicitud', async ({ page }) => {
  const response = await page.goto(baseURL + '/reserva.html?experiencia=14', { waitUntil: 'domcontentloaded' })
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('h1')).toContainText(/Reserva tu experiencia/i)
  // No se pulsa el botón, no se rellena el formulario y no hay mutaciones.
  await expect(page.locator('#form')).toHaveCount(1)
})
