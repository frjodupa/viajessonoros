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
   try{
    return await store.create({id,eventId,contactHash,encryptedContact,seats});
   }catch(error){
    const message=String(error?.message||'');
    if(/idx_reservation_active_contact|UNIQUE constraint failed: reservations\.experience_id, reservations\.contact_hash/i.test(message))
     return {saved:false,error:'DUPLICATE_ACTIVE_REQUEST'};
    if(/RESERVATION_CAPACITY_EXCEEDED/.test(message))
     return {saved:false,error:'CAPACITY_EXCEEDED'};
    // Avoid returning database driver errors, hashes or encrypted contacts.
    return {saved:false,error:'BOOKING_STORAGE_UNAVAILABLE'};
   }
  }
 });
}
