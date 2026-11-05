/**
 * Control de acceso rápido (PREVIEW / SIMULACIÓN).
 * Sin llamadas de escritura, sin almacenamiento local, sin cambios en reservas reales.
 * El estado simulado se descarta al cerrar el panel.
 */
export function openQuickCheckin({reservations,events,attendance = new Map(),selectedEvent='all'}) {
  document.getElementById('vs-quick-checkin')?.remove();
  const activeEvents = events.filter(ev => reservations.some(r=>String(r.experiencia_id)===String(ev.id)&&r.estado==='confirmada'));
  const picked = activeEvents.find(ev=>String(ev.id)===String(selectedEvent)) || activeEvents[0];
  if(!picked){alert('No hay experiencias con reservas activas.');return}
  const overlay=document.createElement('div');
  overlay.id='vs-quick-checkin';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-labelledby','vs-checkin-title');
  overlay.style.cssText='position:fixed;inset:0;z-index:20000;background:#21142ee3;display:grid;place-items:center;padding:10px';
  const root=document.createElement('section');
  root.style.cssText='display:flex;flex-direction:column;width:min(100%,850px);max-height:94dvh;overflow:hidden;background:#fff;border-radius:20px;padding:clamp(13px,3vw,24px);box-shadow:0 25px 75px #13072052;color:#341d46';
  root.innerHTML=`<header style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 0 12px;border:0">
    <div><small style="font-weight:800;color:#7954a2">MODO ENSAYO · SIN GUARDAR</small><h2 id="vs-checkin-title" style="font:500 clamp(24px,4vw,34px) Georgia,serif;margin:5px 0">Control de acceso rápido</h2></div>
    <button type="button" data-close aria-label="Cerrar control de acceso" style="background:#f4edf8;color:#4c2a68;min-height:44px">Cerrar ×</button>
    </header>
    <p style="font-size:13px;line-height:1.5;margin:0 0 12px;color:#765c87">Simulación temporal: los cambios aquí no se guardan, no afectan a reservas ni pagos y se borran al cerrar. Los datos iniciales de asistencia registrada se muestran solo como referencia.</p>
    <div style="display:grid;gap:9px;margin-bottom:12px">
     <label for="vs-checkin-event" style="font-weight:750">Experiencia</label>
     <select id="vs-checkin-event" style="width:100%;min-height:48px"></select>
     <input id="vs-checkin-search" type="search" placeholder="Buscar asistente por nombre" aria-label="Buscar asistente" style="width:100%;min-height:46px;border:1px solid #cbbad9;border-radius:12px;padding:10px 13px;color:#321b42">
    </div>
    <div id="vs-checkin-counters" role="status" aria-live="polite" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:13px"></div>
    <div id="vs-checkin-list" style="overflow:auto;flex:1;overscroll-behavior:contain"></div>
    <footer style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;border-top:1px solid #eae2ee;padding-top:12px;margin-top:10px">
      <button type="button" data-reset style="background:#f5eef8;color:#4b266c;min-height:44px">Reiniciar simulación</button>
      <button type="button" data-close style="min-height:44px">Cerrar sin guardar</button>
    </footer>`;
  overlay.append(root);document.body.append(overlay);
  const $=id=>root.querySelector('#'+id);
  const select=$('vs-checkin-event'),search=$('vs-checkin-search'),list=$('vs-checkin-list'),counters=$('vs-checkin-counters');
  for(const ev of activeEvents){
   const option=document.createElement('option');option.value=String(ev.id);option.textContent=ev.titulo+' · '+String(ev.fecha||'');select.append(option)
  }
  select.value=String(picked.id);
  const staged=new Map();
  const keyOf=r=>String(r.id);
  const seatsOf=r=>Math.max(0,Number(r.plazas)||0);
  const currentRows=()=>reservations.filter(r=>String(r.experiencia_id)===select.value&&r.estado==='confirmada');
  function metric(label,value){
    const box=document.createElement('div');box.style.cssText='background:#f6f0f9;border-radius:12px;padding:12px;text-align:center;min-width:0';
    const n=document.createElement('strong');n.style.cssText='display:block;font-size:clamp(20px,3.5vw,28px);font-variant-numeric:tabular-nums';n.textContent=String(value);
    const d=document.createElement('small');d.textContent=label;d.style.cssText='font-size:12px;color:#665273';
    box.append(n,d);return box;
  }
  function render(){
   const rows=currentRows(),total=rows.reduce((sum,r)=>sum+seatsOf(r),0);
   const arrived=rows.reduce((sum,r)=>sum+(staged.has(keyOf(r))?staged.get(keyOf(r)):Number(attendance.get(keyOf(r))||0)),0);
   const registered=rows.reduce((sum,r)=>sum+(staged.has(keyOf(r))||attendance.has(keyOf(r))?seatsOf(r):0),0);
   counters.replaceChildren(metric('Plazas confirmadas',total),metric('Presentes',arrived),metric('Sin comprobar',Math.max(0,total-registered)));
   list.replaceChildren();
   const term=search.value.trim().toLocaleLowerCase('es');
   const matches=rows.filter(r=>r.nombre?.toLocaleLowerCase('es').includes(term)).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
   if(!matches.length){const empty=document.createElement('p');empty.textContent='No hay personas para esta búsqueda.';list.append(empty);return}
   for(const row of matches){
    const id=keyOf(row),seats=seatsOf(row),saved=attendance.get(id),value=staged.has(id)?staged.get(id):saved;
    const card=document.createElement('div');card.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:center;padding:13px 3px;border-bottom:1px solid #e8e0ed';
    const info=document.createElement('div');info.style.cssText='min-width:0;overflow-wrap:anywhere';
    const name=document.createElement('strong');name.textContent=row.nombre;name.style.cssText='display:block;font-size:16px';
    const meta=document.createElement('small');meta.textContent=seats+' plaza(s) · '+'Reserva confirmada'+(row.pago_estado==='recibido'?' · Pago verificado':' · Pago sin verificar');meta.style.cssText='color:#735d82;line-height:1.5';
    info.append(name,meta);
    const controls=document.createElement('div');controls.style.cssText='display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end';
    const label=document.createElement('label');label.textContent='Presentes: ';label.style.cssText='font-size:13px;font-weight:700';
    const input=document.createElement('input');input.type='number';input.inputMode='numeric';input.min='0';input.max=String(seats);input.step='1';input.value=value===undefined?'':String(value);input.placeholder='—';input.style.cssText='width:64px;min-height:45px;border:1px solid #bda9cd;border-radius:10px;padding:5px';
    input.setAttribute('aria-label','Plazas presentes de '+row.nombre);
    const mark=document.createElement('button');mark.type='button';mark.textContent='Marcar llegada';mark.style.cssText='min-height:45px;background:#5b3f98;color:#fff;border-radius:10px;padding:9px 12px';
    const set=n=>{if(!Number.isInteger(n)||n<0||n>seats){alert('Introduce un valor entre 0 y '+seats);return}staged.set(id,n);render()};
    mark.onclick=()=>set(input.value===''?seats:Number(input.value));
    input.onchange=()=>{if(input.value!=='')set(Number(input.value))};
    label.append(input);controls.append(label,mark);card.append(info,controls);list.append(card);
   }
  }
  select.onchange=()=>{search.value='';render()};
  search.oninput=render;
  root.querySelector('[data-reset]').onclick=()=>{staged.clear();render()};
  root.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>overlay.remove());
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
  const dismiss=e=>{if(e.key==='Escape'&&overlay.isConnected){overlay.remove();document.removeEventListener('keydown',dismiss)}};
  document.addEventListener('keydown',dismiss);
  render();
  root.querySelector('[data-close]').focus();
}
