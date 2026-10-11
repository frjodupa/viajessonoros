/** Borrador manual para WhatsApp: Bizum y justificante, nunca confirma automáticamente. */
export function buildBookingWhatsAppDraft({event,request}){
 if(!event||!request||String(event.id)!==String(request.eventId))throw Error('EVENT_MISMATCH');
 const seats=request.seats;
 if(!Number.isSafeInteger(seats)||seats<1||seats>10)throw Error('SEATS_INVALID');
 const clean=value=>String(value??'').replace(/[\r\n\t]+/g,' ').trim();
 const raw=clean(event.precio);
 const numeric=/^(?:€\s*)?(\d{1,4}(?:[,.]\d{1,2})?)\s*(?:€|EUR)?$/i.exec(raw);
 const unit=numeric?Number(numeric[1].replace(',','.')):null;
 const format=amount=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(amount);
 const amount=unit!==null&&Number.isFinite(unit)?format(unit*seats):null;
 const priceLine=amount
  ?'Bizum: '+amount+(seats>1?' ('+seats+' plazas × '+format(unit)+')':'')
  :'Aportación indicada en la experiencia: '+(raw||'Consultar importe antes de pagar');
 return [
  'Solicitud de reserva · Viajes Sonoros',
  'Experiencia: '+clean(event.titulo),
  'Fecha y hora: '+[clean(event.fecha),clean(event.hora)].filter(Boolean).join(' · '),
  'Lugar: '+(clean(event.lugar)||'Por confirmar'),
  'Nombre: '+clean(request.name),
  'Teléfono: '+clean(request.phone),
  'Plazas solicitadas: '+seats,
  priceLine,
  amount
   ?'Para tramitar tu reserva, realiza un Bizum de '+amount+' al 610 056 859 y adjunta aquí una captura del justificante (oculta datos bancarios que no sean necesarios).'
   :'Antes de hacer el Bizum al 610 056 859, consúltanos el importe exacto de tu reserva.',
  'Comprobaremos el justificante y la disponibilidad antes de confirmar tu reserva. Gracias.'
 ].join('\n');
}
