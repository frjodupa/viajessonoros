import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
let member=false,rpcError=null,authError=null;
process.env.VITE_SUPABASE_URL='https://aaaaaaaaaaaaaaaaaaaa.supabase.co';process.env.VITE_SUPABASE_ANON_KEY='synthetic-public';process.env.VS_BANNERS_ADMIN_USER='admin@synthetic.invalid';
globalThis.__bannerClient=(_url,_key,options)=>{assert.equal(options.global.headers.Authorization,'Bearer synthetic');return {auth:{getUser:async()=>({data:{user:{email:'admin@synthetic.invalid'}},error:authError})},rpc:async name=>{assert.equal(name,'is_vs_admin');return {data:member,error:rpcError};}};};
let source=await readFile(new URL('../../api/banners-admin.js',import.meta.url),'utf8');source=source.replace("import { createClient } from '@supabase/supabase-js';",'const createClient=globalThis.__bannerClient;').replace("'./_banner-core.js'",JSON.stringify(new URL('../../api/_banner-core.js',import.meta.url).href));
const handler=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
async function request(){let status;const res={setHeader(){},status(n){status=n;return this;},json(){return status;}};await handler({method:'GET',headers:{authorization:'Bearer synthetic',origin:'https://viajessonoros.es',host:'viajessonoros.es'}},res);return status;}
test('correo coincidente sin membresía no concede acceso',async()=>{member=false;assert.equal(await request(),401);});
test('error de Auth o de RPC deniega acceso',async()=>{member=true;rpcError={message:'offline'};assert.equal(await request(),401);rpcError=null;authError={message:'invalid'};assert.equal(await request(),401);authError=null;});
test('admin verificado llega a guardia de almacenamiento sin llamadas remotas',async()=>{member=true;assert.equal(await request(),503);});
test.after(()=>{delete globalThis.__bannerClient;});
