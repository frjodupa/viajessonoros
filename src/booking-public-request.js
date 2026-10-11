/** Solicitud pública: validador sin efectos, nunca inserta en D1.
 * Las reservas reales requerirán cifrado de contactos, control antiabuso y API de escritura.
 */
export function validatePublicBookingRequest(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return {valid:false,error:'INVALID_REQUEST'};
 const eventId=typeof value.eventId==='string'?value.eventId.trim():'';
 const name=typeof value.name==='string'?value.name.trim():'';
 const phone=typeof value.phone==='string'?value.phone.replace(/[\s().-]/g,'').trim():'';
 const seats=Number(value.seats);
 if(!eventId||eventId.length>128||name.length<2||name.length>100||!/^\+?\d{9,15}$/.test(phone)||!Number.isSafeInteger(seats)||seats<1||seats>10)
  return {valid:false,error:'INVALID_BOOKING_FIELDS'};
 return {valid:true,data:{eventId,name,phone,seats,status:'pending'}};
}
export function createOfflineBookingSubmission({onPending}={}){
 return Object.freeze({
  async submit(input){
   const validation=validatePublicBookingRequest(input);
   if(!validation.valid)return {accepted:false,error:validation.error};
   // No DB/network calls; the generated ID has no meaning outside the demo.
   const result={accepted:true,mode:'demo',status:'pending',seats:validation.data.seats};
   if(typeof onPending==='function')onPending(result);
   return result;
  }
 });
}
