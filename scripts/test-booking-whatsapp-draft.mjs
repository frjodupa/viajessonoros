import assert from 'node:assert/strict';
import {buildBookingWhatsAppDraft} from '../src/booking-whatsapp-draft.js';
const event={id:'e1',titulo:'Viaje Sonoro',fecha:'2026-10-24',hora:'19:00',precio:'20 €',lugar:'Cáceres'};
const request={eventId:'e1',name:'Persona de prueba',phone:'+34600000000',seats:2};
const message=buildBookingWhatsAppDraft({event,request});
for(const piece of ['Viaje Sonoro','2026-10-24','40,00','20,00','610 056 859','captura del justificante','disponibilidad','Persona de prueba','Plazas solicitadas: 2'])
 assert.ok(message.includes(piece),piece);
assert.equal(message.includes('confirmada tu reserva'),false);
for(const value of ['17','20 €','22,00 €']){
 const amount=buildBookingWhatsAppDraft({event:{...event,precio:value},request:{...request,seats:1}});
 assert.ok(amount.includes(value.slice(0,2)+',00'),value);
}
const unknown=buildBookingWhatsAppDraft({event:{...event,precio:'Consultar'},request});
assert.match(unknown,/consúltanos el importe exacto/);
assert.doesNotMatch(unknown,/realiza un Bizum de/);
assert.throws(()=>buildBookingWhatsAppDraft({event,request:{...request,eventId:'e2'}}),/EVENT_MISMATCH/);
assert.throws(()=>buildBookingWhatsAppDraft({event,request:{...request,seats:0}}),/SEATS_INVALID/);
assert.equal(buildBookingWhatsAppDraft({event:{...event,titulo:'Viaje\\nInventado'},request}).includes('Viaje\\nInventado'),false);
console.log('PASS: WhatsApp draft uses experience contribution per seat, Bizum receipt and manual confirmation');
