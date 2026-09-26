-- Admin features schema. Run AFTER supabase/schema.sql. Already applied to the live project.
-- Safe to run again.
--
-- WHO CAN DO WHAT
-- - Website visitors: read active products, live banners, site settings/content, gallery, reviews;
--   submit a booking request.
-- - Signed-in customers: also read their own invoices and shipment tracking history.
-- - Admin panel: goes through /api/* with SUPABASE_SERVICE_ROLE_KEY (full access). coupons,
--   coupon_redemptions and invoice_template have NO public policies on purpose (server only).
--
-- TABLES
-- products           Shop Press Ons (name, price, image_url, stock, sold_out, is_active, sort_order)
-- coupons            code (UPPERCASE), percent|flat, max_discount, min_order_amount, usage limits, dates
-- coupon_redemptions one row per order that used a coupon; auto-updates coupons.used_count
-- promo_banners      coupon box on website: kind 'image' (image_url) or 'html' (html), placement
-- site_settings      single row (id=1): WhatsApp, Instagram, phone, email, address, hours, videos...
-- site_content       key/body pages: privacy_policy, terms, refund_policy, shipping_policy, about, hero
-- gallery_images, reviews
-- orders (+cols)     items, subtotal, discount, coupon_code, courier, dispatched_at, delivered_at,
--                    last_tracking_status/location/sync_at, admin_note, updated_at
-- shipment_events    cached courier scans per order (admin + customer see the same history)
-- invoice_template   single row: editable HTML with {{placeholders}} + invoice number prefix
-- invoices           auto-created for every new order (trigger), number like BB-2026-0001
-- bookings           appointment requests
--
-- STORAGE BUCKETS
-- site-media (public, images <= 5MB): product/banner/gallery images
-- invoices (private, PDF): store as "<user_id>/<invoice_number>.pdf" so customers can download own
--
-- INVOICE PLACEHOLDERS
-- {{brand}} {{address}} {{gstin}} {{invoice_number}} {{invoice_date}} {{order_id}} {{customer_name}}
-- {{phone}} {{customer_address}} {{items_rows}} {{subtotal}} {{coupon_code}} {{discount}} {{total}}
-- {{payment_id}}

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  image_url text,
  stock integer check (stock is null or stock >= 0),
  sold_out boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_active_sort_idx on public.products (is_active, sort_order);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and length(code) between 3 and 30),
  discount_type text not null check (discount_type in ('percent','flat')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  max_discount numeric(10,2) check (max_discount is null or max_discount > 0),
  min_order_amount numeric(10,2) not null default 0 check (min_order_amount >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_user_limit integer check (per_user_limit is null or per_user_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 100)
);
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  discount_amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists coupon_redemptions_coupon_user_idx on public.coupon_redemptions (coupon_id, user_id);

create or replace function public.bump_coupon_used_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.coupons set used_count = used_count + 1 where id = new.coupon_id;
  elsif tg_op = 'DELETE' then
    update public.coupons set used_count = greatest(used_count - 1, 0) where id = old.coupon_id;
  end if;
  return null;
end; $$;
revoke execute on function public.bump_coupon_used_count() from public, anon, authenticated;
drop trigger if exists coupon_redemptions_count on public.coupon_redemptions;
create trigger coupon_redemptions_count after insert or delete on public.coupon_redemptions
  for each row execute function public.bump_coupon_used_count();

create table if not exists public.promo_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('image','html')),
  image_url text,
  html text,
  link_url text,
  coupon_id uuid references public.coupons (id) on delete set null,
  placement text not null default 'shop' check (placement in ('top_bar','hero','shop','popup','checkout')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'image' and image_url is not null) or (kind = 'html' and html is not null))
);
create index if not exists promo_banners_active_idx on public.promo_banners (is_active, placement, sort_order);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  brand text not null,
  byline text,
  logo_url text,
  founder_photo_url text,
  whatsapp_number text,
  phone text,
  email text,
  instagram_user text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  maps_url text,
  address text,
  hours jsonb not null default '[]'::jsonb,
  delivery_note text,
  hero_video_url text,
  showcase_video_url text,
  poster_url text,
  gstin text,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  key text primary key check (key ~ '^[a-z0-9_\-]+$'),
  title text,
  body text not null default '',
  format text not null default 'markdown' check (format in ('markdown','html','text','json')),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists gallery_active_sort_idx on public.gallery_images (is_active, sort_order);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  photo_url text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists reviews_published_sort_idx on public.reviews (is_published, sort_order);

alter table public.orders
  add column if not exists items jsonb,
  add column if not exists subtotal numeric(10,2),
  add column if not exists discount numeric(10,2) not null default 0,
  add column if not exists coupon_code text,
  add column if not exists courier text check (courier is null or courier in ('Delhivery','Shiprocket')),
  add column if not exists dispatched_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists last_tracking_status text,
  add column if not exists last_tracking_location text,
  add column if not exists last_tracking_sync_at timestamptz,
  add column if not exists admin_note text,
  add column if not exists updated_at timestamptz not null default now();
create index if not exists orders_status_created_at_idx on public.orders (status, created_at desc);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create unique index if not exists orders_tracking_number_key on public.orders (tracking_number) where tracking_number is not null;

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  location text,
  event_time timestamptz,
  source text not null default 'courier' check (source in ('courier','admin')),
  created_at timestamptz not null default now(),
  unique (order_id, status, event_time)
);
create index if not exists shipment_events_order_idx on public.shipment_events (order_id, event_time desc);

create table if not exists public.invoice_template (
  id integer primary key default 1 check (id = 1),
  html text not null,
  prefix text not null default 'BB',
  updated_at timestamptz not null default now()
);
create sequence if not exists public.invoice_number_seq start 1;
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  invoice_number text not null unique,
  html_snapshot text,
  pdf_path text,
  created_at timestamptz not null default now()
);
create index if not exists invoices_user_idx on public.invoices (user_id, created_at desc);

create or replace function public.create_invoice_for_order() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pfx text;
begin
  select coalesce((select prefix from public.invoice_template where id = 1), 'BB') into pfx;
  insert into public.invoices (order_id, user_id, invoice_number)
  values (new.id, new.user_id,
    pfx || '-' || to_char(new.created_at at time zone 'Asia/Kolkata', 'YYYY') || '-' ||
    lpad(nextval('public.invoice_number_seq')::text, 4, '0'))
  on conflict (order_id) do nothing;
  return null;
end; $$;
revoke execute on function public.create_invoice_for_order() from public, anon, authenticated;
drop trigger if exists orders_create_invoice on public.orders;
create trigger orders_create_invoice after insert on public.orders
  for each row execute function public.create_invoice_for_order();

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 80),
  phone text not null check (phone ~ '^\+?[0-9\s-]{10,15}$'),
  preferred_date date not null,
  preferred_time time not null,
  service text not null check (length(service) <= 60),
  message text check (message is null or length(message) <= 500),
  status text not null default 'New' check (status in ('New','Confirmed','Completed','Cancelled')),
  admin_note text,
  created_at timestamptz not null default now()
);
create index if not exists bookings_status_date_idx on public.bookings (status, preferred_date);

do $$ declare t text; begin
  foreach t in array array['products','coupons','promo_banners','site_settings','site_content','orders','invoice_template'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop; end $$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

alter table public.products enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.promo_banners enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_content enable row level security;
alter table public.gallery_images enable row level security;
alter table public.reviews enable row level security;
alter table public.shipment_events enable row level security;
alter table public.invoice_template enable row level security;
alter table public.invoices enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products for select to anon, authenticated using (is_active);
drop policy if exists "Public can view live banners" on public.promo_banners;
create policy "Public can view live banners" on public.promo_banners for select to anon, authenticated
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
drop policy if exists "Public can view site settings" on public.site_settings;
create policy "Public can view site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Public can view site content" on public.site_content;
create policy "Public can view site content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "Public can view gallery" on public.gallery_images;
create policy "Public can view gallery" on public.gallery_images for select to anon, authenticated using (is_active);
drop policy if exists "Public can view published reviews" on public.reviews;
create policy "Public can view published reviews" on public.reviews for select to anon, authenticated using (is_published);

drop policy if exists "Customers can view own shipment events" on public.shipment_events;
create policy "Customers can view own shipment events" on public.shipment_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
drop policy if exists "Customers can view own invoices" on public.invoices;
create policy "Customers can view own invoices" on public.invoices for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Anyone can request a booking" on public.bookings;
create policy "Anyone can request a booking" on public.bookings for insert to anon, authenticated
  with check (status = 'New' and admin_note is null and preferred_date >= current_date);

revoke all on public.products, public.coupons, public.coupon_redemptions, public.promo_banners,
  public.site_settings, public.site_content, public.gallery_images, public.reviews,
  public.shipment_events, public.invoice_template, public.invoices, public.bookings from anon, authenticated;
grant select on public.products, public.promo_banners, public.site_settings, public.site_content,
  public.gallery_images, public.reviews to anon, authenticated;
grant select on public.shipment_events, public.invoices to authenticated;
grant insert (name, phone, preferred_date, preferred_time, service, message) on public.bookings to anon, authenticated;
grant all on public.products, public.coupons, public.coupon_redemptions, public.promo_banners,
  public.site_settings, public.site_content, public.gallery_images, public.reviews,
  public.shipment_events, public.invoice_template, public.invoices, public.bookings to service_role;
grant usage on sequence public.invoice_number_seq to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('site-media', 'site-media', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('invoices', 'invoices', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
drop policy if exists "Public can view site media" on storage.objects;
create policy "Public can view site media" on storage.objects for select to anon, authenticated using (bucket_id = 'site-media');
drop policy if exists "Customers can download own invoices" on storage.objects;
create policy "Customers can download own invoices" on storage.objects for select to authenticated
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Seed: current website data (from src/lib/catalog.ts, coupons.ts, site-config.ts)
insert into public.products (name, price, image_url, sort_order) values
  ('Nude Glaze Set', 599, 'https://images.unsplash.com/photo-1610992015762-45dca7fa3a85?fm=webp&q=70&fit=crop&w=500&h=625', 1),
  ('Classic French Set', 649, 'https://images.unsplash.com/photo-1727199433231-346fd8101839?fm=webp&q=70&fit=crop&w=500&h=625', 2),
  ('Pearl Bloom Set', 799, 'https://images.unsplash.com/photo-1630843599725-32ead7671867?fm=webp&q=70&fit=crop&w=500&h=625', 3),
  ('Gold Chrome Set', 899, 'https://images.unsplash.com/photo-1758605456817-5febca1dfeb0?fm=webp&q=70&fit=crop&w=500&h=625', 4),
  ('Rosy Minimal Set', 549, 'https://images.unsplash.com/photo-1612887390768-fb02affea7a6?fm=webp&q=70&fit=crop&w=500&h=625', 5),
  ('Sparkle Stiletto Set', 999, 'https://images.unsplash.com/photo-1758605456822-24b5311e100c?fm=webp&q=70&fit=crop&w=500&h=625', 6)
on conflict (name) do nothing;

insert into public.coupons (code, discount_type, discount_value) values
  ('WELCOME10', 'percent', 10), ('BB15', 'percent', 15)
on conflict (code) do nothing;

insert into public.site_settings (id, brand, byline, logo_url, founder_photo_url, whatsapp_number, instagram_user, instagram_url,
  maps_url, address, hours, delivery_note, hero_video_url, showcase_video_url, poster_url) values
  (1, 'Bold & Brilliant', 'by Janvi Sarang', '/logo.jpg', 'https://hercules-cdn.com/file_Do0YX4VPKpj36aoO4e7QA7gl',
   null, 'bold__and__brilliant', 'https://www.instagram.com/bold__and__brilliant',
   'https://maps.app.goo.gl/jpdYwRzNMrp4Sxzm8', 'Astha Chowk, Railnagar, Rajkot - 360001',
   '[{"day":"Mon - Sat","time":"10:00 AM - 8:00 PM"},{"day":"Sunday","time":"By appointment"}]'::jsonb,
   'Free delivery all over India', '/videos/nail-video-1.mp4', '/videos/nail-video-2.mp4',
   'https://images.unsplash.com/photo-1604902396830-aca29e19b067?fm=webp&q=60&w=800')
on conflict (id) do nothing;

insert into public.site_content (key, title, body) values
  ('privacy_policy', 'Privacy Policy', ''),
  ('terms', 'Terms & Conditions', ''),
  ('refund_policy', 'Refund & Return Policy', ''),
  ('shipping_policy', 'Shipping Policy', ''),
  ('about', 'About', ''),
  ('hero', 'Hero', '')
on conflict (key) do nothing;

insert into public.invoice_template (id, html, prefix) values (1,
'<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:24px;color:#222">
  <h1 style="color:#a8285a;margin:0">{{brand}}</h1>
  <p style="margin:4px 0">{{address}}<br>GSTIN: {{gstin}}</p>
  <hr>
  <h2>Tax Invoice</h2>
  <p>Invoice No: <b>{{invoice_number}}</b><br>Date: {{invoice_date}}<br>Order ID: {{order_id}}</p>
  <p><b>Bill To:</b><br>{{customer_name}}<br>{{phone}}<br>{{customer_address}}</p>
  <table style="width:100%;border-collapse:collapse" border="1" cellpadding="8">
    <tr><th align="left">Item</th><th>Qty</th><th align="right">Price</th><th align="right">Total</th></tr>
    {{items_rows}}
  </table>
  <p style="text-align:right">Subtotal: ₹{{subtotal}}<br>Discount ({{coupon_code}}): -₹{{discount}}<br><b>Total Paid: ₹{{total}}</b></p>
  <p>Payment ID: {{payment_id}}</p>
  <p style="text-align:center;color:#888">Thank you for shopping with {{brand}}!</p>
</div>', 'BB')
on conflict (id) do nothing;
