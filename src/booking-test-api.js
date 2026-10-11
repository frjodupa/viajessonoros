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
  const url=new URL(request.url);
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname))
    return Response.json({error:'ISOLATED_TEST_ONLY'},{status:403});
  if(url.pathname!=='/api/demo/bookings')return new Response(null,{status:404});
  if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST'}});
  if(request.headers.get('origin') && new URL(request.headers.get('origin')).origin!==url.origin)
    return Response.json({error:'ORIGIN_DENIED'},{status:403});
  if(!String(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
    return Response.json({error:'INVALID_CONTENT_TYPE'},{status:415});
  let data;
  try{
   const raw=await request.text();
   if(raw.length>2048)return Response.json({error:'BODY_TOO_LARGE'},{status:413});
   data=JSON.parse(raw);
  }catch{return Response.json({error:'INVALID_JSON'},{status:400});}
  const result=await service.submit(data);
  return Response.json(result,{status:result.accepted?202:400,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 };
}
