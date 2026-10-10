/**
 * Adaptador interno D1 de reservas (NO expone rutas HTTP).
 * El llamador debe comprobar autorización del administrador.
 * Las confirmaciones dependen de los triggers de 0002_capacity_guards.sql.
 */
export function bookingStore(db){
  if(!db||typeof db.prepare!=='function')throw Error('D1 no disponible');
  return {
    async counts(eventId){
      if(!String(eventId||'').trim())throw Error('Evento requerido');
      const result=await db.prepare(
        "SELECT status, COALESCE(SUM(seats),0) AS seats FROM reservations WHERE experience_id=? GROUP BY status"
      ).bind(String(eventId)).all();
      const counts={pending:0,confirmed:0,waitlist:0,cancelled:0};
      for(const row of result.results||[]){
        if(Object.hasOwn(counts,row.status))counts[row.status]=Number(row.seats)||0;
      }
      return counts;
    },
    async confirm({id,eventId}){
      if(!String(id||'').trim()||!String(eventId||'').trim())throw Error('Identificadores requeridos');
      // SQL condicional: una transición válida y única.
      // El trigger de D1 rechaza la operación si ya se alcanzó el aforo.
      const result=await db.prepare(
        "UPDATE reservations SET status='confirmed', updated_at=CURRENT_TIMESTAMP WHERE id=? AND experience_id=? AND status IN ('pending','waitlist')"
      ).bind(String(id),String(eventId)).run();
      return {changed:Number(result.meta?.changes||0)===1};
    },
    async cancel({id,eventId}){
      if(!String(id||'').trim()||!String(eventId||'').trim())throw Error('Identificadores requeridos');
      const result=await db.prepare(
        "UPDATE reservations SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE id=? AND experience_id=? AND status IN ('pending','waitlist','confirmed')"
      ).bind(String(id),String(eventId)).run();
      return {changed:Number(result.meta?.changes||0)===1};
    }
  };
}
