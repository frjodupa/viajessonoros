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
  'RESERVA · '+clean(event.titulo),
  'Plazas: '+seats+' · '+priceLine,
  'Bizum al 610 056 859. Envía la captura del justificante por este chat.',
  'Fecha: '+[clean(event.fecha),clean(event.hora)].filter(Boolean).join(' · '),
  'Nombre: '+clean(request.name)+' · Tel.: '+clean(request.phone),
  amount?'Pendiente de comprobar pago y plazas.':'Consulta el importe exacto antes de pagar. Reserva pendiente.'
 ].join('\n');
}
