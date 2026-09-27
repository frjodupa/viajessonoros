-- Viajes Sonoros · políticas de seguridad Supabase
-- Revisar y ejecutar en el SQL Editor del proyecto correspondiente.
-- Diseñado para la arquitectura actual: tabla public.experiencias y bucket eventos.

begin;

alter table public.experiencias enable row level security;

drop policy if exists "experiencias_public_read" on public.experiencias;
drop policy if exists "experiencias_authenticated_read" on public.experiencias;
drop policy if exists "experiencias_authenticated_insert" on public.experiencias;
drop policy if exists "experiencias_authenticated_update" on public.experiencias;
drop policy if exists "experiencias_authenticated_delete" on public.experiencias;

create policy "experiencias_public_read"
on public.experiencias
for select
to anon
using (publicado = true);

create policy "experiencias_authenticated_read"
on public.experiencias
for select
to authenticated
using (true);

create policy "experiencias_authenticated_insert"
on public.experiencias
for insert
to authenticated
with check (true);

create policy "experiencias_authenticated_update"
on public.experiencias
for update
to authenticated
using (true)
with check (true);

create policy "experiencias_authenticated_delete"
on public.experiencias
for delete
to authenticated
using (true);

-- Las imágenes de experiencias se muestran públicamente mediante getPublicUrl().
update storage.buckets
set public = true
where id = 'eventos';

drop policy if exists "eventos_public_read" on storage.objects;
drop policy if exists "eventos_authenticated_insert" on storage.objects;
drop policy if exists "eventos_authenticated_update" on storage.objects;
drop policy if exists "eventos_authenticated_delete" on storage.objects;

create policy "eventos_public_read"
on storage.objects
for select
to anon
using (bucket_id = 'eventos');

create policy "eventos_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'eventos');

create policy "eventos_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'eventos')
with check (bucket_id = 'eventos');

create policy "eventos_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'eventos');

commit;
