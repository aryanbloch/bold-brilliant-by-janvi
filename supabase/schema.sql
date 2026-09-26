-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query) after creating
-- your project. Sets up the orders and profiles tables and locks them down so customers only
-- ever see their own data. Safe to run again: existing tables and policies are kept.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_name text not null,
  amount numeric not null,
  customer_name text not null,
  phone text not null,
  address text not null,
  razorpay_payment_id text not null,
  razorpay_order_id text not null,
  status text not null default 'Order placed',
  tracking_number text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);

alter table public.orders enable row level security;

drop policy if exists "Customers can view their own orders" on public.orders;
create policy "Customers can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Customers can insert their own orders" on public.orders;
create policy "Customers can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

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
  address_type text not null default 'Home',
  billing_same boolean not null default true,
  billing_name text,
  billing_address text,
  gstin text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Customers can view their own profile" on public.profiles;
create policy "Customers can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Customers can create their own profile" on public.profiles;
create policy "Customers can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Customers can update their own profile" on public.profiles;
create policy "Customers can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Studio owner: to update order status/tracking number or view customer details, open
-- Table Editor -> orders / profiles in the Supabase dashboard (the project owner bypasses RLS).
