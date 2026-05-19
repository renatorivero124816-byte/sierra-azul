# Publicar SIERRA AZUL

Recomendación: Vercel para publicar y Supabase para guardar cambios del administrador.

## 1. Supabase

Crea un proyecto en Supabase y ejecuta este SQL:

```sql
create table if not exists portal_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table portal_state enable row level security;

create policy "public read portal state"
on portal_state for select
using (true);

create policy "public write portal state"
on portal_state for insert
with check (true);

create policy "public update portal state"
on portal_state for update
using (true)
with check (true);
```

Después copia `config.example.js` a `config.js` y llena:

- `supabaseUrl`
- `supabaseAnonKey`
- `adminPassword`

## 2. Vercel

Sube esta carpeta a un repositorio y conéctalo en Vercel como sitio estático. No necesita comando de build.

Mientras `config.js` no tenga Supabase, el sitio funciona localmente. Cuando tenga Supabase, los cambios del administrador se comparten en la página publicada.
