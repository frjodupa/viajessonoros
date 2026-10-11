import assert from 'node:assert/strict';
import {validatePublicBookingRequest,createOfflineBookingSubmission} from '../src/booking-public-request.js';
assert.equal(validatePublicBookingRequest({eventId:'demo',name:'Ficticio Test',phone:'000000000',seats:'1'}).valid,true);
for(const input of [{eventId:'',name:'A',phone:'1',seats:0},{eventId:'demo',name:'A',phone:'000000000',seats:1},{eventId:'demo',name:'Prueba',phone:'abc',seats:1},{eventId:'demo',name:'Prueba',phone:'000000000',seats:11}])
 assert.equal(validatePublicBookingRequest(input).valid,false);
let callback;
const demo=createOfflineBookingSubmission({onPending:r=>callback=r});
const result=await demo.submit({eventId:'demo',name:'Persona Ficticia',phone:'000000000',seats:1});
assert.equal(result.status,'pending');
assert.equal(result.mode,'demo');
assert.deepEqual(callback,result);
assert.equal(Object.hasOwn(result,'phone'),false);
assert.equal(Object.hasOwn(result,'name'),false);
console.log('PASS: demo public request stays offline and redacts contact data');
