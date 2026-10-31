// Pruebas estructurales únicamente. No ejecutan PostgreSQL ni sustituyen staging.
import test from 'node:test';import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';
const directory=new URL('../../supabase/migrations/',import.meta.url);
const filename=(await readdir(directory)).find(n=>n.endsWith('_admin_rpc_membership.sql'));
const sql=await readFile(new URL(filename,directory),'utf8');
const snapshots=JSON.parse(await readFile(new URL('./fixtures/admin-rpc-snapshots.json',import.meta.url),'utf8'));
const guard="if v_actor is null or not exists(select 1 from auth.users where id=v_actor and lower(email)='info@viajessonoros.es') then";
test('exactamente las cinco RPC revisadas, sin alterar sus operaciones',()=>{
 assert.equal(snapshots.length,5);
 const embedded=[...sql.matchAll(/\$vs_snapshot\$([\s\S]*?)\$vs_snapshot\$/g)].map(m=>m[1]);
 assert.deepEqual(embedded,snapshots.map(s=>s.definition));
 for(const f of snapshots){
  assert.equal(f.definition.split(guard).length-1,1);
  const proposed=f.definition.replace(guard,'if v_actor is null or vs_security.is_admin() is not true then');
  assert.equal(proposed.replace('if v_actor is null or vs_security.is_admin() is not true then',guard),f.definition);
  assert.match(proposed,/SECURITY DEFINER\n SET search_path TO ''/);
 }
});
test('falla ante deriva de definición, propietario inesperado o helper ausente',()=>{
 assert.match(sql,/candidate is distinct from item\.expected_definition/);
 assert.match(sql,/current_user <> 'postgres'/);
 assert.match(sql,/p\.prosecdef and pg_catalog\.pg_get_userbyid\(p\.proowner\)='postgres'/);
 assert.match(sql,/to_regprocedure\('vs_security\.is_admin\(\)'\) is null/);
 assert.match(sql,/target is null/);
});
test('transacción y EXECUTE mínimo sin ejecutar datos de negocio',()=>{
 const executable=sql.replace(/\$vs_snapshot\$[\s\S]*?\$vs_snapshot\$/g,"''").replace(/--[^\n]*/g,'');
 assert.match(executable,/begin;\s*set local search_path = pg_catalog;/);
 assert.match(executable,/commit;\s*$/);
 assert.match(executable,/execute pg_catalog\.replace\(candidate,old_guard,'if v_actor is null or vs_security\.is_admin\(\) is not true then'\)/);
 assert.match(executable,/revoke all on function %s from public, anon/);
 assert.match(executable,/grant execute on function %s to authenticated/);
 assert.doesNotMatch(executable,/\b(?:insert into|update public\.|delete from|truncate|drop table|alter table)\b/i);
});
