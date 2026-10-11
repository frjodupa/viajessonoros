import assert from 'node:assert/strict';
import {prepareExperienceCapacityUpdate} from '../src/booking-experience-capacity-update.js';
const experience={id:'demo',aforo:12,aforo_minimo:5,precio:'25 €'};
const ok=prepareExperienceCapacityUpdate({experience,capacity:15,minimum:6,confirmedSeats:7});
assert.deepEqual(ok,{allowed:true,id:'demo',patch:{aforo:15,aforo_minimo:6}});
assert.equal(prepareExperienceCapacityUpdate({experience,capacity:6,minimum:5,confirmedSeats:7}).reason,'BELOW_CONFIRMED');
assert.equal(Object.hasOwn(ok.patch,'precio'),false);
console.log('PASS: admin capacity update prepares only capacity fields without writing to production');
