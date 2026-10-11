/** Orquestador del panel privado; no monta rutas, no crea sesiones ni envía WhatsApp.
 * Recibe una API previamente configurada con verificación administrativa.
 */
import {buildBookingDashboard} from './booking-dashboard.js';
import {getExperienceBookingLimits} from './booking-experience-capacity.js';
import {buildAttendeeRows} from './booking-attendee-list.js';
import {prepareReservationWhatsAppDraft} from './booking-message-action.js';
import {prepareManualBookingReply} from './booking-manual-reply.js';
export function createBookingAdminPanel({gateway}){
 if(!gateway||typeof gateway.counts!=='function'||typeof gateway.confirm!=='function'||typeof gateway.cancel!=='function')
  throw Error('Gateway administrativo requerido');
 async function overview({eventId,capacity,minimum}){
  const result=await gateway.counts(eventId);
  if(result?.eventId!==eventId)throw Error('Respuesta de experiencia incorrecta');
  return buildBookingDashboard({capacity,minimum,counts:result.counts});
 }
 async function overviewForExperience(experience){
  const {eventId,capacity,minimum}=getExperienceBookingLimits(experience);
  return overview({eventId,capacity,minimum});
 }
 async function reservations(eventId){
  if(typeof gateway.list!=='function')throw Error('Listado privado no disponible');
  const result=await gateway.list(eventId);
  if(result?.eventId!==eventId||!Array.isArray(result.reservations))throw Error('Listado inválido');
  return buildAttendeeRows(result.reservations);
 }
 async function reservationStatus({eventId,reservationId}){
  if(typeof gateway.status!=='function')throw Error('Consulta privada de reservas no disponible');
  const result=await gateway.status(eventId,reservationId);
  if(result?.reservation?.eventId!==eventId||result?.reservation?.id!==reservationId)
   throw Error('Respuesta de reserva incorrecta');
  return result.reservation;
 }
 async function checkReplyEligibility({eventId,reservationId,decision}){
  if(decision!=='pending'&&decision!=='confirmed')throw Error('Decisión inválida');
  const reservation=await reservationStatus({eventId,reservationId});
  return Object.freeze({
   eventId,reservationId,status:reservation.status,
   allowed:reservation.status===decision,
   // Un estado autorizado no implica disponer de datos de contacto ni envío.
   requiresPrivateContact:true,delivered:false
  });
 }
 async function changeStatus({action,eventId,reservationId}){
  if(action==='confirm')return gateway.confirm(eventId,reservationId);
  if(action==='cancel')return gateway.cancel(eventId,reservationId);
  throw Error('Acción no autorizada');
 }
 return Object.freeze({
  overview,
  overviewForExperience,
  changeStatus,
  reservationStatus,
  reservations,
  checkReplyEligibility,
  attendeeRows:buildAttendeeRows,
  whatsappDraft:prepareReservationWhatsAppDraft,
  manualReply:prepareManualBookingReply
 });
}
