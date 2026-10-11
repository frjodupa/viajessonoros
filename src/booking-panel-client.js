/** Cliente interno para el panel de reservas, sin conexión automática ni persistencia.
 * Solo admite rutas privadas de mismo origen y token obtenido de sesión verificada.
 */
export function createBookingPanelClient({endpoint, getAccessToken, fetchImpl=fetch}){
 const url=String(endpoint||'');
 if(!url.startsWith('/')||url.startsWith('//')||url.includes('#')||url.includes('?'))
   throw Error('Endpoint privado relativo requerido');
 if(typeof getAccessToken!=='function'||typeof fetchImpl!=='function')throw Error('Dependencias requeridas');
 async function request(action,eventId,reservationId){
   const token=await getAccessToken();
   if(!token||typeof token!=='string')throw Error('Sesión administrativa requerida');
   if(!String(eventId||'').trim())throw Error('Experiencia requerida');
   const payload={action,eventId};
   if(reservationId!==undefined)payload.reservationId=reservationId;
   const response=await fetchImpl(url,{
     method:'POST',credentials:'same-origin',cache:'no-store',
     headers:{'content-type':'application/json',authorization:'Bearer '+token},
     body:JSON.stringify(payload)
   });
   const result=await response.json();
   if(!response.ok)throw Error(String(result?.error||'BOOKING_REQUEST_FAILED'));
   return result;
 }
 return Object.freeze({
   list:eventId=>request('list',eventId),
   counts:eventId=>request('counts',eventId),
   status:(eventId,id)=>request('status',eventId,id),
   confirm:(eventId,id)=>request('confirm',eventId,id),
   cancel:(eventId,id)=>request('cancel',eventId,id)
 });
}
