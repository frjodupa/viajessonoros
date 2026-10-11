import assert from 'node:assert/strict';
import {bookingStore} from '../src/booking-store.js';
import {createPrivateBookingController} from '../src/booking-private-controller.js';
import {createBookingPanelClient} from '../src/booking-panel-client.js';
let queries=0;
const db={prepare(sql){
 queries++;
 assert.match(sql,/SELECT id, experience_id, seats, status, payment_status, created_at/);
 assert.doesNotMatch(sql,/contact_private|contact_hash/);
 return {bind:eventId=>{assert.equal(eventId,'evt');return{all:async()=>({results:[{id:'r1',experience_id:'evt',seats:2,status:'pending',payment_status:'unpaid',created_at:'2026-10-11',contact_private:'SECRET'}]})}}};
}};
const store=bookingStore(db);
const rows=await store.list('evt');
assert.equal(rows.length,1);assert.equal(rows[0].seats,2);
assert.equal(JSON.stringify(rows).includes('SECRET'),false);
const denied=createPrivateBookingController({db,authorize:async()=>({authorized:false})});
assert.equal((await denied.run({action:'list',eventId:'evt'})).status,401);
assert.equal(queries,1);
const allowed=createPrivateBookingController({db,authorize:async()=>({authorized:true})});
const response=await allowed.run({action:'list',eventId:'evt'});
assert.equal(response.status,200);assert.equal(response.body.reservations[0].id,'r1');
const client=createBookingPanelClient({endpoint:'/api/private/bookings',getAccessToken:async()=> 'admin-test',fetchImpl:async(url,options)=>{
 const payload=JSON.parse(options.body);
 assert.deepEqual(payload,{action:'list',eventId:'evt'});
 assert.equal(options.headers.authorization,'Bearer admin-test');
 return {ok:true,json:async()=>response.body};
}});
assert.equal((await client.list('evt')).reservations[0].status,'pending');
console.log('PASS: private booking list is authenticated and only returns minimal saved reservation metadata');
