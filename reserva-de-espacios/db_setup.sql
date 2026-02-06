-- ⚠️ INSTRUCCIONES:
-- 1. Copia todo este código.
-- 2. Pega y ejecuta ("RUN") en el SQL Editor de Supabase.

-- ==========================================
-- 1. ASEGURAR TABLAS
-- ==========================================

create table if not exists public.reservations (
  id text primary key,
  full_name text,
  space_id text,
  space_name text,
  reason text,
  date text,
  time text,
  duration text,
  created_at bigint,
  status text,
  user_email text
);

create table if not exists public.spaces (
  id text primary key,
  name text not null,
  capacity int,
  features text[],
  image text,
  description text
);

create table if not exists public.app_config (
  id int primary key,
  app_name text default 'Reserva de Espacios',
  primary_color text default '#4f46e5',
  icon_url text default '',
  updated_at bigint
);

-- Tabla para gestionar roles adicionales (Moderadores)
create table if not exists public.user_roles (
  email text primary key,
  role text not null check (role in ('admin', 'moderator')),
  created_at bigint default extract(epoch from now())
);

-- ==========================================
-- 2. REINICIAR Y MEJORAR POLÍTICAS (RLS)
-- ==========================================

-- Habilitar seguridad
alter table public.reservations enable row level security;
alter table public.spaces enable row level security;
alter table public.app_config enable row level security;
alter table public.user_roles enable row level security;

-- Borrar políticas antiguas
drop policy if exists "Lectura publica" on public.reservations;
drop policy if exists "Escritura autenticada" on public.reservations;
drop policy if exists "Edicion autenticada" on public.reservations;
drop policy if exists "Borrado autenticado" on public.reservations;
drop policy if exists "Lectura publica espacios" on public.spaces;
drop policy if exists "Admin Insert Spaces" on public.spaces;
drop policy if exists "Admin Update Spaces" on public.spaces;
drop policy if exists "Admin Delete Spaces" on public.spaces;
drop policy if exists "Lectura publica config" on public.app_config;
drop policy if exists "Gestion config admin" on public.app_config;
drop policy if exists "Lectura publica roles" on public.user_roles;
drop policy if exists "Gestion roles admin" on public.user_roles;

-- --- POLÍTICAS RESERVAS ---
create policy "Lectura publica" on public.reservations for select using (true);
create policy "Escritura autenticada" on public.reservations for insert to authenticated with check (true);
create policy "Edicion autenticada" on public.reservations for update to authenticated using (true);
create policy "Borrado autenticado" on public.reservations for delete to authenticated using (true);

-- --- POLÍTICAS ESPACIOS ---
create policy "Lectura publica espacios" on public.spaces for select using (true);
-- Permitimos escritura a cualquier autenticado, la App filtra quién es Admin/Moderador
create policy "Admin Insert Spaces" on public.spaces for insert to authenticated with check (true);
create policy "Admin Update Spaces" on public.spaces for update to authenticated using (true);
create policy "Admin Delete Spaces" on public.spaces for delete to authenticated using (true);

-- --- POLÍTICAS CONFIGURACIÓN ---
create policy "Lectura publica config" on public.app_config for select using (true);
create policy "Gestion config admin" on public.app_config for all to authenticated using (true) with check (true);

-- --- POLÍTICAS ROLES (Moderadores) ---
-- Cualquiera puede leer para saber su propio rol al entrar
create policy "Lectura publica roles" on public.user_roles for select using (true);
-- Solo autenticados pueden gestionar (La App protege que solo sea el Super Admin)
create policy "Gestion roles admin" on public.user_roles for all to authenticated using (true) with check (true);

-- --- PERMISOS DE TABLA ---
grant all on table public.reservations to authenticated;
grant all on table public.spaces to authenticated;
grant all on table public.app_config to authenticated;
grant all on table public.user_roles to authenticated;

grant all on table public.reservations to anon;
grant all on table public.spaces to anon;
grant all on table public.app_config to anon;
grant all on table public.user_roles to anon;

-- ==========================================
-- 3. STORAGE & REALTIME
-- ==========================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Access Media" on storage.objects;
drop policy if exists "Authenticated Upload Media" on storage.objects;
drop policy if exists "Authenticated Update Media" on storage.objects;
drop policy if exists "Authenticated Delete Media" on storage.objects;

create policy "Public Access Media" on storage.objects for select using ( bucket_id = 'media' );
create policy "Authenticated Upload Media" on storage.objects for insert to authenticated with check ( bucket_id = 'media' );
create policy "Authenticated Update Media" on storage.objects for update to authenticated using ( bucket_id = 'media' );
create policy "Authenticated Delete Media" on storage.objects for delete to authenticated using ( bucket_id = 'media' );

-- Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.spaces;
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.app_config;
alter publication supabase_realtime add table public.user_roles;

-- Datos por defecto (si no existen)
insert into public.app_config (id, app_name, primary_color, icon_url, updated_at)
values (1, 'Parroquia San Juan', '#ea580c', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjkwIiBmaWxsPSIjZmZmNWViIiAvPjxwYXRoIGQ9Ik00MCAxNDAgTDQwIDE1MCBRMTAwIDE4MCAxNjAgMTUwIEwxNjAgMTQwIFoiIGZpbGw9IiNjMjQxMGMiIC8+PHBhdGggZD0iTTUwIDE0MCBMNTAgODAgTDEwMCA0MCBMMTUwIDgwIEwxNTAgMTQwIFoiIGZpbGw9IiNlYTU4MGMiIC8+PHJlY3QgeD0iOTAiIHk9IjEwMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIiByeD0iNSIgLz48L3N2Zz4=', extract(epoch from now()))
on conflict (id) do nothing;

select '✅ Base de datos actualizada con Roles y Moderadores.' as resultado;