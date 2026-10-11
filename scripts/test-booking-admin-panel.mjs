import assert from 'node:assert/strict';
import {createBookingAdminPanel} from '../src/booking-admin-panel.js';
const calls=[];
const panel=createBookingAdminPanel({gateway:{
 counts:async eventId=>({eventId,counts:{confirmed:3,pending:2,waitlist:0,cancelled:0}}),
 confirm:async(eventId,id)=>{calls.push(['confirm',eventId,id]);return {changed:true}},
 cancel:async(eventId,id)=>{calls.push(['cancel',eventId,id]);return {changed:true}}
}});
const data=await panel.overview({eventId:'event-test',capacity:10,minimum:5});
assert.equal(data.available,7);
assert.equal(data.missingMinimum,2);
const inherited=await panel.overviewForExperience({id:'event-test',aforo:10,aforo_minimo:5});
assert.equal(inherited.capacity,10);
assert.equal(inherited.available,7);
await assert.rejects(()=>panel.overviewForExperience({id:'event-test'}),/CAPACITY_INVALID/);
assert.equal(panel.attendeeRows([{id:'r1',status:'pending',seats:1}])[0].canConfirm,true);
assert.match(panel.whatsappDraft({event:{title:'Evento prueba',date:'24/10/2026',place:'Sala ficticia'},reservation:{status:'pending',seats:1},phone:'34600000000'}).message,/pendiente/);
await panel.changeStatus({action:'confirm',eventId:'event-test',reservationId:'r1'});
await panel.changeStatus({action:'cancel',eventId:'event-test',reservationId:'r1'});
assert.deepEqual(calls,[['confirm','event-test','r1'],['cancel','event-test','r1']]);
await assert.rejects(()=>panel.changeStatus({action:'delete',eventId:'event-test',reservationId:'r1'}),/no autorizada/);
await assert.rejects(()=>panel.overview({eventId:'different',capacity:2,minimum:1}),/superior/);
assert.throws(()=>createBookingAdminPanel({gateway:{}}),/requerido/);
console.log('PASS: isolated admin panel aggregates, state actions and manual WhatsApp drafts');
