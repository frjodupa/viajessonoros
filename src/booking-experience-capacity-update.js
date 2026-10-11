/** Preparación de guardado del aforo en ficha de experiencia.
 * No escribe por sí solo: el llamador debe ser el editor autenticado.
 * El servidor debe validar ocupación confirmada antes del commit.
 */
import {validateExperienceCapacityEdit} from './booking-experience-capacity.js';
export function prepareExperienceCapacityUpdate({experience,capacity,minimum,confirmedSeats}){
 const verdict=validateExperienceCapacityEdit({experience,nextCapacity:capacity,nextMinimum:minimum,confirmedSeats});
 if(!verdict.allowed)return verdict;
 return Object.freeze({allowed:true,id:verdict.eventId,patch:Object.freeze({
  aforo:verdict.capacity,aforo_minimo:verdict.minimum
 })});
}
