import assert from 'node:assert/strict';
import {createExperienceCapacityEditor} from '../src/booking-experience-capacity-editor.js';
const experience={id:'demo',aforo:12,aforo_minimo:6};
assert.throws(()=>createExperienceCapacityEditor({}),/SECURE_ADAPTER_REQUIRED/);
let writes=0;
const setup=(confirmed,authorized=true)=>createExperienceCapacityEditor({
 assertAdministrator:async()=>authorized,
 getConfirmedSeats:async()=>confirmed,
 saveCapacity:async x=>{writes++;return x}
});
await assert.rejects(()=>setup(2,false).update({experience,capacity:15,minimum:6}),/ADMIN_REQUIRED/);
assert.equal(writes,0);
await assert.rejects(()=>setup(undefined).update({experience,capacity:15,minimum:6}),/CONFIRMED_INVALID/);
assert.equal(writes,0);
assert.equal((await setup(10).update({experience,capacity:9,minimum:6})).reason,'BELOW_CONFIRMED');
assert.equal(writes,0);
const result=await setup(2).update({experience,capacity:15,minimum:6});
assert.deepEqual(result.patch,{aforo:15,aforo_minimo:6});
assert.equal(writes,1);
console.log('PASS: capacity editor requires explicit admin, occupancy, and injected server save');
