/** Prepara ambos avisos exclusivamente a partir de una reserva persistida.
 * No envía mensajes; la entrega real debe gestionarse con una cola y webhooks.
 */
import {prepareBookingReceipt} from './booking-receipt-template.js';
import {prepareBookingAdminNotice} from './booking-admin-notice.js';
export function prepareBookingNotifications({reservation,event,optedIn}={}){
 const admin=prepareBookingAdminNotice({reservation,event});
 const customer=optedIn===true?prepareBookingReceipt({reservation,event,optedIn:true}):null;
 return Object.freeze({
  reference:admin.reference,
  admin,
  customer,
  delivery:'not_sent',
  confirmation:'pending',
 });
}
