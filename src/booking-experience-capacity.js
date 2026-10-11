/** Configuración de aforo de una experiencia.
 * La ficha administrativa es la fuente única; reservas solo hereda sus valores.
 * Módulo puro: no escribe en Supabase ni D1.
 */
function positiveInteger(value,label){
 const n=Number(value);
 if(value===null||value===undefined||value===''||!Number.isSafeInteger(n)||n<1)throw Error(label+'_INVALID');
 return n;
}
export function getExperienceBookingLimits(experience){
 if(!experience||typeof experience!=='object'||Array.isArray(experience))throw Error('EXPERIENCE_INVALID');
 const eventId=String(experience.id??'').trim();
 if(!eventId)throw Error('EVENT_ID_REQUIRED');
 const capacity=positiveInteger(experience.aforo,'CAPACITY');
 const minimum=experience.aforo_minimo==null||experience.aforo_minimo===''?1:positiveInteger(experience.aforo_minimo,'MINIMUM');
 if(minimum>capacity)throw Error('MINIMUM_ABOVE_CAPACITY');
 return Object.freeze({eventId,capacity,minimum});
}
export function validateExperienceCapacityEdit({experience,nextCapacity,nextMinimum,confirmedSeats=0}){
 const current=getExperienceBookingLimits(experience);
 const capacity=positiveInteger(nextCapacity,'CAPACITY');
 const minimum=positiveInteger(nextMinimum??current.minimum,'MINIMUM');
 if(!Number.isSafeInteger(confirmedSeats)||confirmedSeats<0)throw Error('CONFIRMED_INVALID');
 if(capacity<confirmedSeats)return Object.freeze({allowed:false,reason:'BELOW_CONFIRMED',confirmedSeats});
 if(minimum>capacity)return Object.freeze({allowed:false,reason:'MINIMUM_ABOVE_CAPACITY'});
 return Object.freeze({allowed:true,eventId:current.eventId,capacity,minimum});
}
