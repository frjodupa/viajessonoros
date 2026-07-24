import { supabase } from './supabase.js'

const form = document.getElementById('reset-form')
const intro = document.getElementById('intro')
const message = document.getElementById('message')
const submitButton = document.getElementById('submit-button')
let recoverySession = false

const showMessage = (text, type = 'error') => {
  message.textContent = text
  message.className = type
}

const showForm = () => {
  recoverySession = true
  intro.textContent = 'Introduce una contraseña segura para proteger tu cuenta.'
  form.hidden = false
  showMessage('')
}

const showExpiredLink = () => {
  if (recoverySession) return
  intro.textContent = 'Este enlace de recuperación no es válido o ha caducado.'
  form.hidden = true
  showMessage('Solicita un nuevo enlace desde la página de administración.')
}

const isStrongPassword = (password) =>
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password)

const hasRecoveryMarker = () => {
  const parameters = new URLSearchParams(
    `${window.location.search.slice(1)}&${window.location.hash.slice(1)}`,
  )
  return parameters.get('type') === 'recovery' || parameters.has('code')
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY' && session) showForm()
})

const { data, error } = await supabase.auth.getSession()

if (!error && data.session && hasRecoveryMarker()) {
  showForm()
} else {
  window.setTimeout(showExpiredLink, 800)
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  showMessage('')

  const password = document.getElementById('password').value
  const confirmation = document.getElementById('password-confirmation').value

  if (password !== confirmation) {
    showMessage('Las contraseñas no coinciden.')
    return
  }

  if (!isStrongPassword(password)) {
    showMessage(
      'Usa al menos 12 caracteres, con mayúscula, minúscula, número y símbolo.',
    )
    return
  }

  submitButton.disabled = true
  submitButton.textContent = 'Actualizando…'

  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    showMessage(
      updateError.message.includes('expired')
        ? 'El enlace ha caducado. Solicita uno nuevo.'
        : 'No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo otra vez.',
    )
    submitButton.disabled = false
    submitButton.textContent = 'Actualizar contraseña'
    return
  }

  showMessage('Contraseña actualizada correctamente.', 'success')
  await supabase.auth.signOut()
  window.setTimeout(() => {
    window.location.replace('/admin.html')
  }, 1200)
})
