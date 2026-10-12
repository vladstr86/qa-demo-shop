-- Review-only additive migration adapted from the supplied reference.
-- Requires the existing qa_demo tables and legacy pricing/analytics RPCs.
-- Do not run the isolated test-baseline.sql or reset/seed an existing project.
begin;
do $$ begin
 if to_regclass('qa_demo.orders') is null or to_regclass('qa_demo.order_items') is null
 or to_regprocedure('public.qa_demo_place_order(uuid,jsonb,jsonb,text)') is null
 or to_regprocedure('public.qa_demo_analytics(integer,text)') is null then
  raise exception 'Existing order/catalog/analytics baseline is required; inspect review-preflight.sql before migration';
 end if;
 if not (select prosecdef from pg_catalog.pg_proc where oid=to_regprocedure('public.qa_demo_analytics(integer,text)')) then
  raise exception 'Review analytics RPC permissions: its existing implementation must safely aggregate private tables';
 end if;
end $$;

create or replace function public.qa_demo_valid_address(value text)
returns boolean language plpgsql immutable set search_path='' as $$
declare address jsonb;
begin
 if value is null or length(value) not between 5 and 500 then return false; end if;
 begin address:=value::jsonb; exception when others then return false; end;
 if jsonb_typeof(address)<>'object' then return false; end if;
 return coalesce((select count(*) from pg_catalog.jsonb_object_keys(address))=5
 and jsonb_typeof(address->'street')='string'
 and jsonb_typeof(address->'houseNumber')='string'
 and jsonb_typeof(address->'city')='string'
 and jsonb_typeof(address->'postalCode')='string'
 and jsonb_typeof(address->'country')='string'
 and length(btrim(address->>'street',E' \t\n\r\f\013')) between 2 and 120
 and length(btrim(address->>'houseNumber',E' \t\n\r\f\013')) between 1 and 20
 and length(btrim(address->>'city',E' \t\n\r\f\013')) between 2 and 80
 and length(btrim(address->>'postalCode',E' \t\n\r\f\013')) between 2 and 20
 and address->>'country' ~ '^[A-Z]{2}$',false);
end; $$;
revoke all on function public.qa_demo_valid_address(text) from public,anon,authenticated;
grant execute on function public.qa_demo_valid_address(text) to authenticated;
create table if not exists public.qa_demo_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(length(btrim(full_name,E' \t\n\r\f\013')) between 2 and 120),
 phone text not null check(length(btrim(phone)) between 7 and 40 and regexp_replace(phone,'[[:space:]().-]','','g') ~ '^[+]?[0-9]{7,15}$'),
 updated_at timestamptz not null default now()
);
create table if not exists public.qa_demo_addresses (
 user_id uuid primary key references auth.users(id) on delete cascade,
 shipping_address text not null constraint qa_demo_shipping_address_canonical check(public.qa_demo_valid_address(shipping_address)),
 billing_address text not null constraint qa_demo_billing_address_canonical check(public.qa_demo_valid_address(billing_address)),
 updated_at timestamptz not null default now()
);
-- Preserve any older stored addresses while enforcing structured addresses on new writes.
do $$ begin
 if not exists(select 1 from pg_catalog.pg_constraint where conname='qa_demo_shipping_address_canonical' and conrelid='public.qa_demo_addresses'::regclass) then
  alter table public.qa_demo_addresses add constraint qa_demo_shipping_address_canonical check(public.qa_demo_valid_address(shipping_address)) not valid;
 end if;
 if not exists(select 1 from pg_catalog.pg_constraint where conname='qa_demo_billing_address_canonical' and conrelid='public.qa_demo_addresses'::regclass) then
  alter table public.qa_demo_addresses add constraint qa_demo_billing_address_canonical check(public.qa_demo_valid_address(billing_address)) not valid;
 end if;
end $$;
alter table public.qa_demo_profiles enable row level security;
alter table public.qa_demo_addresses enable row level security;
revoke all on public.qa_demo_profiles, public.qa_demo_addresses from public, anon, authenticated;
grant select, insert, update, delete on public.qa_demo_profiles, public.qa_demo_addresses to authenticated;
drop policy if exists qa_demo_profile_owner on public.qa_demo_profiles;
create policy qa_demo_profile_owner on public.qa_demo_profiles for all to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists qa_demo_address_owner on public.qa_demo_addresses;
create policy qa_demo_address_owner on public.qa_demo_addresses for all to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
alter table qa_demo.orders add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table qa_demo.orders add column if not exists contact_snapshot jsonb;
alter table qa_demo.orders add column if not exists authenticated_request_fingerprint text;
create index if not exists qa_demo_order_owner on qa_demo.orders(auth_user_id,created_at desc);
-- Private order/customer tables are accessed only through constrained RPCs.
revoke all on schema qa_demo from public,anon,authenticated;
revoke all on all tables in schema qa_demo from public,anon,authenticated;

