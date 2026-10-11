import assert from 'node:assert/strict';
import {interpretBookingSubmission} from '../src/booking-submission-receipt.js';
const eventId='event-123';
for(const value of [undefined,null,{}, {accepted:true,mode:'demo',status:'pending'}, {saved:false,status:'pending',reference:'ABCDEF',eventId}, {saved:true,status:'confirmed',reference:'ABCDEF',eventId}, {saved:true,status:'pending',reference:'ABCDEF',eventId:'other'}, {saved:true,status:'pending',reference:'x',eventId}]){
 const result=interpretBookingSubmission(value,{eventId});
 assert.equal(result.registered,false);
 assert.equal(result.status,'not_registered');
}
const result=interpretBookingSubmission({saved:true,status:'pending',reference:'BOOK-12345',eventId},{eventId});
assert.deepEqual(result,{registered:true,status:'pending',reference:'BOOK-12345',eventId});
console.log('PASS: only a valid persisted server receipt permits registered booking copy');
