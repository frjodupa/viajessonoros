import assert from 'node:assert/strict';
import {checkReservation,evaluateConfirmation} from '../src/booking-rules.js';
import {buildBookingDashboard} from '../src/booking-dashboard.js';
import {buildAttendeeRows} from '../src/booking-attendee-list.js';
import {prepareReservationWhatsAppDraft} from '../src/booking-message-action.js';
const experience={title:'Experiencia ficticia',date:'30/10/2026',time:'19:00',place:'Sala de pruebas'};
const eventId='test-event',capacity=3;
const reservations=[{id:'r1',eventId,contact:'first@example.test',seats:2,status:'confirmed'},
 {id:'r2',eventId,contact:'second@example.test',seats:1,status:'pending'}];
const count=()=>({confirmed:reservations.filter(r=>r.status==='confirmed').reduce((n,r)=>n+r.seats,0),
 pending:reservations.filter(r=>r.status==='pending').reduce((n,r)=>n+r.seats,0)});
assert.equal(buildBookingDashboard({capacity,minimum:2,counts:count()}).available,1);
assert.equal(checkReservation({eventId,contact:'first@example.test',capacity,reservations}).reason,'DUPLICATE');
assert.equal(evaluateConfirmation({reservationId:'r2',eventId,capacity,reservations}).allowed,true);
const before=prepareReservationWhatsAppDraft({event:experience,phone:'34600000000',reservation:reservations[1]});
assert.match(before.message,/pendiente de confirmación/);
reservations[1].status='confirmed';
assert.equal(buildBookingDashboard({capacity,minimum:2,counts:count()}).available,0);
assert.equal(evaluateConfirmation({reservationId:'r2',eventId,capacity,reservations}).alreadyConfirmed,true);
const after=prepareReservationWhatsAppDraft({event:experience,phone:'34600000000',reservation:reservations[1]});
assert.match(after.message,/está confirmada/);
assert.match(after.message,/aforo mínimo/);
assert.equal(buildAttendeeRows(reservations)[1].canConfirm,false);
assert.equal(checkReservation({eventId,contact:'third@example.test',seats:1,capacity,reservations}).canConfirm,false);
reservations[0].status='cancelled';
assert.equal(buildBookingDashboard({capacity,minimum:2,counts:count()}).available,2);
assert.equal(buildAttendeeRows(reservations)[0].canCancel,false);
assert.match(prepareReservationWhatsAppDraft({event:experience,phone:'34600000000',reservation:reservations[0]}).message,/cancelada/);
console.log('PASS: test booking lifecycle, capacity, dashboard, and WhatsApp draft');
