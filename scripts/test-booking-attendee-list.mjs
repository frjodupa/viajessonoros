import assert from 'node:assert/strict';
import {buildAttendeeRows} from '../src/booking-attendee-list.js';
const rows=buildAttendeeRows([
 {id:'r1',status:'pending',seats:2},
 {id:'r2',status:'confirmed',seats:1},
 {id:'r3',status:'waitlist',seats:3},
 {id:'r4',status:'cancelled',seats:1}
]);
assert.equal(rows[0].canConfirm,true);
assert.equal(rows[1].canConfirm,false);
assert.equal(rows[2].canConfirm,true);
assert.equal(rows[3].canCancel,false);
assert.equal(rows[0].label,'Pendiente');
assert.deepEqual(Object.keys(rows[0]),['id','seats','status','label','canConfirm','canCancel']);
assert.throws(()=>buildAttendeeRows([{id:'x',status:'unknown',seats:1}]),/Estado/);
assert.throws(()=>buildAttendeeRows([{id:'x',status:'pending',seats:0}]),/Reserva/);
console.log('PASS: administrative attendee rows exclude contact details');
