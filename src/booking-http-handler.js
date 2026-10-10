/**
 * Adaptador HTTP privado, sin rutas instaladas ni despliegue.
 * El Worker que lo utilice debe configurar CORS con origen estricto,
 * rate limiting, secretos y una instancia D1 real.
 */
import {createPrivateBookingController} from './booking-private-controller.js';
export function createBookingHttpHandler({db,authorize}){
  const controller=createPrivateBookingController({db,authorize});
  return async function handle(request){
    if(!request||typeof request.method!=='string')return new Response(null,{status:400});
    if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST'}});
    const type=String(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    if(type!=='application/json')return Response.json({error:'INVALID_CONTENT_TYPE'},{status:415});
    const length=Number(request.headers.get('content-length')||0);
    if(length>4096)return Response.json({error:'BODY_TOO_LARGE'},{status:413});
    let body;
    try{
      const raw=await request.text();
      if(raw.length>4096)return Response.json({error:'BODY_TOO_LARGE'},{status:413});
      body=JSON.parse(raw);
      if(!body||typeof body!=='object'||Array.isArray(body))throw Error('invalid');
    }catch{return Response.json({error:'INVALID_JSON'},{status:400});}
    const result=await controller.run({
      authorization:request.headers.get('authorization'),
      action:body.action,eventId:body.eventId,reservationId:body.reservationId
    });
    return Response.json(result.body,{status:result.status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  };
}
