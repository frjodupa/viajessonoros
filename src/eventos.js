import { supabase } from './supabase.js'

async function cargarEventos(){
  const grid = document.getElementById('grid-eventos') || document.getElementById('lista-eventos')
  if(!grid) return

  const { data, error } = await supabase.from('eventos').select('*').order('created_at', { ascending: false })
  if(error){ grid.innerHTML = 'Error: '+error.message; return }
  if(!data || data.length===0){ grid.innerHTML = '<p>Aún no hay experiencias.</p>'; return }

  grid.innerHTML = data.map(ev=>`
    <div style="border:1px solid #eee;border-radius:12px;overflow:hidden;background:white">
      <img src="${ev.imagen_url}" style="width:100%;height:220px;object-fit:cover">
      <div style="padding:14px">
        <small style="background:#f0f0f0;padding:2px 8px;border-radius:20px">${ev.badge||'Nuevo'} · ${ev.fecha||''}</small>
        <h3 style="margin:8px 0">${ev.titulo}</h3>
        <p style="color:#666;font-size:14px;margin:0 0 6px">📍 ${ev.lugar||''}</p>
        <p style="font-size:14px">${ev.descripcion||''}</p>
      </div>
    </div>
  `).join('')
}

cargarEventos()