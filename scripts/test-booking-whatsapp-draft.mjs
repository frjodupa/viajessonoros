import assert from 'node:assert/strict';
import {buildBookingWhatsAppDraft} from '../src/booking-whatsapp-draft.js';
const event={id:'e1',titulo:'Viaje Sonoro',fecha:'2026-10-24',hora:'19:00',precio:'20 €',lugar:'Cáceres'};
const request={eventId:'e1',name:'Persona de prueba',phone:'+34600000000',seats:2};
const message=buildBookingWhatsAppDraft({event,request});
for(const piece of ['Viaje Sonoro','2026-10-24','20 €','Persona de prueba','+34600000000','Plazas solicitadas: 2','Pendiente de confirmación por el organizador'])
 assert.ok(message.includes(piece),piece);
assert.throws(()=>buildBookingWhatsAppDraft({event,request:{...request,eventId:'e2'}}),/EVENT_MISMATCH/);
assert.throws(()=>buildBookingWhatsAppDraft({event,request:{...request,seats:0}}),/SEATS_INVALID/);
assert.equal(buildBookingWhatsAppDraft({event:{...event,titulo:'Viaje\nInventado'},request}).includes('Viaje\nInventado'),false);
console.log('PASS: WhatsApp booking draft retains experience contribution and never confirms automatically');
