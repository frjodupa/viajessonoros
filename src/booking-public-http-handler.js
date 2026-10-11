/** Adaptador HTTP público SIN despliegue. Debe montarse detrás de controles antiabuso.
 * No permite reservas hasta que el implementador aporte un verificador antiabuso.
 */
import {interpretBookingSubmission} from './booking-submission-receipt.js';
export function createPublicBookingHttpHandler({register,verifyAbuse}={}){
 if(typeof register!=='function'||typeof verifyAbuse!=='function')throw Error('PUBLIC_SECURITY_DEPENDENCIES_REQUIRED');
 return async function handle(request){
  if(!request||request.method!=='POST')return Response.json({error:'METHOD_NOT_ALLOWED'},{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}});
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(String(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!=='application/json')
   return Response.json({error:'INVALID_CONTENT_TYPE'},{status:415,headers});
  if(Number(request.headers.get('content-length')||0)>2048)return Response.json({error:'BODY_TOO_LARGE'},{status:413,headers});
  let data;
  try{
   const raw=await request.text();
   if(raw.length>2048) return Response.json({error:'BODY_TOO_LARGE'},{status:413,headers});
   data=JSON.parse(raw);
   if(!data||typeof data!=='object'||Array.isArray(data))throw Error('BAD_BODY');
  }catch{return Response.json({error:'INVALID_JSON'},{status:400,headers});}
  try{
   if(await verifyAbuse(request,data)!==true)return Response.json({error:'REQUEST_REJECTED'},{status:429,headers});
   const result=await register(data);
   const receipt=interpretBookingSubmission(result,{eventId:data.eventId});
   if(receipt.registered)
    return Response.json({saved:true,eventId:receipt.eventId,status:'pending',reference:receipt.reference},{status:201,headers});
   const code=result?.error==='DUPLICATE_ACTIVE_REQUEST'?409:result?.error==='EVENT_NOT_AVAILABLE'||result?.error==='CAPACITY_EXCEEDED'?409:result?.error==='INVALID_BOOKING_FIELDS'?400:503;
   return Response.json({saved:false,error:code===409?'BOOKING_UNAVAILABLE':code===400?'INVALID_BOOKING_FIELDS':'REGISTRATION_FAILED'},{status:code,headers});
  }catch{return Response.json({saved:false,error:'REGISTRATION_FAILED'},{status:503,headers});}
 };
}
