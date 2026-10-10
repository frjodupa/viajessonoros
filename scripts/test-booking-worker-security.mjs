import assert from 'node:assert/strict';
import {createBookingWorker} from '../src/booking-worker.js';
let dbCalls=0, authCalls=0;
const db={prepare(){dbCalls++;return {bind(){return {async all(){return {results:[]}}}}}}};
const worker=createBookingWorker({db,supabaseUrl:'https://example.supabase.co',anonKey:'public-test',
 adminUserIds:'real-admin',
 fetchImpl:async(_url,opts)=>{authCalls++;return {ok:opts.headers.Authorization==='Bearer admin-token',
 json:async()=>({id:opts.headers.Authorization==='Bearer admin-token'?'real-admin':'other-user'})};}});
const url='https://website.example/api/private/bookings',body=JSON.stringify({action:'counts',eventId:'fake'});
const send=(headers={})=>worker(new Request(url,{method:'POST',headers:{'content-type':'application/json',...headers},body}));
assert.equal((await send()).status,401);
assert.equal(dbCalls,0);
assert.equal((await send({authorization:'Bearer fake-token'})).status,401);
assert.equal(dbCalls,0);
assert.equal((await send({authorization:'Bearer admin-token',origin:'https://attacker.example'})).status,403);
assert.equal(dbCalls,0);
assert.equal((await send({authorization:'Bearer admin-token'})).status,200);
assert.equal(dbCalls,1);
const nonadmin=createBookingWorker({db,supabaseUrl:'https://example.supabase.co',anonKey:'public-test',adminUserIds:'real-admin',
 fetchImpl:async()=>({ok:true,json:async()=>({id:'other-user',role:'admin'})})});
assert.equal((await nonadmin(new Request(url,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer spoofed-token'},body}))).status,403);
assert.equal(dbCalls,1,'Rol declarado por usuario no concede acceso');
assert.ok(authCalls>=2);
console.log('PASS: admin spoofing, invalid tokens and cross-origin access denied before D1');