-- Legacy validator remains callable internally by the owner of this SECURITY DEFINER wrapper.
-- Neither anon nor authenticated may bypass owner binding using the legacy RPC.
revoke all on function public.qa_demo_place_order(uuid,jsonb,jsonb,text) from public, anon, authenticated;
create or replace function public.qa_demo_place_authenticated_order(
 p_request_id uuid, p_contact jsonb, p_items jsonb, p_shipping text default 'standard'
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 owner_id uuid := auth.uid(); account_email text; contact jsonb; request_hash text;
 existing qa_demo.orders%rowtype; result jsonb; customer_name text; phone text;
 shipping_address text; billing_address text; updated_rows integer;
begin
 if owner_id is null then raise exception 'Sign in before placing an order' using errcode='42501'; end if;
 if p_request_id is null or p_contact is null or jsonb_typeof(p_contact)<>'object'
 or jsonb_typeof(p_contact->'name') is distinct from 'string'
 or jsonb_typeof(p_contact->'phone') is distinct from 'string'
 or jsonb_typeof(p_contact->'shipping_address') is distinct from 'string'
 or (p_contact ? 'billing_address' and jsonb_typeof(p_contact->'billing_address') is distinct from 'string') then
  raise exception 'Request ID and contact object required' using errcode='22023';
 end if;
 select email into account_email from auth.users where id=owner_id;
 if account_email is null then raise exception 'Account email unavailable' using errcode='42501'; end if;
 customer_name:=btrim(p_contact->>'name',E' \t\n\r\f\013'); phone:=regexp_replace(btrim(p_contact->>'phone'),'[[:space:]().-]','','g');
 shipping_address:=btrim(p_contact->>'shipping_address');
 billing_address:=coalesce(nullif(btrim(p_contact->>'billing_address'),''),shipping_address);
 if coalesce(length(customer_name),0) not between 2 and 120 or coalesce(length(phone),0) not between 7 and 16 or phone !~ '^[+]?[0-9]{7,15}$'
 or not public.qa_demo_valid_address(shipping_address) or not public.qa_demo_valid_address(billing_address) then
  raise exception 'Invalid contact or address' using errcode='22023';
 end if;
 -- Email and owner always come from Auth; browser-provided owner/email/price values are ignored.
 contact:=jsonb_build_object('name',customer_name,'email',account_email,'phone',phone,
  'shipping_address',shipping_address,'billing_address',billing_address);
 request_hash:=md5(jsonb_build_object('owner',owner_id,'contact',contact,'items',p_items,'shipping',p_shipping)::text);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_request_id::text));
 select * into existing from qa_demo.orders where id=p_request_id;
 if found then
  if existing.auth_user_id is distinct from owner_id or existing.authenticated_request_fingerprint is distinct from request_hash then
   raise exception 'Request ID already used with different data' using errcode='22023';
  end if;
  return jsonb_build_object('order_id',existing.id,'subtotal_cents',existing.subtotal_cents,
   'shipping_cents',existing.shipping_cents,'total_cents',existing.total_cents,'currency',existing.currency);
 end if;
 -- Existing SQL validates stock, variant, quantity, shipping and derives all prices in cents.
 result:=public.qa_demo_place_order(p_request_id,contact,p_items,p_shipping);
 if result is null or result->>'order_id' is distinct from p_request_id::text or result->>'currency' is distinct from 'EUR' then
  raise exception 'Legacy order validator returned an invalid confirmation' using errcode='22023';
 end if;
 update qa_demo.orders set auth_user_id=owner_id,contact_snapshot=contact,
  authenticated_request_fingerprint=request_hash where id=p_request_id;
 get diagnostics updated_rows=row_count;
 if updated_rows<>1 then raise exception 'Order ownership could not be saved' using errcode='22023'; end if;
 return result;
end; $$;
revoke all on function public.qa_demo_place_authenticated_order(uuid,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.qa_demo_place_authenticated_order(uuid,jsonb,jsonb,text) to authenticated;

create or replace function public.qa_demo_my_orders(p_limit integer default 25)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare owner_id uuid:=auth.uid(); result jsonb;
begin
 if owner_id is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'Invalid limit' using errcode='22023'; end if;
 select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at desc),'[]'::jsonb) into result from (
  select id,created_at,currency,subtotal_cents,shipping_cents,total_cents,contact_snapshot,
   (select coalesce(jsonb_agg(jsonb_build_object('variant_key',i.variant_key,'quantity',i.quantity,
    'unit_price_cents',i.unit_price_cents) order by i.line_no),'[]'::jsonb) from qa_demo.order_items i where i.order_id=q.id) as items
  from qa_demo.orders q where auth_user_id=owner_id order by created_at desc limit p_limit
 ) o;
 return result;
end; $$;
revoke all on function public.qa_demo_my_orders(integer) from public,anon,authenticated;
grant execute on function public.qa_demo_my_orders(integer) to authenticated;

-- Existing analytics source is 'observed'. Alias 'live' without rewriting stored records.
create or replace function public.qa_demo_analytics_account(p_days integer default 30,p_source text default 'live')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if p_source is null or p_source not in ('seed','live','observed','all') then
  raise exception 'Invalid analytics source' using errcode='22023';
 end if;
 result:=public.qa_demo_analytics(p_days,case when p_source='live' then 'observed' else p_source end);
 return jsonb_set(result,'{source}',to_jsonb(p_source));
end; $$;
revoke all on function public.qa_demo_analytics_account(integer,text) from public,anon,authenticated;
grant execute on function public.qa_demo_analytics_account(integer,text) to anon,authenticated;
notify pgrst,'reload schema';
commit;
