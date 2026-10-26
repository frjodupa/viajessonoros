import { supabase } from './supabase.js';
let authorization='';
async function refreshAuthorization(){
 const {data,error}=await supabase.auth.getSession();
 if(error||!data.session?.access_token)throw Error('Inicia sesión en el administrador de experiencias');
 authorization='Bearer '+data.session.access_token;
}
const BUCKET='';
async function request(path,options={}){
 await refreshAuthorization();
 const response=await fetch(path,{...options,headers:{...(options.headers||{}),Authorization:authorization},cache:'no-store'});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||'Error de conexión con el servidor');
 return data;
}
const api='/api/banners-admin';
async function listBanners(){return (await request(api)).banners}
async function saveBanner(banner){return (await request(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'save',banner})})).banner}
async function setBannerActive(slug,active){
 const rows=await listBanners(),banner=rows.find(b=>b.slug===slug);
 if(!banner)throw Error('Campaña no guardada');
 return saveBanner({...banner,active});
}
async function uploadBannerImage(slug,file){
 if(file.size>2*1024*1024)throw Error('La imagen no debe superar 2 MB');
 const base64=await new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);
 });
 const result=await request(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'image',slug,type:file.type,base64})});
 return result.url;
}

const presets={
 individual:{slug:'terapias-individuales',title:'Terapias individuales',description:'Un espacio personal para detenerte, escucharte y reconectar contigo a través del sonido y la calma.',url:'/terapias-individuales.html',image:'/banner-terapia-individual.webp'},
 pareja:{slug:'terapias-de-pareja',title:'Terapias de pareja',description:'Una experiencia sonora para compartir una pausa y conectar desde la escucha, la calma y la presencia.',url:'/terapias-de-pareja.html',image:'/banner-terapia-pareja.webp'},
 grupo:{slug:'crea-tu-grupo-viaje-sonoro',title:'Crea tu grupo para tu viaje',description:'Reúne a tus amigos, familiares o compañeros de trabajo y disfrutad de un viaje sonoro pensado para vuestro grupo.',url:'/crea-tu-grupo-viaje-sonoro.html',image:'/banner-grupo-viaje.webp'}
};
const el=id=>document.getElementById(id);
const buttons=['remote-load','remote-save','remote-toggle'].map(el);
let selected='individual',saved=null,localImageURL=null,remoteReady=false;
function message(text,error=false){el('remote-status').textContent=text;el('remote-status').style.color=error?'#a53043':'#574367'}
function setButtons(enabled){remoteReady=enabled;buttons.forEach(b=>b.disabled=!enabled)}
function imageURL(path,key){
 if(!path)return presets[key].image;
 if(path.startsWith('/'))return path;
 return path;
}
function showImage(path=presets[selected].image){
 const image=el('preview-image');image.hidden=false;image.onerror=()=>{image.hidden=true;message('La imagen no se ha podido mostrar',true)};image.src=path;image.alt=presets[selected].title;
}
function update(){
 el('preview-title').textContent=el('title').value||'Banner';
 el('preview-description').textContent=el('description').value;
 const url=el('button-url').value.trim();const a=el('preview-link');
 a.textContent=(el('button-label').value||'Más información')+' ↗';
 const valid=url.startsWith('/')&&!url.startsWith('//')||/^https:\/\//.test(url);
 a.hidden=!valid;if(valid)a.href=url;
}
function asDateLocal(iso){if(!iso)return '';const d=new Date(iso);const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;}
function asISO(str){return str?new Date(str).toISOString():null}
function populate(d){
 el('title').value=d.title||'';el('description').value=d.description||'';
 el('button-label').value=d.button_text||'Más información';
 el('button-url').value=d.button_url||'';
 el('from').value=asDateLocal(d.start_at);el('until').value=asDateLocal(d.end_at);
 el('trigger').value=d.display_mode||'entry';el('scroll').value=d.scroll_percent??50;
 el('delay').value=d.delay_seconds??3;el('once').checked=d.show_once??true;el('campaign-active').checked=d.active??false;
 showImage(imageURL(d.image_path,selected));update();
}
function selectPreset(key){
 selected=key;saved=null;el('image').value='';
 const p=presets[key];populate({title:p.title,description:p.description,button_text:'Más información',button_url:p.url,image_path:p.image,active:false});
 document.querySelectorAll('[data-banner-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bannerPreset===key)));
 if(remoteReady)load().catch(e=>message(e.message,true));
}
async function load(){
 const rows=await listBanners();saved=rows.find(x=>x.slug===presets[selected].slug)||null;
 if(saved){populate(saved);message('Campaña recuperada de la nube. Estado: '+(saved.active?'ACTIVA':'INACTIVA'))}
 else{message('Campaña nueva: puedes guardarla como inactiva.')}
}
function payload(){
 const p=presets[selected];
 const button_url=el('button-url').value.trim();
 if(!(button_url.startsWith('/')&&!button_url.startsWith('//')||/^https:\/\//.test(button_url)))throw Error('Escribe una URL HTTPS o una ruta interna');
 const start=asISO(el('from').value),end=asISO(el('until').value);
 if(start&&end&&Date.parse(end)<=Date.parse(start))throw Error('La fecha de fin debe ser posterior al inicio');
 return {slug:p.slug,title:el('title').value.trim(),description:el('description').value.trim(),
 image_path:saved?.image_path||p.image,image_alt:p.title,
 button_text:el('button-label').value.trim(),button_url,active:el('campaign-active').checked,
 start_at:start,end_at:end,display_mode:el('trigger').value,scroll_percent:Number(el('scroll').value),delay_seconds:Number(el('delay').value),show_once:el('once').checked};
}
async function guard(fn){
 setButtons(false);message('Procesando...');
 try{await fn()}catch(error){message(error?.message||'Error al guardar',true)}finally{setButtons(true)}
}
async function save(){
 const data=payload();const file=el('image').files?.[0];
 if(file)data.image_path=await uploadBannerImage(data.slug,file);
 saved=await saveBanner(data);populate(saved);
 message('Cambios guardados en la nube. Estado: '+(saved.active?'ACTIVA':'INACTIVA'));
}
el('remote-load').onclick=()=>guard(load);
el('remote-save').onclick=()=>guard(save);
el('remote-toggle').onclick=()=>guard(async()=>{
 if(!saved)throw Error('Primero guarda la campaña');
 saved=await setBannerActive(saved.slug,!saved.active);
 el('campaign-active').checked=saved.active;
 message(saved.active?'Campaña ACTIVADA':'Campaña DESACTIVADA');
});
document.querySelectorAll('[data-banner-preset]').forEach(b=>b.onclick=()=>selectPreset(b.dataset.bannerPreset));
['title','description','button-label','button-url','from','until','trigger','scroll','delay','once'].forEach(id=>el(id).addEventListener('input',update));
el('image').addEventListener('change',()=>{
 if(localImageURL)URL.revokeObjectURL(localImageURL);
 const f=el('image').files?.[0];
 if(f){localImageURL=URL.createObjectURL(f);showImage(localImageURL)}else showImage(saved?.image_path?imageURL(saved.image_path,selected):presets[selected].image);
});
el('preview').onclick=()=>{document.querySelector('.overlay').hidden=false;document.querySelector('.device').scrollIntoView({behavior:'smooth',block:'center'})};
document.querySelector('.close').onclick=()=>{document.querySelector('.overlay').hidden=true};
el('save').onclick=()=>{
 const d=payload();localStorage.setItem('vs-banner-draft-'+selected,JSON.stringify(d));
 message('Borrador local guardado. Para sincronizar utiliza «Guardar cambios».');
};
setButtons(false);selectPreset('individual');
(async()=>{
 try{
  await refreshAuthorization();
  await listBanners();
  setButtons(true);
  el('banner-login').hidden=true;
  await load();
 }catch(e){setButtons(false);message(e.message,true);el('banner-login').hidden=false}
})();
