/**
 * Viajes Sonoros — textos de reserva listos para revisión manual.
 * No envía mensajes ni accede a datos personales de almacenamiento.
 */
const clean=(value,max=180)=>String(value??'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
export function prepareBookingMessage({type,title,date,time,place,seats=1,minimumNotice=true}){
 const event=clean(title),when=clean(date,40),hour=clean(time,20),venue=clean(place);
 if(!event||!when||!venue||!Number.isSafeInteger(seats)||seats<1||seats>100)
  throw Error('Datos de experiencia incompletos');
 const detail=`"${event}", ${when}${hour?' a las '+hour:''}, en ${venue}`;
 const qty=`${seats} ${seats===1?'plaza':'plazas'}`;
 switch(type){
  case 'confirmed':
   return `Tu reserva de ${qty} para ${detail} está confirmada.`+
    (minimumNotice?' La celebración está sujeta a alcanzar el aforo mínimo. Si no se alcanza, podrás solicitar la devolución de la aportación o utilizarla en otro evento.':'');
  case 'pending':
   return `Hemos recibido tu solicitud de ${qty} para ${detail}. Está pendiente de confirmación; todavía no tienes la plaza confirmada.`;
  case 'cancelled':
   return `Tu reserva de ${qty} para ${detail} ha sido cancelada. Si realizaste una aportación, contactaremos contigo para gestionar la devolución o el traslado conforme a las condiciones aplicables.`;
  case 'minimum_not_reached':
   return `La experiencia ${detail} no se celebrará porque no se ha alcanzado el aforo mínimo. Si realizaste una aportación, puedes elegir su devolución o utilizarla para una próxima experiencia.`;
  default:throw Error('Tipo de aviso no permitido');
 }
}
export function makeWhatsAppDraftUrl({phone,message}){
 const tel=String(phone||'').replace(/[\s+().-]/g,'');
 if(!/^\d{9,15}$/.test(tel)||!message||typeof message!=='string'||message.length>2000)
  throw Error('Teléfono o mensaje inválido');
 return 'https://wa.me/'+tel+'?text='+encodeURIComponent(message);
}
