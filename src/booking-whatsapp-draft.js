/** Crea exclusivamente un borrador de WhatsApp, sin guardar ni confirmar. */
export function buildBookingWhatsAppDraft({event,request}){
 if(!event||!request||String(event.id)!==String(request.eventId))throw Error('EVENT_MISMATCH');
 const seats=request.seats;
 if(!Number.isSafeInteger(seats)||seats<1||seats>10)throw Error('SEATS_INVALID');
 const clean=value=>String(value??'').replace(/[\r\n\t]+/g,' ').trim();
 return [
 'Hola, quiero solicitar una reserva para Viajes Sonoros.',
 'Experiencia: '+clean(event.titulo),
 'Fecha: '+(clean(event.fecha)||'Por confirmar'),
 'Hora: '+(clean(event.hora)||'Por confirmar'),
 'Lugar: '+(clean(event.lugar)||'Por confirmar'),
 'Aportación: '+(clean(event.precio)||'Por confirmar'),
 'Nombre: '+clean(request.name),
 'Teléfono: '+clean(request.phone),
 'Plazas solicitadas: '+seats,
 'Quedo pendiente de vuestra confirmación.'
 ].join('\n');
}
