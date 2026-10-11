/** Cliente público opcional. No se activa hasta desplegar una API segura de escritura.
 * Sin credenciales de administrador, sin reintentos automáticos y sin estados ficticios.
 */
import {validatePublicBookingRequest} from './booking-public-request.js';
import {interpretBookingSubmission} from './booking-submission-receipt.js';
export function createPublicBookingClient({endpoint='/api/public/bookings',fetchImpl=fetch}={}){
 if(typeof endpoint!=='string'||!endpoint.startsWith('/')||endpoint.startsWith('//')||endpoint.includes('?')||endpoint.includes('#')||typeof fetchImpl!=='function')
  throw Error('PUBLIC_ENDPOINT_INVALID');
 return Object.freeze({
  async submit(input){
   const v=validatePublicBookingRequest(input);
   if(!v.valid)return Object.freeze({registered:false,status:'not_registered',reason:v.error});
   let response;
   try{
    const res=await fetchImpl(endpoint,{
     method:'POST',credentials:'same-origin',cache:'no-store',
     headers:{'content-type':'application/json'},
     body:JSON.stringify({eventId:v.data.eventId,name:v.data.name,phone:v.data.phone,seats:v.data.seats})
    });
    if(!res.ok)return Object.freeze({registered:false,status:'not_registered',reason:'SERVER_REJECTED'});
    response=await res.json();
   }catch{return Object.freeze({registered:false,status:'not_registered',reason:'NETWORK_ERROR'});}
   return interpretBookingSubmission(response,{eventId:v.data.eventId});
  }
 });
}
