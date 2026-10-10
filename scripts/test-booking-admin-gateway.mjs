import assert from 'node:assert/strict';
import {createBookingAdminGateway} from '../src/booking-admin-gateway.js';
let signedOut=false,network=0;
const supabase={auth:{getSession:async()=>({data:{session:{access_token:'session-token'}},error:null}),signOut:async()=>{signedOut=true;return {error:null}}}};
const api=createBookingAdminGateway({supabase,fetchImpl:async(url,options)=>{
 network++;
 assert.equal(url,'/api/private/bookings');
 assert.equal(options.headers.authorization,'Bearer session-token');
 return {ok:true,json:async()=>({counts:{confirmed:1}})};
}});
assert.equal((await api.counts('event-1')).counts.confirmed,1);
await api.confirm('event-1','res-1');
await api.cancel('event-1','res-1');
assert.equal(network,3);
await api.signOut();
assert.equal(signedOut,true);
const expired=createBookingAdminGateway({supabase:{auth:{getSession:async()=>({data:{session:null}})}},fetchImpl:async()=>{throw Error('network prohibited')}});
await assert.rejects(()=>expired.counts('event-1'),/Sesión/);
console.log('PASS: Supabase session connected to private panel client without anonymous requests');
