#!/usr/bin/env node
/** Ejecuta migraciones D1 exclusivamente en almacenamiento local aislado.
 * Requiere Wrangler 4 disponible (npx wrangler@4); no hace deploy ni --remote.
 */
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=mkdtempSync(path.join(tmpdir(),'viajessonoros-d1-local-'));
const config=path.join(root,'tests/d1/wrangler.toml');
const name='viajessonoros-bookings-local-test';
function run(args,allowFailure=false){
 const r=spawnSync('npx',['--yes','wrangler@4','d1','execute',name,'--local','--config',config,'--persist-to',dir,...args],{
  cwd:root,encoding:'utf8',timeout:120000,env:{...process.env,CI:'true'}
 });
 if(r.error||(!allowFailure&&r.status!==0))throw Error('D1 local: '+(r.stderr||r.stdout||r.error));
 return r;
}
function execSQL(sql,allowFailure=false){
 const file=path.join(dir,'statement.sql');writeFileSync(file,sql);
 return run(['--file',file],allowFailure);
}
try{
 for(const migration of ['0001_reservations.sql','0002_capacity_guards.sql'])
  run(['--file',path.join(root,'migrations/d1',migration)]);
 execSQL("INSERT INTO reservation_events(experience_id,capacity,minimum_attendees) VALUES ('synthetic',1,1);");
 execSQL("INSERT INTO reservations(id,experience_id,contact_hash,seats,status) VALUES ('first','synthetic','hash-first',1,'confirmed');");
 execSQL("INSERT INTO reservations(id,experience_id,contact_hash,seats,status) VALUES ('second','synthetic','hash-second',1,'pending');");
 const over=execSQL("UPDATE reservations SET status='confirmed' WHERE id='second';",true);
 if(over.status===0)throw Error('D1 local ha permitido sobreaforo');
 if(!String(over.stderr+' '+over.stdout).includes('RESERVATION_CAPACITY_EXCEEDED'))
  throw Error('D1 local falló por otra razón: '+over.stderr);
 const result=execSQL("SELECT COUNT(*) AS count FROM reservations WHERE status='confirmed';");
 if(!/\b1\b/.test(result.stdout))throw Error('No se ha verificado el total confirmado');
 console.log('PASS: Cloudflare D1 local migrations and capacity guard');
}finally{
 rmSync(dir,{recursive:true,force:true});
}
