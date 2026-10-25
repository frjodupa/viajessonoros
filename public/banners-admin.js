const ids=['title','description','button-label','button-url','from','until','trigger','scroll','delay','once'];const q=id=>document.getElementById(id);let objectURL;function update(){q('preview-title').textContent=q('title').value.trim()||'Un espacio para compartir novedades';q('preview-description').textContent=q('description').value.trim()||'Aquí aparecerá el mensaje informativo.';q('preview-link').textContent=(q('button-label').value.trim()||'Más información')+' ↗';const url=q('button-url').value.trim();const safe=/^https:\/\//i.test(url);q('preview-link').hidden=!safe;if(safe)q('preview-link').href=url;const from=q('from').value,until=q('until').value;q('warning').textContent=from&&until&&from>=until?'La fecha de desactivación debe ser posterior a la de activación.':q('trigger').value==='exit'?'En iPhone no es fiable detectar la salida. Se necesita una alternativa móvil al publicar.':'Vista de diseño: el disparador y las fechas se aplicarán al integrar el sistema de publicación.'}ids.forEach(id=>q(id).addEventListener('input',update));q('image').addEventListener('change',()=>{if(objectURL)URL.revokeObjectURL(objectURL);const f=q('image').files[0];if(f&&f.type.startsWith('image/')&&f.size<=6*1024*1024){objectURL=URL.createObjectURL(f);q('preview-image').src=objectURL;q('preview-image').hidden=false}else{q('preview-image').hidden=true;if(f)alert('Selecciona una imagen JPG, PNG o WebP de hasta 6 MB.')}});q('preview').onclick=()=>document.querySelector('.device').scrollIntoView({behavior:'smooth',block:'center'});q('save').onclick=()=>{const d=Object.fromEntries(ids.map(id=>[id,q(id).type==='checkbox'?q(id).checked:q(id).value]));localStorage.setItem('vs-banner-draft-v1',JSON.stringify(d));alert('Borrador guardado solo en este navegador. La imagen no se conserva.')};document.querySelector('.close').onclick=()=>document.querySelector('.overlay').hidden=true;q('preview').addEventListener('click',()=>document.querySelector('.overlay').hidden=false);try{const d=JSON.parse(localStorage.getItem('vs-banner-draft-v1'));for(const id of ids){if(d&&id in d){if(q(id).type==='checkbox')q(id).checked=d[id];else q(id).value=d[id]}}}catch{}update();
const bannerPresets={
 individual:{title:'Terapias individuales',description:'Un espacio personal para detenerte, escucharte y reconectar contigo a través del sonido y la calma.',url:'/terapias-individuales.html'},
 pareja:{title:'Terapias de pareja',description:'Una experiencia sonora para compartir una pausa y conectar desde la escucha, la calma y la presencia.',url:'/terapias-de-pareja.html'},
 grupo:{title:'Crea tu grupo para tu viaje',description:'Reúne a tus amigos, familiares o compañeros de trabajo y disfrutad de un viaje sonoro pensado para vuestro grupo.',url:'/crea-tu-grupo-viaje-sonoro.html'}
};
let selectedPreset='individual';
document.querySelectorAll('[data-banner-preset]').forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.bannerPreset,p=bannerPresets[key];selectedPreset=key;
 const draft=localStorage.getItem('vs-banner-draft-'+key);
 if(draft){try{const data=JSON.parse(draft);ids.forEach(id=>{if(id in data){if(q(id).type==='checkbox')q(id).checked=data[id];else q(id).value=data[id]}})}catch{}}
 else{q('title').value=p.title;q('description').value=p.description;q('button-label').value='Más información';q('button-url').value=new URL(p.url,location.origin).href;q('from').value='';q('until').value='';q('trigger').value='entry';q('once').checked=true;}
 update();
 document.querySelectorAll('[data-banner-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.querySelector('#banner-form').scrollIntoView({behavior:'smooth',block:'start'});
}));
q('save').addEventListener('click',()=>{
 const draft=Object.fromEntries(ids.map(id=>[id,q(id).type==='checkbox'?q(id).checked:q(id).value]));
 localStorage.setItem('vs-banner-draft-'+selectedPreset,JSON.stringify(draft));
});
document.querySelector('[data-banner-preset="individual"]').click();
