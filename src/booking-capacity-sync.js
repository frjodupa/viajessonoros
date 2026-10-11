/** Prepara sincronización de aforo bajo un adaptador transaccional exclusivo.
 * No conecta con Supabase ni D1. El adaptador debe garantizar exclusión mutua
 * por experiencia para ediciones y confirmaciones, o rechazar el cambio.
 */
import {prepareExperienceCapacityUpdate} from './booking-experience-capacity-update.js';
export function createCapacitySyncCoordinator({runExclusive,assertAdministrator}={}){
 if(typeof runExclusive!=='function'||typeof assertAdministrator!=='function')throw Error('ATOMIC_ADAPTER_REQUIRED');
 return Object.freeze({
  async update({experience,capacity,minimum}){
   if(await assertAdministrator()!==true)throw Error('ADMIN_REQUIRED');
   const eventId=String(experience?.id??'').trim();
   if(!eventId)throw Error('EVENT_ID_REQUIRED');
   return runExclusive(eventId,async({confirmedSeats,commit})=>{
    if(typeof commit!=='function')throw Error('ATOMIC_COMMIT_REQUIRED');
    const result=prepareExperienceCapacityUpdate({experience,capacity,minimum,confirmedSeats});
    if(!result.allowed)return result;
    return commit(result.patch);
   });
  }
 });
}
