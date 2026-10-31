import test from 'node:test';import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';
import {fixture,as,booking,ADMIN,OTHER} from './booking-fixture.mjs';
const up=await readFile(new URL('../supabase/migrations/20261031132847_booking_permissions_capacity.sql',import.meta.url),'utf8');
async function setup(){const db=await fixture();await db.exec("update public.experiencias set precio='30 €' where id=101");return db;}
test('INSERT mínimo público y autenticado; sin lectura personal ni administración ajena',async()=>{
 const db=await setup();console.log("fixture ready");try{await db.exec(up);console.log("migration ready");
  for(const [role,user] of [['anon',''],['authenticated',OTHER]]){
   await as(db,role,user,booking(1));
   await assert.rejects(as(db,role,user,booking(1,102)),/row-level security/);
   if(role==='anon')await assert.rejects(as(db,role,user,'select * from public.reservas_whatsapp'),/permission denied/);
   else assert.equal((await as(db,role,user,'select * from public.reservas_whatsapp')).rows.length,0);
   await assert.rejects(as(db,role,user,"insert into public.reservas_whatsapp(experiencia_id,nombre,telefono,plazas,estado) values(101,'Sintética','600000000',1,'confirmada')"));
  }
  await assert.rejects(as(db,'anon','',"update public.reservas_whatsapp set plazas=9"),/permission denied/);
  assert.equal((await as(db,'authenticated',OTHER,'delete from public.reservas_whatsapp returning id')).rows.length,0);
  assert.equal((await as(db,'authenticated',ADMIN,'select * from public.reservas_whatsapp')).rows.length,2);
  const prices=(await db.query('select precio_unitario,importe_total from public.reservas_whatsapp')).rows;
  assert.ok(prices.every(x=>Number(x.precio_unitario)===30&&Number(x.importe_total)===30));
  await as(db,'anon','',"insert into public.reservas_whatsapp(experiencia_id,nombre,telefono,plazas,precio_unitario,importe_total) values(101,'Sintética','600000001',1,0,0)");
  assert.equal(Number((await db.query("select importe_total from public.reservas_whatsapp where telefono='600000001'")).rows[0].importe_total),30);
  await db.exec("create policy future_open on public.reservas_whatsapp for all to authenticated using(true) with check(true)");
  assert.equal((await as(db,'authenticated',OTHER,'select * from public.reservas_whatsapp')).rows.length,0);
  assert.equal((await as(db,'authenticated',OTHER,'update public.reservas_whatsapp set plazas=4 returning id')).rows.length,0);
 }finally{await db.close();}
});
test('aforo uniforme: pendientes/confirmadas; cancelaciones, reactivación y cambios de plazas',async()=>{
 const db=await setup();console.log("fixture ready");try{await db.exec(up);console.log("migration ready");
  await as(db,'anon','',booking(3));await as(db,'authenticated',ADMIN,booking(2));
  await assert.rejects(as(db,'anon','',booking(1)),/No quedan suficientes plazas/);
  await assert.rejects(as(db,'authenticated',ADMIN,'update public.experiencias set aforo_maximo=4 where id=101'),/inferior a plazas/);
  await as(db,'authenticated',ADMIN,"update public.reservas_whatsapp set estado='confirmada' where plazas=3");
  await assert.rejects(as(db,'authenticated',ADMIN,'update public.reservas_whatsapp set plazas=4 where plazas=3'),/No quedan suficientes plazas/);
  await as(db,'authenticated',ADMIN,"update public.reservas_whatsapp set estado='cancelada' where plazas=2");
  await as(db,'anon','',booking(2));
  await assert.rejects(as(db,'authenticated',ADMIN,"update public.reservas_whatsapp set estado='pendiente' where estado='cancelada'"),/No quedan suficientes plazas/);
  await as(db,'authenticated',ADMIN,"update public.reservas_whatsapp set estado='aplazada' where estado='confirmada'");
  await as(db,'authenticated',ADMIN,'update public.experiencias set aforo_maximo=2 where id=101');
  await assert.rejects(as(db,'authenticated',ADMIN,'update public.reservas_whatsapp set experiencia_id=102'),/No se permite cambiar/);
  await db.exec('begin isolation level repeatable read');
  await assert.rejects(db.exec(booking(1)),/READ COMMITTED/);await db.exec('rollback');
 }finally{await db.close();}
});
test('COMMIT y reversión selectiva: filas conservadas y catálogos restaurados',async()=>{
 const db=await setup();try{
  const meta=JSON.parse(await readFile(new URL('./fixtures/booking-catalog.json',import.meta.url),'utf8'));
  const policySQL=p=>`create policy ${p.policyname} on public.reservas_whatsapp for ${p.cmd} to ${p.roles.join(',')}${p.qual?' using ('+p.qual+')':''}${p.with_check?' with check ('+p.with_check+')':''};`;
  const names=['anon_insert_published_reservation','booking_admin_select','booking_admin_insert','booking_admin_update','booking_admin_delete','booking_read_guard','booking_insert_guard','booking_authenticated_insert_guard','booking_update_guard','booking_delete_guard'];
  const down=`-- SOLO TEST: restaura permisos previos conocidos; no aplicar en producción a ciegas.\nbegin;\n${names.map(n=>`drop policy if exists ${n} on public.reservas_whatsapp;`).join('\n')}\n${meta.booking_policies.map(policySQL).join('\n')}\nrevoke all on public.reservas_whatsapp from public,anon,authenticated;\nrevoke insert(experiencia_id,nombre,telefono,plazas,precio_unitario,importe_total) on public.reservas_whatsapp from anon;\ngrant select,insert,update,delete on public.reservas_whatsapp to authenticated;\n${meta.triggers.map(t=>`drop trigger if exists ${t.trigger.match(/CREATE TRIGGER (\S+)/)[1]} on public.${t.table};`).join('\n')}\n${meta.triggers.map(t=>t.function+';'+t.trigger+';').join('\n')}\ndrop function vs_internal.guard_experience_capacity();\ncommit;`;
  const before=(await db.query("select policyname,qual,with_check from pg_policies where tablename='reservas_whatsapp' order by policyname")).rows;
  await db.exec(up);await as(db,'anon','',booking(1));
  const rows=(await db.query('select * from public.reservas_whatsapp')).rows;
  await db.exec(down);
  assert.deepEqual((await db.query('select * from public.reservas_whatsapp')).rows,rows);
  assert.deepEqual((await db.query("select policyname,qual,with_check from pg_policies where tablename='reservas_whatsapp' order by policyname")).rows,before);
  await assert.rejects(as(db,'anon','',booking(1)),/permission denied/);
  assert.equal((await db.query("select has_column_privilege('anon','public.reservas_whatsapp','nombre','INSERT') as allowed")).rows[0].allowed,false);
  await writeFile(new URL('../supabase/booking.rollback-test.sql',import.meta.url),down);
 }finally{await db.close();}
});
