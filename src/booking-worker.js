/** Worker de reservas NO desplegado.
 * Solo inicia si existen binding D1 y configuración administrativa completa.
 * No expone CORS; el acceso desde navegadores de otro origen queda bloqueado.
 */
import {createSupabaseBookingAuthorizer} from './booking-supabase-auth.js';
import {createBookingHttpHandler} from './booking-http-handler.js';
export function createBookingWorker({db,supabaseUrl,anonKey,adminUserIds,fetchImpl}){
 if(!db?.prepare)throw Error('Binding D1 requerido');
 const authorize=createSupabaseBookingAuthorizer({supabaseUrl,anonKey,adminUserIds,fetchImpl});
 const handler=createBookingHttpHandler({db,authorize});
 return async request=>{
   const url=new URL(request.url);
   if(url.pathname!=='/api/private/bookings')return new Response(null,{status:404});
   // Los navegadores de terceros no deben poder realizar operaciones con CORS.
   const origin=request.headers.get('origin');
   if(origin&&origin!==url.origin)return Response.json({error:'ORIGIN_DENIED'},{status:403});
   return handler(request);
 };
}
