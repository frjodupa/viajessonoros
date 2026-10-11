import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../demos/booking-customer-flow.html',import.meta.url),'utf8');
for(const id of ['reservationForm','nombre','telefono','plazas','step1','step2','step3','step4','confirm','cancel','draft','reset'])
 assert.match(html,new RegExp('id="'+id+'"'));
assert.match(html,/Solicitud pendiente/);
assert.match(html,/Borrador de WhatsApp \(no enviado\)/);
assert.match(html,/form\.addEventListener\('submit'/);
assert.doesNotMatch(html,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|https:\/\/wa\.me|supabase\.co/);
console.log('PASS: fictional complete booking flow has no network or persistence');
