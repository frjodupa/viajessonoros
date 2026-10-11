import assert from 'node:assert/strict';
import {createCapacitySyncCoordinator} from '../src/booking-capacity-sync.js';
const experience={id:'fictional',aforo:12,aforo_minimo:5};
assert.throws(()=>createCapacitySyncCoordinator({}),/ATOMIC_ADAPTER_REQUIRED/);
let writes=0;
const make=(confirmedSeats,admin=true)=>createCapacitySyncCoordinator({
 assertAdministrator:async()=>admin,
 runExclusive:async(id,fn)=>{assert.equal(id,'fictional');return fn({confirmedSeats,commit:async patch=>{writes++;return patch}})}
});
await assert.rejects(()=>make(2,false).update({experience,capacity:13,minimum:5}),/ADMIN_REQUIRED/);
assert.equal(writes,0);
await assert.rejects(()=>make(undefined).update({experience,capacity:13,minimum:5}),/CONFIRMED_INVALID/);
assert.equal(writes,0);
assert.equal((await make(9).update({experience,capacity:8,minimum:5})).reason,'BELOW_CONFIRMED');
assert.equal(writes,0);
assert.deepEqual(await make(9).update({experience,capacity:10,minimum:5}),{aforo:10,aforo_minimo:5});
assert.equal(writes,1);
await assert.rejects(()=>createCapacitySyncCoordinator({
 assertAdministrator:async()=>true,runExclusive:async(_id,fn)=>fn({confirmedSeats:2})
}).update({experience,capacity:12,minimum:5}),/ATOMIC_COMMIT_REQUIRED/);
console.log('PASS: capacity sync requires explicit exclusive adapter and rejects unsafe edits');
