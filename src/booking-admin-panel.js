/** Orquestador del panel privado; no monta rutas, no crea sesiones ni envía WhatsApp.
 * Recibe una API previamente configurada con verificación administrativa.
 */
import {buildBookingDashboard} from './booking-dashboard.js';
import {getExperienceBookingLimits} from './booking-experience-capacity.js';
import {buildAttendeeRows} from './booking-attendee-list.js';
import {prepareReservationWhatsAppDraft} from './booking-message-action.js';
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
 async function changeStatus({action,eventId,reservationId}){
  if(action==='confirm')return gateway.confirm(eventId,reservationId);
  if(action==='cancel')return gateway.cancel(eventId,reservationId);
  throw Error('Acción no autorizada');
 }
 return Object.freeze({
  overview,
  overviewForExperience,
  changeStatus,
  attendeeRows:buildAttendeeRows,
  whatsappDraft:prepareReservationWhatsAppDraft
 });
}
