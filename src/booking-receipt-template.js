/** Plantilla de acuse de recibo para una solicitud registrada por el servidor.
 * No envía WhatsApp. La entrega requiere proveedor oficial, consentimiento y
 * confirmación persistida. Nunca llamar al completar solo el formulario.
 */
export function prepareBookingReceipt({reservation,event,optedIn}={}){
 if(!reservation||!event||optedIn!==true)throw Error('RECEIPT_NOT_AUTHORIZED');
 if(reservation.persisted!==true||reservation.status!=='pending'||!reservation.id)throw Error('BOOKING_NOT_PERSISTED');
 if(String(reservation.eventId)!==String(event.id))throw Error('EVENT_MISMATCH');
 const phone=String(reservation.phone||'').replace(/[\s().-]/g,'');
 if(!/^\+?\d{9,15}$/.test(phone))throw Error('PHONE_INVALID');
 const name=String(reservation.name||'').replace(/[\r\n]/g,' ').trim();
 if(name.length<2)throw Error('NAME_INVALID');
 const title=String(event.titulo||'').replace(/[\r\n]/g,' ').trim();
 const reference=String(reservation.id).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48);
 if(!reference)throw Error('REFERENCE_INVALID');
 return Object.freeze({
  to:phone,
  template:'solicitud_recibida_pendiente',
  language:'es',
  parameters:[name,title,reference],
  text:`Hola ${name}. Hemos registrado tu solicitud para ${title} (referencia ${reference}). Está PENDIENTE DE CONFIRMACIÓN; tu plaza todavía no está asegurada. Te contactaremos por WhatsApp tras comprobar disponibilidad. Viajes Sonoros.`
 });
}
