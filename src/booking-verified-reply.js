/** Prepara respuestas solo a partir de una lectura actual desde un gateway privado.
 * No toma el estado aportado por la interfaz ni envía mensajes.
 */
import {prepareManualBookingReply} from './booking-manual-reply.js';
export function createVerifiedBookingReply({getReservation}={}){
 if(typeof getReservation!=='function')throw Error('PRIVATE_RESERVATION_READER_REQUIRED');
 return Object.freeze({
  async prepare({event,reservationId,decision}){
   if(!event?.id||!reservationId)throw Error('RESERVATION_ID_REQUIRED');
   const reservation=await getReservation({eventId:String(event.id),reservationId:String(reservationId)});
   if(!reservation||String(reservation.id)!==String(reservationId)||String(reservation.eventId)!==String(event.id))
    throw Error('RESERVATION_NOT_VERIFIED');
   return prepareManualBookingReply({event,reservation:{...reservation,persisted:true},decision});
  }
 });
}
