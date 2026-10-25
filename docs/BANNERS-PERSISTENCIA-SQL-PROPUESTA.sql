-- VIAJES SONOROS · migración propuesta, NO EJECUTADA
-- Ejecución exclusivamente tras aprobación y revisión en el proyecto correcto.
begin;
create table if not exists public.informational_banners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1500),
  image_path text check (image_path is null or image_path ~ '^/?[a-zA-Z0-9/_-]+[.](webp|png|jpg|jpeg)$'),
  image_alt text not null default '',
  button_text text not null default 'Más información',
  button_url text not null check (
    button_url ~ '^/[^/]' or button_url ~ '^https://[^[:space:]]+$'
  ),
  active boolean not null default false,
  start_at timestamptz,
  end_at timestamptz,
  display_mode text not null default 'entry' check (display_mode in ('entry','scroll','exit')),
  scroll_percent integer not null default 50 check (scroll_percent between 10 and 95),
  delay_seconds integer not null default 3 check (delay_seconds between 0 and 60),
  show_once boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint banner_dates check (start_at is null or end_at is null or end_at > start_at)
);
alter table public.informational_banners enable row level security;
revoke all on public.informational_banners from public, anon, authenticated;
grant select on public.informational_banners to anon, authenticated;
grant insert, update, delete on public.informational_banners to authenticated;
-- App metadata lo establece solo un administrador de Auth con credenciales de servidor.
create policy banner_public_read on public.informational_banners
  for select to anon, authenticated
  using (active and (start_at is null or now() >= start_at)
                and (end_at is null or now() < end_at));
create policy banner_admin_read on public.informational_banners
  for select to authenticated
  using ((auth.jwt()->'app_metadata'->>'banner_admin') = 'true');
create policy banner_admin_insert on public.informational_banners
  for insert to authenticated
  with check ((auth.jwt()->'app_metadata'->>'banner_admin') = 'true');
create policy banner_admin_update on public.informational_banners
  for update to authenticated
  using ((auth.jwt()->'app_metadata'->>'banner_admin') = 'true')
  with check ((auth.jwt()->'app_metadata'->>'banner_admin') = 'true');
create policy banner_admin_delete on public.informational_banners
  for delete to authenticated
  using ((auth.jwt()->'app_metadata'->>'banner_admin') = 'true');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('banner-images','banner-images',true,6291456,array['image/webp','image/png','image/jpeg'])
  on conflict (id) do nothing;
create policy banner_images_read on storage.objects
  for select to anon, authenticated using(bucket_id='banner-images');
create policy banner_images_insert on storage.objects
  for insert to authenticated with check(
    bucket_id='banner-images' and (auth.jwt()->'app_metadata'->>'banner_admin')='true');
create policy banner_images_update on storage.objects
  for update to authenticated
  using(bucket_id='banner-images' and (auth.jwt()->'app_metadata'->>'banner_admin')='true')
  with check(bucket_id='banner-images' and (auth.jwt()->'app_metadata'->>'banner_admin')='true');
create policy banner_images_delete on storage.objects
  for delete to authenticated
  using(bucket_id='banner-images' and (auth.jwt()->'app_metadata'->>'banner_admin')='true');
commit;
