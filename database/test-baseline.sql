-- Disposable PGlite compatibility harness only; not an actual production baseline.
-- Never apply this file to Supabase: it creates synthetic roles/users/catalog/seed rows.
create role anon;
create role authenticated;
create schema auth;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create schema qa_demo;
create table qa_demo.catalog(variant_key text primary key,unit_price_cents integer not null,available boolean not null);
create table qa_demo.customers(id uuid primary key,email text not null);
create table qa_demo.orders(
 id uuid primary key,customer_id uuid references qa_demo.customers(id),created_at timestamptz not null default now(),
 currency text not null default 'EUR',subtotal_cents integer not null,shipping_cents integer not null,
 total_cents integer not null,source text not null check(source in ('seed','observed')),
 check(total_cents=subtotal_cents+shipping_cents)
);
create table qa_demo.order_items(
 order_id uuid references qa_demo.orders(id),line_no integer,variant_key text,
 quantity integer not null check(quantity between 1 and 10),unit_price_cents integer not null,
 primary key(order_id,line_no)
);
insert into qa_demo.catalog(variant_key,unit_price_cents,available) values
('1-red-16-512',79900,true),
('1-red-16-1024',85950,true),
('1-red-32-512',89900,true),
('1-red-32-1024',95950,false),
('1-purple-16-512',79900,true),
('1-purple-16-1024',85950,true),
('1-purple-32-512',89900,true),
('1-purple-32-1024',95950,true),
('1-black-16-512',79900,true),
('1-black-16-1024',85950,true),
('1-black-32-512',89900,true),
('1-black-32-1024',95950,true),
('2-red-16',109950,true),
('2-red-32',121975,true),
('2-purple-16',109950,true),
('2-purple-32',121975,true),
('2-black-16',109950,true),
('2-black-32',121975,false),
('3-red-wireless',13995,true),
('3-red-wired',11995,true),
('3-purple-wireless',13995,true),
('3-purple-wired',11995,false),
('3-black-wireless',13995,true),
('3-black-wired',11995,true),
('4',4990,true),
('5',6900,false),
('6',3999,true);
-- Deliberately pre-existing seed and guest observed orders test additive preservation.
insert into qa_demo.customers values('00000000-0000-4000-8000-000000000001','historical@example.test');
insert into qa_demo.orders(id,customer_id,subtotal_cents,shipping_cents,total_cents,source) values
 ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001',3999,300,4299,'seed'),
 ('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000001',4990,300,5290,'observed');
create function public.qa_demo_place_order(p_id uuid,p_contact jsonb,p_items jsonb,p_shipping text default 'standard')
returns jsonb language plpgsql security definer set search_path='' as $$
declare line jsonb; subtotal integer:=0; shipping integer; unit_price integer; available boolean;
 customer uuid; index integer:=0; keys text[]:='{}';
begin
 if p_id is null or p_items is null or jsonb_typeof(p_items)<>'array'
 or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Invalid items' using errcode='22023'; end if;
 if p_shipping not in ('standard','express') or p_shipping is null then raise exception 'Invalid shipping' using errcode='22023'; end if;
 shipping:=case p_shipping when 'express' then 650 else 300 end;
 for line in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(line)<>'object' or jsonb_typeof(line->'variant_key') is distinct from 'string'
  or jsonb_typeof(line->'quantity') is distinct from 'number'
  or (line->>'quantity') !~ '^[0-9]+$' or (line->>'quantity')::integer not between 1 and 10 then
   raise exception 'Invalid quantity' using errcode='22023';
  end if;
  if line->>'variant_key'=any(keys) then raise exception 'Duplicate line' using errcode='22023'; end if;
  keys:=array_append(keys,line->>'variant_key');
  select c.unit_price_cents,c.available into unit_price,available from qa_demo.catalog c where variant_key=line->>'variant_key';
  if not found or not available then raise exception 'Variant unavailable' using errcode='22023'; end if;
  subtotal:=subtotal+unit_price*(line->>'quantity')::integer;
 end loop;
 customer:=md5(lower(p_contact->>'email'))::uuid;
 insert into qa_demo.customers values(customer,p_contact->>'email') on conflict(id) do nothing;
 insert into qa_demo.orders(id,customer_id,subtotal_cents,shipping_cents,total_cents,source)
 values(p_id,customer,subtotal,shipping,subtotal+shipping,'observed');
 for line in select value from jsonb_array_elements(p_items) loop
  index:=index+1;
  select c.unit_price_cents into unit_price from qa_demo.catalog c where variant_key=line->>'variant_key';
  insert into qa_demo.order_items values(p_id,index,line->>'variant_key',(line->>'quantity')::integer,unit_price);
 end loop;
 return jsonb_build_object('order_id',p_id,'currency','EUR','subtotal_cents',subtotal,'shipping_cents',shipping,'total_cents',subtotal+shipping);
end; $$;
-- Model the legacy anonymous compatibility surface so migration revocation is tested.
grant execute on function public.qa_demo_place_order(uuid,jsonb,jsonb,text) to anon,authenticated;
create function public.qa_demo_analytics(p_days integer default 30,p_source text default 'all')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if p_days is null or p_days not between 1 and 365 or p_source not in ('seed','observed','all') then
  raise exception 'Invalid analytics filter' using errcode='22023';
 end if;
 select jsonb_build_object('source',p_source,'summary',jsonb_build_object('orders',count(*),'total_cents',coalesce(sum(total_cents),0)))
 into result from qa_demo.orders where created_at>=now()-make_interval(days=>p_days) and (p_source='all' or source=p_source);
 return result;
end; $$;
grant execute on function public.qa_demo_analytics(integer,text) to anon,authenticated;
