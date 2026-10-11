/**
 * API local de pruebas: procesa solicitudes ficticias sin base de datos ni red.
 * No se puede iniciar en producción, preview o staging.
 */
import {createOfflineBookingSubmission} from './booking-public-request.js';
export function createIsolatedBookingTestApi({environment,hostname}={}){
 if(environment!=='local-test' || !['localhost','127.0.0.1','::1'].includes(hostname))
   throw Error('ISOLATED_TEST_ONLY');
 const service=createOfflineBookingSubmission();
 return async function(request){
  if(!request || typeof request.url!=='string')return Response.json({error:'INVALID_REQUEST'},{status:400});
  let url;
  try{url=new URL(request.url)}catch{return Response.json({error:'INVALID_REQUEST'},{status:400})}
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname))
    return Response.json({error:'ISOLATED_TEST_ONLY'},{status:403});
  if(url.pathname!=='/api/demo/bookings')return new Response(null,{status:404});
  if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST'}});
  const origin=request.headers.get('origin');
  if(origin){
   let trusted=false;
   try{trusted=new URL(origin).origin===url.origin}catch{/* reject malformed origin */}
   if(!trusted)return Response.json({error:'ORIGIN_DENIED'},{status:403});
  }
  if(String(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!=='application/json')
    return Response.json({error:'INVALID_CONTENT_TYPE'},{status:415});
  let data;
  try{
   const raw=await request.text();
   if(new TextEncoder().encode(raw).length>2048)return Response.json({error:'BODY_TOO_LARGE'},{status:413});
   data=JSON.parse(raw);
  }catch{return Response.json({error:'INVALID_JSON'},{status:400});}
  const result=await service.submit(data);
  return Response.json(result,{status:result.accepted?202:400,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 };
}
