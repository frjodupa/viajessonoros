/** Contrato de aceptación pública: nunca confundir un borrador con una reserva persistida. */
export function interpretBookingSubmission(response,{eventId}={}){
 if(!response||typeof response!=='object'||Array.isArray(response))
  return Object.freeze({registered:false,status:'not_registered',reason:'INVALID_RESPONSE'});
 const validId=typeof response.reference==='string'&&/^[A-Za-z0-9_-]{6,128}$/.test(response.reference);
 const accepted=response.saved===true&&response.status==='pending'&&validId&&
   typeof eventId==='string'&&eventId.length>0&&response.eventId===eventId;
 if(!accepted)return Object.freeze({registered:false,status:'not_registered',reason:'NOT_PERSISTED'});
 return Object.freeze({registered:true,status:'pending',reference:response.reference,eventId});
}
