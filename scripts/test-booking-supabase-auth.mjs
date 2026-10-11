import assert from 'node:assert/strict';
import {createSupabaseBookingAuthorizer} from '../src/booking-supabase-auth.js';
const calls=[];
const makeResponse=(status,body)=>({ok:status===200,async json(){return body}});
const authorize=createSupabaseBookingAuthorizer({
 supabaseUrl:'https://example.supabase.co',anonKey:'public-test-key',adminUserIds:'u-admin',
 fetchImpl:async(url,options)=>{calls.push({url,options});return makeResponse(200,{id:'u-admin'});}
});
assert.deepEqual(await authorize('Bearer verified-token'),{authorized:true,userId:'u-admin'});
assert.equal(calls[0].url,'https://example.supabase.co/auth/v1/user');
assert.equal(calls[0].options.headers.Authorization,'Bearer verified-token');
const nonAdmin=createSupabaseBookingAuthorizer({
 supabaseUrl:'https://example.supabase.co',anonKey:'public-test-key',adminUserIds:'u-admin',
 fetchImpl:async()=>makeResponse(200,{id:'another-user'})
});
assert.equal((await nonAdmin('Bearer verified-token')).reason,'FORBIDDEN');
const invalid=createSupabaseBookingAuthorizer({
 supabaseUrl:'https://example.supabase.co',anonKey:'public-test-key',adminUserIds:'u-admin',
 fetchImpl:async()=>makeResponse(401,{message:'invalid'})
});
assert.equal((await invalid('Bearer expired-token')).reason,'UNAUTHENTICATED');
assert.equal((await authorize('Bearer')).reason,'UNAUTHENTICATED');
assert.throws(()=>createSupabaseBookingAuthorizer({supabaseUrl:'http://unsafe.local',anonKey:'key',adminUserIds:'u-admin'}));
assert.throws(()=>createSupabaseBookingAuthorizer({supabaseUrl:'https://example.supabase.co',anonKey:'key',adminUserIds:''}));
console.log('PASS: Supabase verifies bearer identity and checks server-side allowlist');
