/** Aviso al organizador, generado solo tras guardar una solicitud pendiente.
 * No envía mensajes ni confirma reservas.
 */
export function prepareBookingAdminNotice({reservation,event}={}){
 if(!reservation||reservation.persisted!==true||reservation.status!=='pending'||!reservation.id)throw Error('BOOKING_NOT_PERSISTED');
 if(!event||String(event.id)!==String(reservation.eventId))throw Error('EVENT_MISMATCH');
 const clean=x=>String(x??'').replace(/[\r\n\t]/g,' ').trim();
 const seats=reservation.seats;
 if(!Number.isSafeInteger(seats)||seats<1||seats>10)throw Error('SEATS_INVALID');
 const reference=clean(reservation.id).replace(/[^A-Za-z0-9_-]/g,'').slice(0,48);
 if(!reference)throw Error('REFERENCE_INVALID');
 const msg=[
  'Viajes Sonoros · Nueva solicitud pendiente',
  'Referencia: '+reference,
  'Experiencia: '+clean(event.titulo),
  'Solicitante: '+clean(reservation.name),
  'Teléfono: '+clean(reservation.phone),
  'Plazas: '+seats,
  'Acción necesaria: revisar disponibilidad y confirmar o rechazar desde el panel privado.'
 ].join('\n');
 return Object.freeze({reference,text:msg,status:'pending',requiresAdminAction:true});
}
