-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query). Sets up the orders
-- and profiles tables and locks them down so customers only ever see their own data.
-- Safe to run again: existing tables and data are kept.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_name text not null,
  amount numeric(10,2) not null check (amount >= 0),
  customer_name text not null,
  phone text not null,
  address text not null,
  razorpay_payment_id text not null,
  razorpay_order_id text not null,
  -- Must match ALLOWED_STATUSES in api/admin-orders.ts.
  status text not null default 'Order placed'
    check (status in ('Order placed','Processing','Shipped','Out for delivery','Delivered','Cancelled')),
  tracking_number text,
  created_at timestamptz not null default now()
);

-- Matches the "My Orders" query (own orders, newest first).
create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
-- One order per payment, so a retry can never create a duplicate order.
create unique index if not exists orders_razorpay_payment_id_key on public.orders (razorpay_payment_id);

alter table public.orders enable row level security;

drop policy if exists "Customers can view their own orders" on public.orders;
create policy "Customers can view their own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);

-- Orders are created only by the server after a verified payment (api/verify-payment.ts),
-- so customers are NOT allowed to insert orders themselves.
drop policy if exists "Customers can insert their own orders" on public.orders;

-- Customer profile: contact, delivery address and billing details (one row per customer).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text not null,
  alt_phone text,
  pincode text not null,
  address_line1 text not null,
  address_line2 text not null,
  landmark text,
  city text not null,
  state text not null,
  address_type text not null default 'Home' check (address_type in ('Home','Work')),
  billing_same boolean not null default true,
  billing_name text,
  billing_address text,
  gstin text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Customers can view their own profile" on public.profiles;
create policy "Customers can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Customers can create their own profile" on public.profiles;
create policy "Customers can create their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Customers can update their own profile" on public.profiles;
create policy "Customers can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Explicit permissions: signed-out visitors get nothing, customers can only read orders
-- and read/write their own profile. The server (service role) does everything else.
revoke all on public.orders, public.profiles from anon;
revoke all on public.orders from authenticated;
grant select on public.orders to authenticated;
revoke all on public.profiles from authenticated;
grant select, insert, update on public.profiles to authenticated;
grant all on public.orders, public.profiles to service_role;

-- Studio owner: manage orders from the /admin page, or open Table Editor -> orders / profiles
-- in the Supabase dashboard (the project owner bypasses RLS).
