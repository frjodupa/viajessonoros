/** Operación D1 para actualizar aforo donde se confirman reservas.
 * Depende de los triggers de 0002_capacity_guards.sql instalados en la MISMA D1.
 * No ejecuta migraciones ni añade endpoints; invocar solo desde API autorizada.
 */
export function createD1CapacityStore(db){
 if(!db||typeof db.prepare!=='function')throw Error('D1_REQUIRED');
 return Object.freeze({
  async update({eventId,capacity,minimum}){
   if(typeof eventId!=='string'||!eventId.trim()||eventId.length>128)throw Error('EVENT_INVALID');
   if(!Number.isSafeInteger(capacity)||capacity<1||!Number.isSafeInteger(minimum)||minimum<1||minimum>capacity)
    throw Error('CAPACITY_INVALID');
   // UPDATE atómico: el trigger verifica las plazas confirmadas en la misma D1.
   try{
    const result=await db.prepare(
     'UPDATE reservation_events SET capacity=?,minimum_attendees=?,updated_at=CURRENT_TIMESTAMP WHERE experience_id=?'
    ).bind(capacity,minimum,eventId).run();
    return {changed:Number(result.meta?.changes||0)===1};
   }catch(error){
    if(String(error?.message||'').includes('RESERVATION_CAPACITY_BELOW_CONFIRMED'))
     return {changed:false,reason:'BELOW_CONFIRMED'};
    throw error;
   }
  }
 });
}
