-- 0001_contenido_pilares.sql
--
-- Consolidación del modelo de datos para el contenido divulgativo de los
-- pilares Sueño / Estrés / Bienestar emocional (y reutilizable para el
-- resto de pilares a futuro).
--
-- CONTEXTO (ver auditoría de la app en el proyecto NUTRILONGX):
-- Hoy conviven dos modelos sin fusionar: la tabla `content` (genérica,
-- section RETOS|RUTINAS|MENTE, vacía) y `actions_catalog` + `action_logs`
-- (motor de créditos, alineado con el Excel, también sin datos cargados
-- todavía). Esta migración NO toca esas dos tablas —no se borra nada—,
-- solo añade las tablas nuevas necesarias para el contenido divulgativo,
-- los retos insignia, los vídeos y las infografías aprobados. La decisión
-- de retirar o fusionar `content` queda para una migración aparte, una vez
-- se confirme que nada en producción depende ya de ella.
--
-- Cómo aplicar: pegar este archivo en el SQL editor de Supabase, o
-- `supabase db push` si usas la CLI conectada al proyecto. No se ha
-- ejecutado contra ningún proyecto real: aquí no hay credenciales.

-- ============================================================ extensión
create extension if not exists "pgcrypto"; -- para gen_random_uuid()

-- ================================================== subpilar_mapeo
-- A qué pilar visible de cliente (Sueño/Estrés/Bienestar emocional)
-- pertenece cada subpilar del catálogo. El pilar backend sigue siendo
-- único ('MEN') en actions_catalog; esta tabla es solo de presentación.
create table if not exists subpilar_mapeo (
  subpilar        text primary key,
  pilar_backend   text not null default 'MEN',
  pilar_visible   text not null check (pilar_visible in ('Sueño','Estrés','Bienestar emocional')),
  nota            text,
  updated_at      timestamptz not null default now()
);
comment on table subpilar_mapeo is 'Mapeo de subpilares del catálogo (actions_catalog.subpillar) a los 3 pilares visibles de cliente.';

-- ================================================== content_pieces
-- Contenido divulgativo: fichas de pilar y de subpilar (texto cliente +
-- texto equipo), citando bibliografía por id.
create table if not exists content_pieces (
  id                uuid primary key default gen_random_uuid(),
  pilar_visible     text not null check (pilar_visible in ('Sueño','Estrés','Bienestar emocional')),
  tipo              text not null check (tipo in ('ficha_pilar','ficha_subpilar')),
  tema              text not null,
  subpilar          text references subpilar_mapeo(subpilar),
  actividad_ancla   text,
  texto_cliente     text not null,
  texto_equipo      text not null,
  fuentes           text[] not null default '{}',
  estado            text not null default 'aprobado' check (estado in ('borrador','aprobado','retirado')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (pilar_visible, tipo, tema)
);
create index if not exists idx_content_pieces_pilar on content_pieces(pilar_visible);
create index if not exists idx_content_pieces_subpilar on content_pieces(subpilar);
comment on table content_pieces is 'Fichas divulgativas (cliente + equipo) por pilar/subpilar visible.';

-- ================================================== retos_insignia
create table if not exists retos_insignia (
  id            uuid primary key default gen_random_uuid(),
  pilar_visible text not null check (pilar_visible in ('Sueño','Estrés','Bienestar emocional')),
  nombre        text not null,
  descripcion   text not null,
  duracion      text not null,
  nota_motor    text,
  estado        text not null default 'aprobado' check (estado in ('borrador','aprobado','retirado')),
  created_at    timestamptz not null default now(),
  unique (pilar_visible, nombre)
);
comment on table retos_insignia is 'Retos "gancho" de cara al cliente, construidos sobre reglas del motor de gamificación ya existentes (o candidatos a nueva regla, ver nota_motor).';

-- ================================================== videos + bloques
create table if not exists videos (
  id                  uuid primary key default gen_random_uuid(),
  titulo              text not null,
  subpilar            text references subpilar_mapeo(subpilar),
  duracion_objetivo   text,
  tono                text,
  estado              text not null default 'aprobado' check (estado in ('borrador','aprobado','retirado','grabado','publicado')),
  url_video           text, -- se rellena cuando exista el vídeo grabado/editado
  created_at          timestamptz not null default now(),
  unique (titulo)
);

create table if not exists video_bloques (
  id          uuid primary key default gen_random_uuid(),
  video_id    uuid not null references videos(id) on delete cascade,
  orden       int not null,
  tiempo      text not null,
  guion       text not null
);
create index if not exists idx_video_bloques_video on video_bloques(video_id, orden);
comment on table videos is 'Guiones de vídeo de mindfulness; url_video se rellena tras producción.';

-- ================================================== infografias
create table if not exists infografias (
  id              uuid primary key default gen_random_uuid(),
  pilar_visible   text not null unique check (pilar_visible in ('Sueño','Estrés','Bienestar emocional')),
  titulo          text not null,
  color           text,
  dato_destacado  text,
  dato_contexto   text,
  puntos_clave    text[] not null default '{}',
  microhabito     text,
  fuentes         text[] not null default '{}',
  imagen_url      text, -- URL final (Supabase Storage u otro CDN) tras subir el PNG
  estado          text not null default 'aprobado' check (estado in ('borrador','aprobado','retirado')),
  created_at      timestamptz not null default now()
);

-- ============================================================ RLS
-- Lectura pública solo de lo aprobado; escritura solo con service role
-- (que siempre bypassa RLS), igual que ya hace el resto de la app.
alter table subpilar_mapeo enable row level security;
alter table content_pieces enable row level security;
alter table retos_insignia enable row level security;
alter table videos enable row level security;
alter table video_bloques enable row level security;
alter table infografias enable row level security;

drop policy if exists "public read subpilar_mapeo" on subpilar_mapeo;
create policy "public read subpilar_mapeo" on subpilar_mapeo for select using (true);

drop policy if exists "public read content_pieces aprobado" on content_pieces;
create policy "public read content_pieces aprobado" on content_pieces for select using (estado = 'aprobado');

drop policy if exists "public read retos_insignia aprobado" on retos_insignia;
create policy "public read retos_insignia aprobado" on retos_insignia for select using (estado = 'aprobado');

drop policy if exists "public read videos aprobado" on videos;
create policy "public read videos aprobado" on videos for select using (estado in ('aprobado','grabado','publicado'));

drop policy if exists "public read video_bloques" on video_bloques;
create policy "public read video_bloques" on video_bloques for select using (
  exists (select 1 from videos v where v.id = video_bloques.video_id and v.estado in ('aprobado','grabado','publicado'))
);

drop policy if exists "public read infografias aprobado" on infografias;
create policy "public read infografias aprobado" on infografias for select using (estado = 'aprobado');

-- No se crean policies de INSERT/UPDATE/DELETE para el rol anon/authenticated:
-- toda escritura pasa por los endpoints /api protegidos con ADMIN_API_KEY,
-- que usan la service role key y por tanto no dependen de estas policies.
