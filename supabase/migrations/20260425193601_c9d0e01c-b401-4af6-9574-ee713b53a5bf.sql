
-- Lock search_path on remaining functions
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end; $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Tighten orders insert: restaurant must exist and (if table_id set) it must belong to that restaurant
drop policy if exists "anon places order" on public.orders;
drop policy if exists "auth places order" on public.orders;

create policy "anyone places valid order" on public.orders for insert
  with check (
    exists (select 1 from public.restaurants r where r.id = restaurant_id)
    and (
      table_id is null
      or exists (select 1 from public.restaurant_tables t where t.id = table_id and t.restaurant_id = orders.restaurant_id)
    )
    and status = 'pending'
  );

-- Tighten order_items insert: must belong to a recent pending order
drop policy if exists "anon adds order items" on public.order_items;
drop policy if exists "auth adds order items" on public.order_items;

create policy "anyone adds items to pending order" on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.status = 'pending'
        and o.created_at > now() - interval '10 minutes'
    )
  );

-- Allow public to read order items for the order they just created (needed for ack/UI). Keep tight.
create policy "public read recent order items" on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.created_at > now() - interval '1 hour'
    )
  );

create policy "public read recent orders" on public.orders for select
  using (created_at > now() - interval '1 hour');
