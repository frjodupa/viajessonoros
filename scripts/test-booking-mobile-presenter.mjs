import assert from 'node:assert/strict';
import {createBookingMobilePresenter} from '../src/booking-mobile-presenter.js';
const states=[],calls=[];
const presenter=createBookingMobilePresenter({eventId:'e1',capacity:5,minimum:3,onState:s=>states.push(s),gateway:{
 counts:async eventId=>{calls.push('counts');return {eventId,counts:{confirmed:2}}},
 confirm:async()=>{calls.push('confirm');return {changed:true}},
 cancel:async()=>{calls.push('cancel');return {changed:true}}
}});
assert.equal(await presenter.refresh(),true);
assert.equal(states.at(-1).overview.available,3);
assert.equal(await presenter.change('confirm','r1'),true);
assert.deepEqual(calls,['counts','confirm','counts']);
assert.equal(await presenter.change('delete','r1'),false);
const failed=createBookingMobilePresenter({eventId:'e1',capacity:5,minimum:3,onState:s=>states.push(s),gateway:{
 counts:async()=>{throw Error('token-value-should-not-leak')},
 confirm:async()=>({changed:false}),cancel:async()=>({changed:false})
}});
assert.equal(await failed.refresh(),false);
assert.equal(states.at(-1).phase,'error');
assert.doesNotMatch(states.at(-1).message,/token-value/);
console.log('PASS: mobile presenter refreshes after actions and handles errors without exposing credentials');
