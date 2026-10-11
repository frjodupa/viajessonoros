/** Servicio interno de alta, sin endpoint expuesto ni despliegue.
 * La capa HTTP deberá aportar controles de abuso y comprobar evento/aforo.
 */
import {validatePublicBookingRequest} from './booking-public-request.js';
import {createPublicBookingStore} from './booking-public-store.js';
export function createProtectedBookingRegistration({db,protector,idFactory,verifyEvent}={}){
 if(!protector?.protect||typeof idFactory!=='function'||typeof verifyEvent!=='function')throw Error('REGISTRATION_DEPENDENCIES_REQUIRED');
 const store=createPublicBookingStore(db);
 return Object.freeze({
  async register(input){
   const validated=validatePublicBookingRequest(input);
   if(!validated.valid)return {saved:false,error:validated.error};
   const {eventId,name,phone,seats}=validated.data;
   const eventAllowed=await verifyEvent({eventId,seats});
   if(eventAllowed!==true)return {saved:false,error:'EVENT_NOT_AVAILABLE'};
   const {encryptedContact,contactHash}=await protector.protect({eventId,name,phone});
   const id=await idFactory();
   return store.create({id,eventId,contactHash,encryptedContact,seats});
  }
 });
}
