import assert from 'node:assert/strict';
import {prepareBookingReceipt} from '../src/booking-receipt-template.js';
const event={id:'exp1',titulo:'Viaje Sonoro'};
const reservation={persisted:true,status:'pending',id:'sol-001',eventId:'exp1',phone:'610056859',name:'Persona de prueba'};
const receipt=prepareBookingReceipt({event,reservation,optedIn:true});
assert.equal(receipt.template,'solicitud_recibida_pendiente');
assert.equal(receipt.to,'610056859');
assert.match(receipt.text,/PENDIENTE DE CONFIRMACIÓN/);
for(const changed of [{persisted:false},{status:'confirmed'},{eventId:'exp2'}]){
 assert.throws(()=>prepareBookingReceipt({event,reservation:{...reservation,...changed},optedIn:true}));
}
assert.throws(()=>prepareBookingReceipt({event,reservation,optedIn:false}),/RECEIPT_NOT_AUTHORIZED/);
console.log('PASS: customer auto-receipt requires consent and persisted pending booking');
