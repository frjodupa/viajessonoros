/** Inserción D1 sólo desde un Worker protegido; jamás enviar contacto en claro.
 * Requiere evento previamente configurado y contacto cifrado por el servidor.
 */
export function createPublicBookingStore(db){
 if(!db?.prepare)throw Error('D1_REQUIRED');
 return Object.freeze({
  async create({id,eventId,contactHash,encryptedContact,seats}){
   if(!/^[A-Za-z0-9_-]{6,128}$/.test(String(id||''))||!/^[A-Za-z0-9_-]{1,128}$/.test(String(eventId||''))||
      !/^[a-f0-9]{64}$/.test(String(contactHash||''))||typeof encryptedContact!=='string'||encryptedContact.length<16||
      !Number.isSafeInteger(seats)||seats<1||seats>10)throw Error('INVALID_PRIVATE_BOOKING');
   const result=await db.prepare(
    "INSERT INTO reservations(id,experience_id,contact_hash,contact_private,seats,status) VALUES(?,?,?,?,?,'pending')"
   ).bind(id,eventId,contactHash,encryptedContact,seats).run();
   if(Number(result?.meta?.changes)!==1)throw Error('BOOKING_NOT_PERSISTED');
   return Object.freeze({saved:true,status:'pending',reference:id,eventId});
  }
 });
}
