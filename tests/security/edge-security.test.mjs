import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {isAdminUser,approvedImageURL,validateStorageImage} from '../../supabase/functions/publish-experience-social/security.ts';
const host='https://aaaaaaaaaaaaaaaaaaaa.supabase.co', image=host+'/storage/v1/object/public/eventos/poster.jpg';
const fakeClient=(user,admin,error=null)=>({auth:{getUser:async()=>({data:{user},error:null})},rpc:async()=>({data:admin,error})});
test('solo usuario verificado con membresía administrativa',async()=>{
 assert.equal(await isAdminUser(fakeClient({id:'admin'},true)),true);
 assert.equal(await isAdminUser(fakeClient({id:'ordinary',user_metadata:{admin:true,role:'service_role'}},false)),false);
 assert.equal(await isAdminUser(fakeClient(null,true)),false);
 assert.equal(await isAdminUser(fakeClient({id:'admin'},true,{message:'RPC unavailable'})),false);
 assert.equal(await isAdminUser({auth:{getUser:async()=>{throw Error('offline')}},rpc:async()=>({data:true})}),false);
});
test('URL de bucket autorizada, ninguna URL arbitraria',()=>{
 assert.equal(approvedImageURL(image,host).href,image);
 for(const value of [host+'/storage/v1/object/public/eventos/a/../poster.jpg',host+'/storage/v1/object/public/eventos/a%252fb.jpg',host+'/storage/v1/object/public/eventos//poster.jpg','http://127.0.0.1/a.jpg','https://127.0.0.1/a.jpg','https://169.254.169.254/a.jpg','https://[::1]/a.jpg','https://synthetic.invalid.evil.test/storage/v1/object/public/eventos/a.jpg','https://user:pass@synthetic.invalid/storage/v1/object/public/eventos/a.jpg',host+'/storage/v1/object/public/other/a.jpg',image+'?redirect=https://evil.test',image+'#fragment',host+'/storage/v1/object/public/eventos/%2e%2e/other/a.jpg',host+'/storage/v1/object/public/eventos/a%2fb.jpg',host+'/storage/v1/object/public/eventos/evil.svg'])assert.throws(()=>approvedImageURL(value,host));
});
test('SSRF rechazada antes de fetch; redirect error, timeout y cancelación',async()=>{
 let calls=0;
 await assert.rejects(validateStorageImage('https://evil.test/a.jpg','facebook',host,async()=>{calls++;throw Error('should not execute')}));assert.equal(calls,0);
 await validateStorageImage(image,'facebook',host,async(url,options)=>{calls++;assert.equal(String(url),image);assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);return new Response(new Uint8Array([255,216,255]),{headers:{'content-type':'image/jpeg'}})});assert.equal(calls,1);
 await assert.rejects(validateStorageImage(image,'facebook',host,async()=>new Response(null,{status:302,headers:{location:'https://evil.test'}})));
 await assert.rejects(validateStorageImage(image,'instagram',host,async()=>new Response('x',{headers:{'content-type':'image/webp'}})));
 await assert.rejects(validateStorageImage(image,'facebook',host,async()=>new Response('x',{headers:{'content-type':'image/jpeg','content-length':'8388609'}})));
 await assert.rejects(validateStorageImage(image,'facebook',host,async()=>new Response(new Uint8Array(8388609),{headers:{'content-type':'image/jpeg'}})));
 await assert.rejects(validateStorageImage(image,'facebook',host,async()=>new Response(new Uint8Array(),{headers:{'content-type':'image/jpeg'}})));
});
let handler,authorized=false,verified=true,writes=0,fetches=0,images=image;
const env={SUPABASE_URL:host,SUPABASE_ANON_KEY:'synthetic-public',SUPABASE_SERVICE_ROLE_KEY:'synthetic-private-not-real',META_FACEBOOK_PAGE_ACCESS_TOKEN:'synthetic-meta-not-real',META_INSTAGRAM_ACCOUNT_ID:'17841409097576270'};
globalThis.Deno={env:{get:name=>env[name]},serve:fn=>handler=fn};
globalThis.__createClient=()=>({auth:{getUser:async()=>({data:{user:verified?{id:'synthetic-user'}:null},error:verified?null:{message:'invalid'}})},rpc:async()=>({data:authorized,error:null}),from(table){const q={select(){return q},eq(){return q},single:async()=>({data:{id:101,publicado:true,titulo:'Sintética',imagen_url:images},error:null}),maybeSingle:async()=>({data:null}),upsert:async()=>{writes++;return{error:null}},update(){writes++;return q},then(resolve){resolve({error:null})}};return q;}});
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{fetches++;const u=new URL(url);if(u.origin===host)return new Response(new Uint8Array([255,216,255]),{headers:{'content-type':'image/jpeg'}});assert.equal(u.hostname,'graph.facebook.com');if(u.pathname.endsWith('/me'))return Response.json({id:'1389157527881023',instagram_business_account:{id:'17841409097576270'}});if(options.method==='POST')return Response.json({id:'synthetic-post',post_id:'synthetic-post'});return Response.json({id:'synthetic-post',permalink_url:'https://www.facebook.com/synthetic-post'});};
let source=await readFile(new URL('../../supabase/functions/publish-experience-social/index.ts',import.meta.url),'utf8');
source=source.replace(/import \{ createClient \} from '[^']+'/, 'const createClient=globalThis.__createClient').replace("from './security.ts'",'from '+JSON.stringify(new URL('../../supabase/functions/publish-experience-social/security.ts',import.meta.url).href));
await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const request=(body,token='synthetic-user-token',origin='https://viajessonoros.es')=>new Request('https://edge.synthetic.invalid',{method:'POST',headers:{Authorization:'Bearer '+token,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('handler real: no autenticado y no administrador sin escritura ni Graph',async()=>{
 verified=false;authorized=false;writes=fetches=0;assert.equal((await handler(request({experienceId:101,targets:['facebook']}))).status,401);assert.equal(writes+fetches,0);
 verified=true;assert.equal((await handler(request({experienceId:101,targets:['facebook']}))).status,403);assert.equal(writes+fetches,0);
});
test('JWT fabricado service_role no evita guardia',async()=>{
 const forged='header.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.fake-signature';
 for(const action of ['validate_credentials','audit_facebook_posts'])assert.equal((await handler(request({action},forged))).status,401);
 assert.equal(fetches,0);
});
test('CORS cerrado y cuerpo targets inválido',async()=>{
 assert.equal((await handler(request({experienceId:101,targets:['facebook']},'x','https://evil.test'))).status,403);
 authorized=true;assert.equal((await handler(request({experienceId:101,targets:'facebook'}))).status,400);
});
test('administrador autorizado publica solo mediante dobles sintéticos',async()=>{
 authorized=verified=true;writes=fetches=0;images=image;
 const res=await handler(request({experienceId:101,targets:['facebook']}));assert.equal(res.status,200);assert.equal((await res.json()).ok,true);assert.equal(writes,2);assert.ok(fetches>=3);
});

test('URL base no puede ser loopback, puerto alternativo ni origen configurable arbitrario',()=>{
 for(const base of ['https://127.0.0.1','https://169.254.169.254','https://localhost','https://evil.test',host+':8443',host+'/path',host+'?q=1'])assert.throws(()=>approvedImageURL(image,base));
});
test('RPC no booleana y error de autenticación fallan cerrados',async()=>{
 assert.equal(await isAdminUser(fakeClient({id:'ordinary'},'true')),false);
 assert.equal(await isAdminUser({auth:{getUser:async()=>({data:{user:{id:'admin'}},error:{message:'invalid'}})},rpc:async()=>({data:true})}),false);
});
test('handler sin Authorization y payload nulo/array no crean efectos',async()=>{
 writes=fetches=0;
 const noAuth=new Request('https://edge.synthetic.invalid',{method:'POST',headers:{Origin:'https://viajessonoros.es','Content-Type':'application/json'},body:'{}'});
 assert.equal((await handler(noAuth)).status,401);
 for(const body of [null,[]])assert.equal((await handler(request(body))).status,400);
 assert.equal(writes+fetches,0);
});
test('handler admin rechaza SSRF antes de Meta y antes de escribir estados',async()=>{
 authorized=verified=true;writes=fetches=0;images='https://169.254.169.254/a.jpg';
 assert.equal((await handler(request({experienceId:101,targets:['facebook']}))).status,400);
 assert.equal(writes+fetches,0);images=image;
});
test.after(()=>{globalThis.fetch=originalFetch;delete globalThis.Deno;delete globalThis.__createClient;});
