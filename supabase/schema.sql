-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query) after creating
-- your project. Sets up the orders table and locks it down so customers only ever see their own orders.

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

create policy "Customers can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Customers can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Studio owner: to update order status/tracking number from the Supabase dashboard,
-- open Table Editor -> orders and edit rows directly (bypasses RLS as the project owner).
