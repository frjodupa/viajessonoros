/** Enlace de WhatsApp para respuesta MANUAL desde el panel privado.
 * No envía mensajes. Solo usar tras comprobar el estado en el servidor.
 */
export function prepareManualBookingReply({reservation,event,decision}={}){
 if(!reservation||!event||String(reservation.eventId)!==String(event.id))throw Error('EVENT_MISMATCH');
 if(!reservation.persisted||!reservation.id)throw Error('BOOKING_NOT_PERSISTED');
 const phone=String(reservation.phone||'').replace(/[\s().-]/g,'');
 if(!/^\+?\d{9,15}$/.test(phone))throw Error('PHONE_INVALID');
 const safe=x=>String(x??'').replace(/[\r\n\t]/g,' ').trim();
 let text;
 if(decision==='confirmed'){
  if(reservation.status!=='confirmed')throw Error('NOT_CONFIRMED');
  text=`Hola ${safe(reservation.name)}. Confirmamos tu reserva para ${safe(event.titulo)}. Referencia: ${safe(reservation.id)}. ¡Te esperamos! Viajes Sonoros.`;
 }else if(decision==='pending'){
  if(reservation.status!=='pending')throw Error('NOT_PENDING');
  text=`Hola ${safe(reservation.name)}. Hemos recibido tu solicitud para ${safe(event.titulo)} (ref. ${safe(reservation.id)}). Sigue pendiente de confirmación; te avisaremos cuando comprobemos las plazas. Viajes Sonoros.`;
 }else throw Error('INVALID_DECISION');
 return Object.freeze({text,url:'https://api.whatsapp.com/send?phone='+phone.replace(/^\+/,'')+'&text='+encodeURIComponent(text),delivered:false});
}
