import assert from 'node:assert/strict';
import {createCapacitySyncCoordinator} from '../src/booking-capacity-sync.js';
// Adaptador simulado con cola exclusiva por evento. No utiliza red ni bases reales.
let current={capacity:5,confirmed:2};
let tail=Promise.resolve(), log=[];
function exclusive(_id,work){
 const execute=async()=>work({
  confirmedSeats:current.confirmed,
  commit:async patch=>{current.capacity=patch.aforo;log.push(['capacity',patch.aforo]);return patch}
 });
 const next=tail.then(execute,execute);
 tail=next.then(()=>{},()=>{});
 return next;
}
async function confirm(seats){
 return exclusive('fictional',async()=>{if(current.confirmed+seats>current.capacity)return false;current.confirmed+=seats;log.push(['confirm',seats]);return true});
}
const editor=createCapacitySyncCoordinator({assertAdministrator:async()=>true,runExclusive:exclusive});
const experience={id:'fictional',aforo:5,aforo_minimo:1};
const results=await Promise.all([confirm(2),editor.update({experience,capacity:3,minimum:1})]);
assert.equal(results[0],true);
assert.equal(results[1].reason,'BELOW_CONFIRMED');
assert.equal(current.capacity,5);
assert.equal(current.confirmed,4);
current={capacity:5,confirmed:2};tail=Promise.resolve();log=[];
const reverse=await Promise.all([editor.update({experience,capacity:3,minimum:1}),confirm(2)]);
assert.ok(
 (reverse[0]?.aforo===3 && reverse[1]===false && current.capacity===3 && current.confirmed===2) ||
 (reverse[0]?.reason==='BELOW_CONFIRMED' && reverse[1]===true && current.capacity===5 && current.confirmed===4),
 'Both possible serial orders must preserve capacity and confirmed seats'
);
assert.ok(current.confirmed<=current.capacity);
console.log('PASS: simulated shared exclusive lock prevents race between confirmation and capacity shrink');
