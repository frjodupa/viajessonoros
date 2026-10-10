/**
 * Controlador PRIVADO de reservas, sin endpoints desplegados.
 * La identidad y el rol de administrador se validan en el servidor.
 * No devuelve teléfonos, emails ni hashes a los clientes.
 */
import {bookingStore} from './booking-store.js';

export function createPrivateBookingController({db,authorize}){
  if(typeof authorize!=='function')throw Error('Autorización obligatoria');
  const store=bookingStore(db);
  async function run({authorization,action,eventId,reservationId}){
    let identity;
    try{identity=await authorize(authorization);}
    catch{return {status:503,body:{error:'AUTH_UNAVAILABLE'}};}
    if(!identity?.authorized)return {status:identity?.reason==='FORBIDDEN'?403:401,body:{error:'ACCESS_DENIED'}};
    if(typeof eventId!=='string'||!eventId.trim()||eventId.length>128)
      return {status:400,body:{error:'INVALID_EVENT'}};
    try{
      switch(action){
        case 'counts':
          return {status:200,body:{eventId,counts:await store.counts(eventId)}};
        case 'confirm':
        case 'cancel':{
          if(typeof reservationId!=='string'||!reservationId.trim()||reservationId.length>128)
            return {status:400,body:{error:'INVALID_RESERVATION'}};
          const result=action==='confirm'
            ?await store.confirm({id:reservationId,eventId})
            :await store.cancel({id:reservationId,eventId});
          return {status:result.changed?200:409,body:{changed:result.changed}};
        }
        default:return {status:400,body:{error:'INVALID_ACTION'}};
      }
    }catch(error){
      if(String(error?.message||'').includes('RESERVATION_CAPACITY_EXCEEDED'))
        return {status:409,body:{error:'CAPACITY_EXCEEDED'}};
      return {status:503,body:{error:'OPERATION_FAILED'}};
    }
  }
  return {run};
}
