/** Selección explícita de borrador para una reserva, sin envíos ni efectos secundarios. */
import {prepareBookingMessage,makeWhatsAppDraftUrl} from './booking-messages.js';
const allowed={pending:'pending',confirmed:'confirmed',cancelled:'cancelled'};
export function prepareReservationWhatsAppDraft({reservation,event,phone,noticeMinimum=true}){
 if(!reservation||!event||typeof reservation!=='object'||typeof event!=='object')
   throw Error('Reserva y experiencia requeridas');
 const type=allowed[reservation.status];
 if(!type)throw Error('Este estado no permite generar confirmaciones');
 // El número procede del registro privado del servidor; el frontend debe
 // mostrarse únicamente después de una autenticación administrativa válida.
 const message=prepareBookingMessage({
   type,title:event.title,date:event.date,time:event.time,place:event.place,
   seats:reservation.seats,minimumNotice:noticeMinimum
 });
 return {type,message,url:makeWhatsAppDraftUrl({phone,message})};
}
