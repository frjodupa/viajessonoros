import { supabase } from './supabase.js'

const login = document.getElementById('login')
const panel = document.getElementById('panel')
const loginError = document.getElementById('login-error')

const showSession = (session) => {
  login.style.display = session ? 'none' : 'block'
  panel.style.display = session ? 'block' : 'none'
}

const hasValidUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    showSession(null)
    return false
  }

  return true
}

export async function checkAuth(event){
  event?.preventDefault()
  loginError.style.display = 'none'

  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('pass').value
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    loginError.textContent = 'Email o contraseña incorrectos.'
    loginError.style.display = 'block'
    showSession(null)
    return
  }

  showSession(data.session)
  await listar()
}

export async function cerrarSesion(){
  await supabase.auth.signOut()
  showSession(null)
}

export async function subirEvento(e){
  e.preventDefault()
  if (!(await hasValidUser())) return
  const titulo = document.getElementById('titulo').value
  const badge = document.getElementById('badge').value
  const fecha = document.getElementById('fecha').value
  const lugar = document.getElementById('lugar').value
  const descripcion = document.getElementById('descripcion').value
  const fileInput = document.getElementById('imagenFile')
  const urlInput = document.getElementById('imagenUrl').value

  let imagen_url = urlInput

  if(fileInput.files.length > 0){
    const file = fileInput.files[0]
    const nombre = Date.now() + '-' + file.name
    const { error } = await supabase.storage.from('eventos').upload(nombre, file)
    if(error){ alert('Error foto: '+error.message); return }
    const { data } = supabase.storage.from('eventos').getPublicUrl(nombre)
    imagen_url = data.publicUrl
  }

  if(!imagen_url){ alert('Añade foto o URL'); return }

  const { error } = await supabase.from('eventos').insert([{titulo,badge,fecha,lugar,descripcion,imagen_url}])
  if(error){ alert('Error tabla: '+error.message); return }

  alert('¡Creado!')
  e.target.reset()
  listar()
}

async function listar(){
  if (!(await hasValidUser())) return
  const { data } = await supabase.from('eventos').select('*').order('created_at',{ascending:false})
  const div = document.getElementById('lista')
  if(!div) return
  div.innerHTML = data?.map(ev=>`<div style="border:1px solid #eee;padding:8px;margin:6px 0;border-radius:8px;display:flex;gap:8px"><img src="${ev.imagen_url}" style="width:50px;height:50px;object-fit:cover;border-radius:6px"><div><b>${ev.titulo}</b><br><small>${ev.lugar||''}</small></div></div>`).join('') || 'Aún no hay eventos'
}

window.checkAuth = checkAuth
window.subirEvento = subirEvento
window.cerrarSesion = cerrarSesion

supabase.auth.onAuthStateChange((_event, session) => {
  showSession(session)
})

const { data: { session } } = await supabase.auth.getSession()
showSession(session)
if (session) await listar()
