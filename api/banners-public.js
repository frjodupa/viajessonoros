import { all,published } from './_banner-core.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=30');
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 if(!process.env.BLOB_READ_WRITE_TOKEN)return res.status(200).json({banners:[]});
 try{return res.status(200).json({banners:published(await all())})}
 catch{return res.status(200).json({banners:[]})}
}