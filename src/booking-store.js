/**
 * Adaptador interno D1 de reservas (NO expone rutas HTTP).
 * El llamador debe comprobar autorización del administrador.
 * Las confirmaciones dependen de los triggers de 0002_capacity_guards.sql.
 */
export function bookingStore(db){
  if(!db||typeof db.prepare!=='function')throw Error('D1 no disponible');
  return {
    async list(eventId){
      if(typeof eventId!=='string'||!eventId.trim()||eventId.length>128)throw Error('Evento requerido');
      const result=await db.prepare(
        'SELECT id, experience_id, seats, status, payment_status, created_at FROM reservations WHERE experience_id=? ORDER BY created_at DESC, id DESC LIMIT 200'
      ).bind(eventId).all();
      return (result.results||[]).map(row=>({
        id:row.id,eventId:row.experience_id,seats:Number(row.seats),
        status:row.status,paymentStatus:row.payment_status,createdAt:row.created_at
      }));
    },
    async status({id,eventId}){
      if(typeof id!=='string'||!id.trim()||id.length>128||typeof eventId!=='string'||!eventId.trim()||eventId.length>128)
        throw Error('Identificadores requeridos');
      const result=await db.prepare(
        'SELECT id, experience_id, status, seats, payment_status FROM reservations WHERE id=? AND experience_id=?'
      ).bind(id,eventId).first();
      if(!result)return null;
      return {id:result.id,eventId:result.experience_id,status:result.status,seats:Number(result.seats),paymentStatus:result.payment_status};
    },
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
