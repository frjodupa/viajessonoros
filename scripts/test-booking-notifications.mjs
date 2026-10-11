import assert from 'node:assert/strict';
import {prepareBookingNotifications} from '../src/booking-notifications.js';
const event={id:'exp',titulo:'Viaje Sonoro'};
const reservation={id:'sol-123',eventId:'exp',name:'Persona prueba',phone:'600000000',seats:1,status:'pending',persisted:true};
const result=prepareBookingNotifications({event,reservation,optedIn:true});
assert.equal(result.reference,'sol-123');
assert.equal(result.customer.parameters[2],result.admin.reference);
assert.equal(result.delivery,'not_sent');
assert.equal(result.confirmation,'pending');
assert.equal(prepareBookingNotifications({event,reservation,optedIn:false}).customer,null);
for(const change of [{persisted:false},{status:'confirmed'},{eventId:'another'}])
 assert.throws(()=>prepareBookingNotifications({event,reservation:{...reservation,...change},optedIn:true}));
console.log('PASS: both notices require same persisted pending reservation and never claim delivery');
