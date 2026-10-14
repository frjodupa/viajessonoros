// Vista social por experiencia: las plataformas leen OG antes de ejecutar JavaScript.
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export default async function handler(req,res){
  const id=String(new URL(req.url,'https://viajessonoros.es').searchParams.get('experiencia')||'');
  if(!/^\d{1,19}$/.test(id)){res.statusCode=404;return res.end('Experiencia no encontrada');}
  const host='https://viajessonoros.es';
  const url=host+'/api/compartir?experiencia='+encodeURIComponent(id);
  const target=host+'/reserva.html?experiencia='+encodeURIComponent(id);
  const api=process.env.VITE_SUPABASE_URL;
  const key=process.env.VITE_SUPABASE_ANON_KEY;
  if(!api||!key){res.statusCode=503;return res.end('Vista previa temporalmente no disponible');}
  try{
    const source=await fetch(api+'/rest/v1/experiencias?id=eq.'+encodeURIComponent(id)+'&publicado=eq.true&select=id,titulo,fecha,hora,lugar,descripcion,imagen_url',{
      headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(7000)
    });
    if(!source.ok)throw Error('API unavailable');
    const [ev]=await source.json();
    if(!ev){res.statusCode=404;return res.end('Experiencia no disponible');}
    const title=ev.titulo+' | Reserva tu plaza · Viajes Sonoros';
    const day=/^\d{4}-\d{2}-\d{2}/.test(ev.fecha||'')?ev.fecha.slice(8,10)+'-'+ev.fecha.slice(5,7)+'-'+ev.fecha.slice(0,4):'';
    const details=[day,ev.hora?.slice(0,5),ev.lugar].filter(Boolean).join(' · ');
    const description=(details?details+'. ':'')+(ev.descripcion||'Descubre esta experiencia de Viajes Sonoros. Reserva tu plaza y disfruta de una pausa de calma y escucha.');
    const image=(()=>{try{const u=new URL(ev.imagen_url||'',host);return u.protocol==='https:'?u.href:null}catch{return null}})();
    const metaImage=image?`<meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:secure_url" content="${escapeHtml(image)}"><meta name="twitter:image" content="${escapeHtml(image)}">`:'';
    const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description.slice(0,240))}"><meta property="og:type" content="website"><meta property="og:locale" content="es_ES"><meta property="og:site_name" content="Viajes Sonoros"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description.slice(0,240))}"><meta property="og:url" content="${escapeHtml(url)}">${metaImage}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description.slice(0,240))}"><link rel="canonical" href="${escapeHtml(target)}"><meta http-equiv="refresh" content="0;url=${escapeHtml(target)}"></head><body><p><a href="${escapeHtml(target)}">Reservar plaza para ${escapeHtml(ev.titulo)}</a></p><script>window.location.replace(${JSON.stringify(target)})<\/script></body></html>`;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
    res.statusCode=200;return res.end(html);
  }catch{res.statusCode=503;return res.end('Vista previa temporalmente no disponible');}
}
