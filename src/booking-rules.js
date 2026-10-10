/**
 * Viajes Sonoros — motor puro de reservas.
 * Sin llamadas de red ni escrituras a Supabase/D1.
 * Este módulo se integrará cuando se verifique el esquema real.
 */
export const BOOKING_STATES=Object.freeze({
  PENDING:'pending', CONFIRMED:'confirmed', WAITLIST:'waitlist',
  CANCELLED:'cancelled'
});
const statuses=new Set(Object.values(BOOKING_STATES));
export function normalizeReservation(value){
  if(!value||typeof value!=='object')throw Error('Reserva inválida');
  const eventId=String(value.eventId??'').trim();
  const contact=String(value.contact??'').trim().toLowerCase();
  const seats=Number(value.seats??1);
  const status=String(value.status??BOOKING_STATES.PENDING);
  if(!eventId||!contact||!Number.isSafeInteger(seats)||seats<1||seats>100||!statuses.has(status))
    throw Error('Datos de reserva inválidos');
  return {eventId,contact,seats,status};
}
export function checkReservation({eventId,contact,seats=1,capacity,reservations=[]}){
  const next=normalizeReservation({eventId,contact,seats});
  if(!Number.isSafeInteger(capacity)||capacity<1)throw Error('Aforo no confirmado');
  if(!Array.isArray(reservations))throw Error('Inventario de reservas inválido');
  const existing=reservations.map(normalizeReservation).filter(r=>r.eventId===next.eventId);
  if(existing.some(r=>r.contact===next.contact&&r.status!==BOOKING_STATES.CANCELLED))
    return {allowed:false,reason:'DUPLICATE'};
  const confirmed=existing.filter(r=>r.status===BOOKING_STATES.CONFIRMED).reduce((sum,r)=>sum+r.seats,0);
  if(confirmed>capacity)throw Error('Aforo ya excedido: requiere revisión');
  return {allowed:true,proposedStatus:BOOKING_STATES.PENDING,
    availableSeats:capacity-confirmed,
    canConfirm:next.seats<=capacity-confirmed};
}
export function validateTransition(from,to){
  if(!statuses.has(from)||!statuses.has(to))return false;
  if(from===to)return true;
  const allowed={
    pending:['confirmed','waitlist','cancelled'],
    confirmed:['cancelled'],
    waitlist:['pending','confirmed','cancelled'],
    cancelled:[]
  };
  return allowed[from].includes(to);
}
export function checkMinimumAttendance({minimum,confirmedSeats}){
  if(!Number.isSafeInteger(minimum)||minimum<1||!Number.isSafeInteger(confirmedSeats)||confirmedSeats<0)
    throw Error('Mínimo y asistentes confirmados requeridos');
  return {minimumReached:confirmedSeats>=minimum,missing:Math.max(0,minimum-confirmedSeats)};
}
