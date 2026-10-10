import assert from 'node:assert/strict';
import {createBookingAdminSession} from '../src/booking-admin-session.js';
const ok=createBookingAdminSession({supabase:{auth:{
 getSession:async()=>({data:{session:{access_token:'fake-session-token'}},error:null}),
 signOut:async()=>({error:null})
}}});
assert.equal(await ok.getAccessToken(),'fake-session-token');
await ok.signOut();
const expired=createBookingAdminSession({supabase:{auth:{getSession:async()=>({data:{session:null},error:null})}}});
assert.equal(await expired.getAccessToken(),null);
const errored=createBookingAdminSession({supabase:{auth:{getSession:async()=>({data:null,error:new Error('no session')})}}});
assert.equal(await errored.getAccessToken(),null);
await assert.rejects(()=>expired.signOut(),/disponible/);
assert.throws(()=>createBookingAdminSession({supabase:{}}),/requerido/);
console.log('PASS: booking session tokens are transient and missing sessions denied');
