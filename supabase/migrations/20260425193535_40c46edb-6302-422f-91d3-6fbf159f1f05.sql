
-- ============ ROLES ============
create type public.app_role as enum ('owner', 'staff', 'chef');

create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');

create type public.order_status as enum ('pending', 'accepted', 'preparing', 'completed', 'cancelled');

-- ============ RESTAURANTS (tenants) ============
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  address text,
  phone text,
  email text,
  opening_hours text,
  theme_color text default '#c4654a',
  subscription_status public.subscription_status not null default 'trialing',
  subscription_plan text default 'trial',
  subscription_renews_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.restaurants(owner_id);

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ============ USER ROLES (per restaurant) ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id, role)
);
create index on public.user_roles(user_id);
create index on public.user_roles(restaurant_id);

-- Security definer helpers
create or replace function public.has_role(_user_id uuid, _restaurant_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and restaurant_id = _restaurant_id and role = _role
  )
$$;

create or replace function public.is_member(_user_id uuid, _restaurant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and restaurant_id = _restaurant_id
  )
$$;

-- ============ TABLES ============
create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index on public.restaurant_tables(restaurant_id);

-- ============ MENU ============
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.menu_categories(restaurant_id);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  allergens text[] default '{}',
  variants jsonb default '[]'::jsonb,
  addons jsonb default '[]'::jsonb,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.menu_items(restaurant_id);
create index on public.menu_items(category_id);

-- ============ ORDERS ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  status public.order_status not null default 'pending',
  notes text,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders(restaurant_id, status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  variant text,
  addons jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);
create index on public.order_items(order_id);

-- ============ AUTO PROFILE + OWNER ROLE on signup ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_restaurants_updated before update on public.restaurants for each row execute function public.touch_updated_at();
create trigger trg_menu_items_updated before update on public.menu_items for each row execute function public.touch_updated_at();
create trigger trg_orders_updated before update on public.orders for each row execute function public.touch_updated_at();

-- ============ RLS ============
alter table public.restaurants enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid());

-- restaurants
create policy "members read restaurant" on public.restaurants for select to authenticated
  using (public.is_member(auth.uid(), id) or owner_id = auth.uid());
create policy "public read restaurant by slug" on public.restaurants for select to anon using (true);
create policy "owner inserts restaurant" on public.restaurants for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates restaurant" on public.restaurants for update to authenticated using (owner_id = auth.uid());
create policy "owner deletes restaurant" on public.restaurants for delete to authenticated using (owner_id = auth.uid());

-- user_roles
create policy "members read roles in their restaurants" on public.user_roles for select to authenticated
  using (public.is_member(auth.uid(), restaurant_id));
create policy "owner manages roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), restaurant_id, 'owner'))
  with check (public.has_role(auth.uid(), restaurant_id, 'owner'));

-- restaurant_tables: members manage; public read
create policy "public read tables" on public.restaurant_tables for select using (true);
create policy "members manage tables" on public.restaurant_tables for all to authenticated
  using (public.is_member(auth.uid(), restaurant_id))
  with check (public.is_member(auth.uid(), restaurant_id));

-- menu: public read; members manage
create policy "public read categories" on public.menu_categories for select using (true);
create policy "members manage categories" on public.menu_categories for all to authenticated
  using (public.is_member(auth.uid(), restaurant_id))
  with check (public.is_member(auth.uid(), restaurant_id));

create policy "public read menu items" on public.menu_items for select using (true);
create policy "members manage menu items" on public.menu_items for all to authenticated
  using (public.is_member(auth.uid(), restaurant_id))
  with check (public.is_member(auth.uid(), restaurant_id));

-- orders: anon can create; members read/update for their restaurant
create policy "anon places order" on public.orders for insert to anon with check (true);
create policy "auth places order" on public.orders for insert to authenticated with check (true);
create policy "members read orders" on public.orders for select to authenticated
  using (public.is_member(auth.uid(), restaurant_id));
create policy "members update orders" on public.orders for update to authenticated
  using (public.is_member(auth.uid(), restaurant_id));

-- order_items
create policy "anon adds order items" on public.order_items for insert to anon with check (true);
create policy "auth adds order items" on public.order_items for insert to authenticated with check (true);
create policy "members read order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and public.is_member(auth.uid(), o.restaurant_id)));

-- ============ Realtime ============
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter table public.orders replica identity full;
alter table public.order_items replica identity full;
