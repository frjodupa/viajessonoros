import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})
const env=(name:string)=>String(Deno.env.get(name)||'').trim()
const graphVersion=()=>env('META_GRAPH_VERSION')||'v26.0'
const EXPECTED_PAGE_ID='1389157527881023'
const EXPECTED_INSTAGRAM_ID='17841409097576270'
const sanitizeMetaError=(value:unknown)=>{
  let message=String(value||'Error desconocido de Meta.')
  for(const secret of [env('META_FACEBOOK_PAGE_ACCESS_TOKEN'),env('META_APP_SECRET')].filter(Boolean))message=message.split(secret).join('[credencial oculta]')
  return message.replace(/EAA[A-Za-z0-9_-]{30,}/g,'[credencial oculta]')
}

const graphRequest=async(path:string,values:Record<string,string>)=>{
  const response=await fetch(`https://graph.facebook.com/${graphVersion()}/${path}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(values)})
  const data=await response.json()
  if(!response.ok||data.error)throw new Error(sanitizeMetaError(data.error?.message||`Meta ha respondido con HTTP ${response.status}.`))
  return data
}

const graphRead=async(path:string,values:Record<string,string>)=>{
  const query=new URLSearchParams(values)
  const response=await fetch(`https://graph.facebook.com/${graphVersion()}/${path}?${query}`)
  const data=await response.json()
  if(!response.ok||data.error)throw new Error(sanitizeMetaError(data.error?.message||`Meta ha respondido con HTTP ${response.status}.`))
  return data
}

const inspectCredentials=async(token:string)=>{
  const appId=env('META_APP_ID'),appSecret=env('META_APP_SECRET'),pageId=env('META_FACEBOOK_PAGE_ID')
  const instagramId=env('META_INSTAGRAM_ACCOUNT_ID')
  if(!appId||!appSecret||!pageId||!instagramId)throw new Error('Faltan identificadores o credenciales de Meta en los secretos de la función.')
  const debug=await graphRead('debug_token',{input_token:token,access_token:`${appId}|${appSecret}`})
  const page=await graphRead('me',{fields:'id,name,instagram_business_account{id,username}',access_token:token})
  const required=['pages_show_list','pages_read_engagement','pages_manage_posts','instagram_basic','instagram_content_publish']
  const granted=Array.isArray(debug.data?.scopes)?debug.data.scopes:[]
  const linked=page.instagram_business_account||{}
  return {
    valid:Boolean(debug.data?.is_valid),
    expiresAt:debug.data?.expires_at?new Date(debug.data.expires_at*1000).toISOString():null,
    expiresWithinSevenDays:Boolean(debug.data?.expires_at&&debug.data.expires_at*1000<=Date.now()+7*86400000),
    app:{expected:'2135596150091272',actual:String(debug.data?.app_id||'')},
    page:{expected:EXPECTED_PAGE_ID,actual:String(page.id||''),configuredCorrectly:pageId===EXPECTED_PAGE_ID,name:String(page.name||'')},
    instagram:{expectedId:EXPECTED_INSTAGRAM_ID,actualId:String(linked.id||''),configuredCorrectly:instagramId===EXPECTED_INSTAGRAM_ID,expectedUsername:'viajessonoros',actualUsername:String(linked.username||'')},
    permissions:{required,granted:required.filter(permission=>granted.includes(permission)),missing:required.filter(permission=>!granted.includes(permission))}
  }
}

const fingerprint=async(value:unknown)=>{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('')
}

const validateToken=async(token:string)=>{
  const configuredExpiry=env('META_TOKEN_EXPIRES_AT')
  if(configuredExpiry){
    const expiresAt=Date.parse(configuredExpiry)
    if(!Number.isFinite(expiresAt))throw new Error('META_TOKEN_EXPIRES_AT no contiene una fecha válida.')
    if(expiresAt<=Date.now()+7*86400000)throw new Error('El token de Meta ha caducado o caducará en menos de siete días. Renueva el token de larga duración.')
  }
  const appId=env('META_APP_ID'),appSecret=env('META_APP_SECRET')
  if(!appId||!appSecret)return
  const query=new URLSearchParams({input_token:token,access_token:`${appId}|${appSecret}`})
  const response=await fetch(`https://graph.facebook.com/${graphVersion()}/debug_token?${query}`)
  const body=await response.json()
  if(!response.ok||!body.data?.is_valid)throw new Error(body.error?.message||'Meta indica que el token ya no es válido.')
  if(body.data.expires_at&&body.data.expires_at*1000<=Date.now()+7*86400000)throw new Error('El token de Meta caducará en menos de siete días. Debe renovarse antes de publicar.')
}

const validatePublicImage=async(url:string,network:string)=>{
  let parsed:URL
  try{parsed=new URL(url)}catch{throw new Error('La imagen no tiene una URL pública válida.')}
  if(parsed.protocol!=='https:')throw new Error('Meta requiere que la imagen sea accesible mediante HTTPS.')
  const response=await fetch(parsed,{method:'GET',headers:{Range:'bytes=0-0'},redirect:'follow'})
  if(!response.ok&&response.status!==206)throw new Error(`La imagen no es accesible públicamente (HTTP ${response.status}).`)
  const type=String(response.headers.get('content-type')||'').split(';')[0].toLowerCase()
  const allowed=network==='instagram'?['image/jpeg']:['image/jpeg','image/png','image/webp']
  if(!allowed.includes(type))throw new Error(network==='instagram'?'Instagram requiere una imagen JPEG pública.':'Facebook requiere una imagen JPEG, PNG o WebP pública.')
  const length=Number(response.headers.get('content-length')||0)
  if(length>8*1024*1024)throw new Error('La imagen supera el límite seguro de 8 MB configurado para la publicación.')
}

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(request.method!=='POST')return json({error:'Método no permitido.'},405)
  const authorization=request.headers.get('Authorization'),supabaseURL=env('SUPABASE_URL'),anonKey=env('SUPABASE_ANON_KEY'),serviceKey=env('SUPABASE_SERVICE_ROLE_KEY')
  if(!authorization||!supabaseURL||!anonKey||!serviceKey)return json({error:'Configuración de Supabase incompleta.'},500)
  let payload:{action?:string;experienceId?:string|number;targets?:string[];start?:string;end?:string;mode?:'feed'|'story';storyImageUrl?:string}
  try{payload=await request.json()}catch{return json({error:'Solicitud no válida.'},400)}
  const bearer=authorization.replace(/^Bearer\s+/i,'')
  if(payload.action==='validate_credentials'){
    let serviceRole=false
    try{serviceRole=JSON.parse(atob(bearer.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='service_role'}catch{/* Token no JWT */}
    if(bearer!==serviceKey&&!serviceRole)return json({error:'Acceso no autorizado.'},401)
    const pageToken=env('META_FACEBOOK_PAGE_ACCESS_TOKEN')
    if(!pageToken)return json({error:'No está configurado el token de página de Meta.'},503)
    try{return json(await inspectCredentials(pageToken))}catch(error){return json({error:error instanceof Error?error.message:'No se pudieron validar las credenciales de Meta.'},503)}
  }
  if(payload.action==='audit_facebook_posts'){
    let serviceRole=false
    try{serviceRole=JSON.parse(atob(bearer.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='service_role'}catch{/* Token no JWT */}
    if(bearer!==serviceKey&&!serviceRole)return json({error:'Acceso no autorizado.'},401)
    const pageToken=env('META_FACEBOOK_PAGE_ACCESS_TOKEN')
    if(!pageToken)return json({error:'No está configurado el token de página de Meta.'},503)
    try{
      const identity=await graphRead('me',{fields:'id',access_token:pageToken})
      if(String(identity.id||'')!==EXPECTED_PAGE_ID)throw new Error('El token configurado no pertenece a la página esperada.')
      const start=Math.floor(Date.parse(String(payload.start||''))/1000),end=Math.floor(Date.parse(String(payload.end||''))/1000)
      if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>370*86400)throw new Error('La ventana de auditoría no es válida.')
      const posts=await graphRead(`${EXPECTED_PAGE_ID}/published_posts`,{fields:'id,created_time,message,permalink_url,attachments{media_type,title,url}',since:String(start),until:String(end),limit:'100',access_token:pageToken})
      return json({pageId:identity.id,posts:posts.data||[]})
    }catch(error){return json({error:error instanceof Error?sanitizeMetaError(error.message):'No se pudieron auditar las publicaciones.'},503)}
  }

  const client=createClient(supabaseURL,anonKey,{global:{headers:{Authorization:authorization}}})
  const admin=createClient(supabaseURL,serviceKey)
  const {data:userData,error:userError}=await client.auth.getUser()
  if(userError||!userData.user)return json({error:'Acceso no autorizado.'},401)

  const targets=[...new Set(payload.targets||[])].filter(target=>target==='facebook'||target==='instagram')
  if(!payload.experienceId||!targets.length)return json({error:'Falta la experiencia o la red de destino.'},400)
  const {data:experience,error:experienceError}=await client.from('experiencias').select('*').eq('id',payload.experienceId).single()
  if(experienceError||!experience)return json({error:'No se pudo leer la experiencia con los permisos del usuario.'},403)
  if(!experience.publicado)return json({error:'Solo se pueden publicar experiencias marcadas como publicadas.'},409)

  const publicURL=new URL('/experiencias.html',env('PUBLIC_SITE_URL')||'https://viajessonoros.es')
  publicURL.searchParams.set('experiencia',String(experience.id))
  const caption=[experience.titulo,[experience.fecha,String(experience.hora||'').slice(0,5)].filter(Boolean).join(' · '),experience.lugar,experience.precio,experience.descripcion,publicURL.href].filter(Boolean).join('\n\n')
  const mode=payload.mode==='story'?'story':'feed'
  const socialImage=mode==='story'?String(payload.storyImageUrl||'').trim():String(experience.imagen_url||'').trim()
  if(mode==='story'&&!socialImage)return json({error:'Falta la imagen 9:16 de la historia.'},400)
  const contentFingerprint=await fingerprint({caption,image:socialImage,mode})
  const pageToken=env('META_FACEBOOK_PAGE_ACCESS_TOKEN')
  if(!pageToken)return json({error:'No está configurado el token de página de Meta.'},503)

  let pageIdentity:{id?:string;instagram_business_account?:{id?:string}}
  try{
    await validateToken(pageToken)
    pageIdentity=await graphRead('me',{fields:'id,instagram_business_account{id}',access_token:pageToken})
    if(String(pageIdentity.id||'')!==EXPECTED_PAGE_ID)throw new Error('El token configurado no pertenece a la página de Facebook esperada.')
    if(String(pageIdentity.instagram_business_account?.id||'')!==EXPECTED_INSTAGRAM_ID)throw new Error('La página no tiene vinculada la cuenta profesional de Instagram esperada.')
  }catch(error){return json({error:error instanceof Error?sanitizeMetaError(error.message):'El token de Meta no es válido.'},503)}

  const results:Record<string,{ok:boolean;skipped?:boolean;id?:string;url?:string;error?:string}>={}
  for(const network of targets){
    if(mode==='feed'){
      const {data:previous}=await admin.from('experience_social_publications').select('*').eq('experience_id',experience.id).eq('network',network).maybeSingle()
      if(previous?.status==='published'&&previous.content_fingerprint===contentFingerprint){results[network]={ok:true,skipped:true,id:previous.post_id,url:previous.post_url||undefined};continue}
      await admin.from('experience_social_publications').upsert({experience_id:experience.id,network,status:'pending',content_fingerprint:contentFingerprint,image_url:socialImage||null,post_id:null,post_url:null,published_at:null,attempted_at:new Date().toISOString(),error_message:null,updated_at:new Date().toISOString()},{onConflict:'experience_id,network'})
    }

    try{
      if(!socialImage)throw new Error('Selecciona y guarda una imagen pública antes de publicar en redes.')
      await validatePublicImage(socialImage,network)
      let postId=''
      let postURL=''

      if(network==='facebook'){
        const pageId=String(pageIdentity.id||'')
        if(mode==='story'){
          const photo=await graphRequest(`${pageId}/photos`,{url:socialImage,published:'false',access_token:pageToken})
          const story=await graphRequest(`${pageId}/photo_stories`,{photo_id:String(photo.id||''),access_token:pageToken})
          postId=String(story.post_id||story.id||photo.id||'')
        }else{
          const published=await graphRequest(`${pageId}/photos`,{url:socialImage,caption,access_token:pageToken})
          postId=published.post_id||published.id
          const postDetails=await graphRead(postId,{fields:'id,permalink_url',access_token:pageToken})
          postURL=String(postDetails.permalink_url||'')
        }
      }else{
        const instagramId=env('META_INSTAGRAM_ACCOUNT_ID'),instagramToken=env('META_INSTAGRAM_ACCESS_TOKEN')||pageToken
        if(!instagramId)throw new Error('Falta META_INSTAGRAM_ACCOUNT_ID.')
        const values:Record<string,string>={image_url:socialImage,access_token:instagramToken}
        if(mode==='story')values.media_type='STORIES'
        else values.caption=caption
        const container=await graphRequest(`${instagramId}/media`,values)
        const published=await graphRequest(`${instagramId}/media_publish`,{creation_id:container.id,access_token:instagramToken})
        postId=published.id
        if(mode==='feed'){
          const postDetails=await graphRead(postId,{fields:'id,permalink',access_token:instagramToken})
          postURL=String(postDetails.permalink||'')
        }
      }

      const publishedAt=new Date().toISOString()
      if(mode==='feed')await admin.from('experience_social_publications').update({status:'published',post_id:postId,post_url:postURL||null,published_at:publishedAt,error_message:null,updated_at:publishedAt}).eq('experience_id',experience.id).eq('network',network)
      results[network]={ok:true,id:postId,url:postURL||undefined}
    }catch(error){
      const message=error instanceof Error?error.message:'Error desconocido.'
      if(mode==='feed')await admin.from('experience_social_publications').update({status:'failed',error_message:message,updated_at:new Date().toISOString()}).eq('experience_id',experience.id).eq('network',network)
      results[network]={ok:false,error:message}
    }
  }

  const succeeded=Object.values(results).filter(result=>result.ok).length
  return json({ok:succeeded===targets.length,partial:succeeded>0&&succeeded<targets.length,mode,results},succeeded?200:502)
})
