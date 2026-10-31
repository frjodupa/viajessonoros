-- Solo catálogo; ejecutar en pruebas tras la propuesta. Sin lecturas de filas de negocio.
select policyname, permissive, roles, cmd, qual, with_check
from pg_catalog.pg_policies where schemaname='public' and tablename='experiencias'
order by policyname;
select relrowsecurity, relforcerowsecurity from pg_catalog.pg_class
where oid='public.experiencias'::regclass;
select grantee,privilege_type,is_grantable from information_schema.role_table_grants
where table_schema='public' and table_name='experiencias' order by grantee,privilege_type;
select n.nspname,p.proname,p.prosecdef,p.proconfig,p.proacl,pg_catalog.pg_get_userbyid(p.proowner) as owner
from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where (n.nspname='public' and p.proname='is_vs_admin') or (n.nspname='vs_security' and p.proname='is_admin');
select pg_catalog.has_table_privilege('anon','public.experiencias','SELECT') as anon_select,
 pg_catalog.has_table_privilege('anon','public.experiencias','INSERT') as anon_insert,
 pg_catalog.has_table_privilege('authenticated','public.experiencias','TRUNCATE') as auth_truncate,
 pg_catalog.has_function_privilege('anon','public.is_vs_admin()','EXECUTE') as anon_execute;
