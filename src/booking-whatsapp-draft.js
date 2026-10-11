/** Crea exclusivamente un borrador de WhatsApp, sin guardar ni confirmar. */
export function buildBookingWhatsAppDraft({event,request}){
 if(!event||!request||String(event.id)!==String(request.eventId))throw Error('EVENT_MISMATCH');
 const seats=request.seats;
 if(!Number.isSafeInteger(seats)||seats<1||seats>10)throw Error('SEATS_INVALID');
 const clean=value=>String(value??'').replace(/[\r\n\t]+/g,' ').trim();
 return [
 'Solicitud de reserva · Viajes Sonoros',
 'Experiencia: '+clean(event.titulo),
 'Fecha y hora: '+[clean(event.fecha),clean(event.hora)].filter(Boolean).join(' · '),
 'Lugar: '+(clean(event.lugar)||'Por confirmar'),
 'Aportación: '+(clean(event.precio)||'Por confirmar'),
 'Nombre: '+clean(request.name),
 'Teléfono: '+clean(request.phone),
 'Plazas solicitadas: '+seats,
 'Pendiente de confirmación por el organizador.'
 ].join('\n');
}
