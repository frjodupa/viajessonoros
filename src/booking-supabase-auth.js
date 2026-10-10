/**
 * Verificación de identidad de Supabase Auth desde un Worker privado.
 * Requiere SUPABASE_URL, SUPABASE_ANON_KEY y BOOKING_ADMIN_USER_IDS en
 * secretos del servidor; no utilizar la sesión ni los roles del navegador.
 * Este adaptador no instala rutas HTTP ni se conecta a producción.
 */
import {requireBookingAdmin} from './booking-admin-auth.js';

export function createSupabaseBookingAuthorizer({supabaseUrl,anonKey,adminUserIds,fetchImpl=fetch}){
  const base=String(supabaseUrl||'').trim();
  const key=String(anonKey||'').trim();
  const admins=new Set(String(adminUserIds||'').split(',').map(v=>v.trim()).filter(Boolean));
  if(!/^https:\/\/[a-z0-9.-]+\/?$/i.test(base)||!key||admins.size===0)
    throw Error('Configuración de autorización incompleta');
  const url=base.replace(/\/$/,'')+'/auth/v1/user';
  return async authorization=>requireBookingAdmin({
    authorization,
    verifyUser:async token=>{
      const response=await fetchImpl(url,{
        headers:{'apikey':key,'Authorization':'Bearer '+token,'Accept':'application/json'}
      });
      if(!response.ok)return null;
      const data=await response.json();
      return data&&typeof data.id==='string'?{id:data.id}:null;
    },
    isAdmin:async id=>admins.has(String(id))
  });
}
