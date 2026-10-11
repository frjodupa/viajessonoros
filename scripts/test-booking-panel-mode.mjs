import assert from 'node:assert/strict';
import {createBookingPanelMode} from '../src/booking-panel-mode.js';
const events=[];
const demo=createBookingPanelMode({mode:'demo',onState:s=>events.push(s)});
assert.equal(demo.mode,'demo');
assert.equal(await demo.presenter.refresh(),true);
assert.equal(demo.bookings().length,3);
assert.throws(()=>createBookingPanelMode({mode:'demo',onState:()=>{},gateway:{}}),/no puede/);
assert.throws(()=>createBookingPanelMode({mode:'admin',onState:()=>{},eventId:'e1'}),/privado/);
assert.throws(()=>createBookingPanelMode({mode:'production',onState:()=>{}}),/no permitido/);
let calls=0;
const admin=createBookingPanelMode({mode:'admin',onState:()=>{},eventId:'e1',capacity:3,minimum:1,gateway:{
 counts:async eventId=>{calls++;return {eventId,counts:{confirmed:1}};},
 confirm:async()=>({changed:true}),cancel:async()=>({changed:true})
}});
assert.equal(admin.mode,'admin');
assert.equal(admin.bookings,undefined);
assert.equal(await admin.presenter.refresh(),true);
assert.equal(calls,1);
console.log('PASS: demo and private admin modes remain isolated');
