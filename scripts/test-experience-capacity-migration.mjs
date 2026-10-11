import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261011_experiencias_aforo_propuesta.sql',import.meta.url),'utf8');
assert.match(sql,/ALTER TABLE public\.experiencias/);
assert.match(sql,/ADD COLUMN IF NOT EXISTS aforo integer/);
assert.match(sql,/ADD COLUMN IF NOT EXISTS aforo_minimo integer/);
assert.match(sql,/aforo_minimo <= aforo/);
assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM|TRUNCATE|UPDATE public\.experiencias/i);
console.log('PASS: per-experience capacity migration is additive and keeps existing values');