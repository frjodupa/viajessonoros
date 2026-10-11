/** Integración futura del editor: sin conexión propia, sin permisos implícitos.
 * El adaptador de guardado se inyecta únicamente después de revisar RLS y sincronización.
 * Requiere servidor de reservas como autoridad para la ocupación.
 */
import {prepareExperienceCapacityUpdate} from './booking-experience-capacity-update.js';
export function createExperienceCapacityEditor({getConfirmedSeats,saveCapacity,assertAdministrator}={}){
 if(typeof getConfirmedSeats!=='function'||typeof saveCapacity!=='function'||typeof assertAdministrator!=='function')
   throw Error('SECURE_ADAPTER_REQUIRED');
 return Object.freeze({
  async update({experience,capacity,minimum}){
   const permitted=await assertAdministrator();
   if(permitted!==true)throw Error('ADMIN_REQUIRED');
   const confirmedSeats=await getConfirmedSeats(String(experience?.id??''));
   const prepared=prepareExperienceCapacityUpdate({experience,capacity,minimum,confirmedSeats});
   if(!prepared.allowed)return prepared;
   // El adaptador servidor DEBE repetir la comprobación de ocupación al confirmar
   // el cambio. Esta verificación previa no es atómica entre Supabase y D1.
   return saveCapacity(prepared);
  }
 });
}
