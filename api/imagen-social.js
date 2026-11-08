// Entrega JPEG compatible con WhatsApp a partir de la fotografía ORIGINAL
// ya incluida en la portada SVG del evento 16. No altera el cartel ni la base de datos.
// Ruta de origen constante: nunca se aceptan URLs arbitrarias del visitante.
const HOST='https://viajessonoros.es';
const SVG_PATH='/portadas/concierto-meditativo-caceres-2026.svg';
export default async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');return res.status(405).end();}
  if(String(new URL(req.url,HOST).searchParams.get('experiencia')||'')!=='16')return res.status(404).end();
  try{
    const source=await fetch(HOST+SVG_PATH,{signal:AbortSignal.timeout(6500)});
    if(!source.ok)throw new Error('Imagen de origen no disponible');
    const svg=await source.text();
    if(svg.length>1500000)throw new Error('SVG demasiado grande');
    const match=svg.match(/<image\b[^>]*href="data:image\/jpeg;base64,([^"]+)"/i);
    if(!match||match[1].length>1000000)throw new Error('Fotografía no encontrada');
    const jpeg=Buffer.from(match[1],'base64');
    if(jpeg.length<1000||jpeg[0]!==0xff||jpeg[1]!==0xd8||jpeg[jpeg.length-2]!==0xff||jpeg[jpeg.length-1]!==0xd9)throw new Error('JPEG no válido');
    res.setHeader('Content-Type','image/jpeg');
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=86400');
    res.setHeader('Content-Length',String(jpeg.length));
    return res.status(200).end(req.method==='HEAD'?undefined:jpeg);
  }catch{
    return res.status(503).end('Imagen temporalmente no disponible');
  }
}
