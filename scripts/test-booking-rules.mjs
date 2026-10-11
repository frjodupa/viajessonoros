import assert from 'node:assert/strict';
import {checkReservation,validateTransition,checkMinimumAttendance,evaluateConfirmation} from '../src/booking-rules.js';
const reservations=[
 {eventId:'evento-ejemplo',contact:'uno@example.test',seats:2,status:'confirmed'},
 {eventId:'evento-ejemplo',contact:'dos@example.test',seats:1,status:'pending'}
];
assert.deepEqual(checkReservation({eventId:'evento-ejemplo',contact:'UNO@example.test',capacity:3,reservations}).reason,'DUPLICATE');
const next=checkReservation({eventId:'evento-ejemplo',contact:'tres@example.test',seats:2,capacity:3,reservations});
assert.equal(next.allowed,true);
assert.equal(next.canConfirm,false);
assert.equal(next.proposedStatus,'pending');
assert.equal(checkReservation({eventId:'otro-evento',contact:'uno@example.test',capacity:3,reservations}).canConfirm,true);
assert.equal(validateTransition('pending','confirmed'),true);
assert.equal(validateTransition('cancelled','confirmed'),false);
assert.equal(checkMinimumAttendance({minimum:5,confirmedSeats:2}).missing,3);
assert.throws(()=>checkReservation({eventId:'x',contact:'a',capacity:0}),/Aforo/);
console.log('PASS: reglas de reservas, duplicados, aforo y mínimo');

const bookings=[
 {id:'r1',eventId:'e1',contact:'uno@example.test',seats:2,status:'confirmed'},
 {id:'r2',eventId:'e1',contact:'dos@example.test',seats:2,status:'pending'},
 {id:'r3',eventId:'e1',contact:'tres@example.test',seats:1,status:'cancelled'}
];
assert.equal(evaluateConfirmation({reservationId:'r2',eventId:'e1',capacity:3,reservations:bookings}).reason,'FULL');
assert.equal(evaluateConfirmation({reservationId:'r2',eventId:'e1',capacity:4,reservations:bookings}).allowed,true);
assert.equal(evaluateConfirmation({reservationId:'r1',eventId:'e1',capacity:3,reservations:bookings}).alreadyConfirmed,true);
assert.equal(evaluateConfirmation({reservationId:'r3',eventId:'e1',capacity:4,reservations:bookings}).reason,'INVALID_TRANSITION');
assert.equal(evaluateConfirmation({reservationId:'missing',eventId:'e1',capacity:4,reservations:bookings}).reason,'NOT_FOUND');
