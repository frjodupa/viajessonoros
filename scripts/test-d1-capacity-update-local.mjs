#!/usr/bin/env node
/** Integración real contra Wrangler D1 --local, jamás --remote. Datos ficticios. */
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=mkdtempSync(path.join(tmpdir(),'viajes-capacity-local-'));
const config=path.join(root,'tests/d1/wrangler.toml');
const name='viajessonoros-bookings-local-test';
function sql(stmt,shouldFail=false){
 const file=path.join(dir,'statement.sql');writeFileSync(file,stmt);
 const args=['--yes','wrangler@4','d1','execute',name,'--local','--config',config,'--persist-to',dir,'--file',file];
 const result=spawnSync('npx',args,{cwd:root,encoding:'utf8',timeout:120000,env:{...process.env,CI:'true'}});
 if(result.error)throw result.error;
 if(shouldFail){if(result.status===0)throw Error('Expected rejection: '+stmt);return result.stderr+' '+result.stdout}
 if(result.status!==0)throw Error(result.stderr+' '+result.stdout);
 return result.stdout;
}
try{
 for(const name of ['0001_reservations.sql','0002_capacity_guards.sql']){
  const result=spawnSync('npx',['--yes','wrangler@4','d1','execute','viajessonoros-bookings-local-test','--local','--config',config,'--persist-to',dir,'--file',path.join(root,'migrations/d1',name)],{cwd:root,encoding:'utf8',timeout:120000,env:{...process.env,CI:'true'}});
  if(result.status!==0)throw Error(result.stderr+' '+result.stdout);
 }
 sql("INSERT INTO reservation_events(experience_id,capacity,minimum_attendees) VALUES ('demo-capacity',4,2);");
 sql("INSERT INTO reservations(id,experience_id,contact_hash,seats,status) VALUES ('r1','demo-capacity','fictional-hash',3,'confirmed');");
 const refused=sql("UPDATE reservation_events SET capacity=2,minimum_attendees=1 WHERE experience_id='demo-capacity';",true);
 if(!refused.includes('RESERVATION_CAPACITY_BELOW_CONFIRMED'))throw Error('Incorrect refusal: '+refused);
 sql("UPDATE reservation_events SET capacity=5,minimum_attendees=3 WHERE experience_id='demo-capacity';");
 sql("INSERT INTO reservations(id,experience_id,contact_hash,seats,status) VALUES ('r2','demo-capacity','fictional-hash-2',2,'pending');");
 sql("UPDATE reservations SET status='confirmed' WHERE id='r2';");
 const full=sql("UPDATE reservation_events SET capacity=4 WHERE experience_id='demo-capacity';",true);
 if(!full.includes('RESERVATION_CAPACITY_BELOW_CONFIRMED'))throw Error('Capacity lowered below occupied seats: '+full);
 sql("UPDATE reservations SET status='cancelled' WHERE id='r1';");
 sql("UPDATE reservation_events SET capacity=2,minimum_attendees=2 WHERE experience_id='demo-capacity';");
 console.log('PASS: D1 local allows expansion and safe reduction, rejects occupied reductions');
}finally{rmSync(dir,{recursive:true,force:true})}
