import { authorized,validOrigin,all,write,validate,uploadImage } from './_banner-core.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Vary','Authorization');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Método no permitido'});
 if(!validOrigin(req))return res.status(403).json({error:'Origen no autorizado'});
 if(!authorized(req))return res.status(401).json({error:'Credenciales administrativas necesarias'});
 if(!process.env.BLOB_READ_WRITE_TOKEN)return res.status(503).json({error:'Almacenamiento Blob pendiente de configurar'});
 try{
  if(req.method==='GET')return res.status(200).json({banners:await all()});
  if(JSON.stringify(req.body||{}).length>3100000)return res.status(413).json({error:'Datos demasiado grandes'});
  if(req.body?.operation==='image'){
   const url=await uploadImage(req.body);
   return res.status(200).json({url});
  }
  if(req.body?.operation!=='save')return res.status(400).json({error:'Operación inválida'});
  const updated=validate(req.body.banner);
  const rows=await all(),index=rows.findIndex(x=>x.slug===updated.slug);
  if(index>=0)rows[index]=updated;else rows.push(updated);
  await write(rows);
  return res.status(200).json({banner:updated});
 }catch(e){
  return res.status(500).json({error:'No se ha podido completar el guardado',detail:process.env.NODE_ENV==='development'?e.message:undefined});
 }
}