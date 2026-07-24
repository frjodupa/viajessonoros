import { supabase } from './supabase.js'

const CLAVE = 'feel2024'

export function checkAuth(){
  const input = document.getElementById('pass') || document.querySelector('input')
  const val = (input?.value || '').trim().toLowerCase()
  if(val === CLAVE){
    document.getElementById('login').style.display='none'
    document.getElementById('panel').style.display='block'
    listar()
  } else {
    alert('Clave incorrecta')
  }
}

export async function subirEvento(e){
  e.preventDefault()
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
  const { data } = await supabase.from('eventos').select('*').order('created_at',{ascending:false})
  const div = document.getElementById('lista')
  if(!div) return
  div.innerHTML = data?.map(ev=>`<div style="border:1px solid #eee;padding:8px;margin:6px 0;border-radius:8px;display:flex;gap:8px"><img src="${ev.imagen_url}" style="width:50px;height:50px;object-fit:cover;border-radius:6px"><div><b>${ev.titulo}</b><br><small>${ev.lugar||''}</small></div></div>`).join('') || 'Aún no hay eventos'
}

window.checkAuth = checkAuth
window.subirEvento = subirEvento
