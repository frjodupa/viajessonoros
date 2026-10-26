import { createHash, timingSafeEqual, scryptSync, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { get, put } from '@vercel/blob';
const PATH='vs-informational-banners.enc.json';
function secret(){const password=process.env.VS_BANNERS_ADMIN_PASSWORD;if(!password||password.length<16)throw Error('Credenciales de banners no configuradas o débiles');return scryptSync(password,'viajessonoros-banners-config-v1',32)}
function encrypt(value){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',secret(),iv);const output=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);return JSON.stringify({v:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:output.toString('base64')})}
function decrypt(value){const v=JSON.parse(value);if(v.v!==1)throw Error('Versión cifrada desconocida');const d=createDecipheriv('aes-256-gcm',secret(),Buffer.from(v.iv,'base64'));d.setAuthTag(Buffer.from(v.tag,'base64'));return JSON.parse(Buffer.concat([d.update(Buffer.from(v.data,'base64')),d.final()]).toString('utf8'))}
const KINDS=new Set(['image/jpeg','image/png','image/webp']);
const slugs=new Set(['terapias-individuales','terapias-de-pareja','crea-tu-grupo-viaje-sonoro']);
export const defaults=()=>[];
function safeEq(a,b){return timingSafeEqual(createHash('sha256').update(String(a)).digest(),createHash('sha256').update(String(b)).digest())}
export function authorized(req){
 const user=process.env.VS_BANNERS_ADMIN_USER;
 const password=process.env.VS_BANNERS_ADMIN_PASSWORD;
 if(!user||!password)return false;
 const auth=String(req.headers.authorization||'');
 if(!auth.startsWith('Basic '))return false;
 try{const raw=Buffer.from(auth.slice(6),'base64').toString('utf8'),split=raw.indexOf(':');return split>=0&&safeEq(raw.slice(0,split),user)&&safeEq(raw.slice(split+1),password)}
 catch{return false}
}
export function validOrigin(req){
 const origin=req.headers.origin||req.headers.referer;
 if(!origin)return false;
 try{
 const incoming=new URL(origin);
 const host=String(req.headers['x-forwarded-host']||req.headers.host||'');
 return incoming.protocol==='https:' && incoming.host===host;
 }catch{return false}
}
export async function all(){
 const obj=await get(PATH,{access:'public',useCache:false});
 if(!obj?.stream)return defaults();
 const value=decrypt(await new Response(obj.stream).text());
 return Array.isArray(value)?value:[];
}
export async function write(rows){
 await put(PATH,encrypt(rows),{access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:60});
}
export function validate(d){
 if(!d||!slugs.has(d.slug))throw Error('Campaña desconocida');
 const str=(k,max,required=false)=>{const v=d[k];if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error('Campo inválido: '+k);return v.trim()};
 const title=str('title',120,true),description=str('description',1500),image_path=str('image_path',1024);
 const button_text=str('button_text',80),button_url=str('button_url',500,true),image_alt=str('image_alt',200);
 if(!(/^\/(?!\/)[^\s]*$/.test(button_url)||/^https:\/\/[^\s]+$/.test(button_url)))throw Error('Enlace no permitido');
 if(image_path&&!(/^\/(?!\/)[-\w/.]+$/.test(image_path)||/^https:\/\/[\w.-]+\.public\.blob\.vercel-storage\.com\/[\w./%-]+$/.test(image_path)))throw Error('Imagen no permitida');
 const parseTime=k=>{const val=d[k];if(val===null||val==='')return null;if(typeof val!=='string'||!Number.isFinite(Date.parse(val)))throw Error('Fecha inválida');return new Date(val).toISOString()};
 const start_at=parseTime('start_at'),end_at=parseTime('end_at');
 if(start_at&&end_at&&end_at<=start_at)throw Error('La fecha final debe ser posterior');
 if(!['entry','scroll','exit'].includes(d.display_mode))throw Error('Disparador inválido');
 if(!Number.isInteger(d.delay_seconds)||d.delay_seconds<0||d.delay_seconds>60)throw Error('Retraso inválido');
 if(!Number.isInteger(d.scroll_percent)||d.scroll_percent<10||d.scroll_percent>95)throw Error('Scroll inválido');
 return {slug:d.slug,title,description,image_path,image_alt,button_text,button_url,
 active:d.active===true,start_at,end_at,display_mode:d.display_mode,scroll_percent:d.scroll_percent,
 delay_seconds:d.delay_seconds,show_once:d.show_once===true,updated_at:new Date().toISOString()};
}
export function published(rows){
 const t=Date.now();
 return rows.filter(x=>x.active===true&&(!x.start_at||Date.parse(x.start_at)<=t)&&(!x.end_at||Date.parse(x.end_at)>t))
 .map(({slug,title,description,image_path,image_alt,button_text,button_url,display_mode,scroll_percent,delay_seconds,show_once})=>({slug,title,description,image_path,image_alt,button_text,button_url,display_mode,scroll_percent,delay_seconds,show_once}));
}
export async function uploadImage({slug,type,base64}){
 if(!slugs.has(slug)||!KINDS.has(type)||typeof base64!=='string'||base64.length>3000000)throw Error('Imagen no válida');
 const buffer=Buffer.from(base64,'base64');if(buffer.length<20||buffer.length>2*1024*1024)throw Error('La imagen debe pesar menos de 2 MB');
 const jpeg=buffer[0]===255&&buffer[1]===216&&buffer[2]===255;
 const png=buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const webp=buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP';
 if(!(type==='image/jpeg'&&jpeg||type==='image/png'&&png||type==='image/webp'&&webp))throw Error('Formato de imagen no válido');
 const ext=type==='image/jpeg'?'jpg':type==='image/png'?'png':'webp';
 const blob=await put('vs-banners/'+slug+'/'+crypto.randomUUID()+'.'+ext,buffer,{access:'public',contentType:type,addRandomSuffix:false});
 return blob.url;
}
