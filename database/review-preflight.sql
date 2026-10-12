-- Read-only review queries. Run only after reviewing the target project manually.
-- No migrations, seed resets, Auth user creation, or orders are executed here.
select version() as postgres_version;
select n.nspname as schema_name,c.relname as table_name,c.relrowsecurity as rls_enabled
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('qa_demo','public') and c.relkind='r'
and (n.nspname='qa_demo' or c.relname in ('qa_demo_profiles','qa_demo_addresses'))
order by n.nspname,c.relname;
select n.nspname,p.proname,pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
 p.prosecdef as security_definer,p.proconfig as function_settings,p.proacl as privileges,
 pg_catalog.pg_get_functiondef(p.oid) as definition
from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in (
 'qa_demo_place_order','qa_demo_analytics','qa_demo_place_authenticated_order',
 'qa_demo_my_orders','qa_demo_analytics_account','qa_demo_valid_address') order by p.proname;
select grantee,table_schema,table_name,privilege_type
from information_schema.role_table_grants
where table_schema='qa_demo' or table_name in ('qa_demo_profiles','qa_demo_addresses')
order by table_schema,table_name,grantee;
select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_catalog.pg_policies where schemaname='qa_demo'
or tablename in ('qa_demo_profiles','qa_demo_addresses');
select n.nspname,c.relname,a.attname,pg_catalog.format_type(a.atttypid,a.atttypmod) as column_type
from pg_catalog.pg_attribute a join pg_catalog.pg_class c on c.oid=a.attrelid
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='qa_demo' and a.attnum>0 and not a.attisdropped order by c.relname,a.attnum;
-- Inspect the returned definitions/columns before adapting a SELECT for catalog keys,
-- availability and integer-cent prices. This repository has no production baseline.
-- Expected current browser catalog: Atlas79900 + RAM32:10000 + SSD1024:6050;
-- Horizon109950 + RAM32:12025; Pulse13995 minus wired:2000;
-- Wave4990; Studio6900 unavailable; Precision3999. Shipping300/650.
-- Do not assume the isolated harness's catalog table name exists in production.
