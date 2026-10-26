import { supabase } from './supabase.js'

// Persistencia propuesta: requiere aplicar y validar la migración aislada.
// No se llama desde producción mientras la tabla no exista.
const TABLE='informational_banners';
const BUCKET='banner-images';
const PRESETS={
 individual:'banner-terapia-individual.webp',
 pareja:'banner-terapia-pareja.webp',
 grupo:'banner-grupo-viaje.webp'
};
const allowedTypes=new Set(['image/jpeg','image/png','image/webp']);
export const bannerFields=['slug','title','description','image_path','image_alt','button_text','button_url','active','start_at','end_at','display_mode','scroll_percent','delay_seconds','show_once'];

function fail(message){throw new Error(message)}
function check(d){
 if(!/^[a-z0-9-]{3,80}$/.test(d.slug||''))fail('Identificador de banner inválido');
 if(!String(d.title||'').trim()||String(d.title).length>120)fail('Título inválido');
 if(String(d.description||'').length>1500)fail('Texto demasiado largo');
 const url=String(d.button_url||'');
 if(!url.startsWith('/')&&!/^https:\/\//i.test(url))fail('Enlace no permitido: usa HTTPS o una ruta interna');
 if(url.startsWith('//'))fail('No se permiten URLs relativas a otro dominio');
 if(d.start_at&&d.end_at&&new Date(d.end_at)<=new Date(d.start_at))fail('La fecha final debe ser posterior a la inicial');
 if(!['entry','scroll','exit'].includes(d.display_mode))fail('Disparador inválido');
 if(!Number.isInteger(d.scroll_percent)||d.scroll_percent<10||d.scroll_percent>95)fail('Scroll fuera de rango');
 if(!Number.isInteger(d.delay_seconds)||d.delay_seconds<0||d.delay_seconds>60)fail('Retraso fuera de rango');
 return Object.fromEntries(bannerFields.filter(k=>Object.hasOwn(d,k)).map(k=>[k,d[k]]));
}
async function requireAdmin(){
 if(!supabase)fail('Supabase no está configurado');
 const {data,error}=await supabase.auth.getUser();
 if(error||!data?.user)fail('Debes iniciar sesión como administrador');
 // La autorización definitiva se impone en RLS con app_metadata, nunca en el navegador.
 if(data.user.app_metadata?.banner_admin!==true)fail('Tu usuario no tiene permiso para gestionar banners');
 return data.user;
}
export async function listBanners(){
 await requireAdmin();
 const {data,error}=await supabase.from(TABLE).select('*').order('updated_at',{ascending:false});
 if(error)throw error;
 return data;
}
export async function saveBanner(input){
 const user=await requireAdmin();
 const payload=check(input);
 const {data,error}=await supabase.from(TABLE).upsert({...payload,updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'slug'}).select().single();
 if(error)throw error;
 return data;
}
export async function setBannerActive(slug,active){
 await requireAdmin();
 if(typeof active!=='boolean'||!/^[a-z0-9-]{3,80}$/.test(slug))fail('Estado no válido');
 const {data,error}=await supabase.from(TABLE).update({active}).eq('slug',slug).select().single();
 if(error)throw error;
 return data;
}
export async function uploadBannerImage(slug,file){
 await requireAdmin();
 if(!/^[a-z0-9-]{3,80}$/.test(slug))fail('Identificador inválido');
 if(!file||!allowedTypes.has(file.type)||file.size>6*1024*1024||file.size===0)fail('Imagen inválida: PNG, JPG o WebP, máximo 6 MB');
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
 const path=`${slug}/${crypto.randomUUID()}.${ext}`;
 const {error}=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
 if(error)throw error;
 return path;
}
export async function listPublicActiveBanners(){
 const {data,error}=await supabase.from(TABLE).select('slug,title,description,image_path,image_alt,button_text,button_url,display_mode,scroll_percent,delay_seconds,show_once,start_at,end_at').eq('active',true);
 if(error)throw error;
 const now=Date.now();
 return data.filter(d=>(!d.start_at||Date.parse(d.start_at)<=now)&&(!d.end_at||Date.parse(d.end_at)>now));
}
export { PRESETS, BUCKET };
