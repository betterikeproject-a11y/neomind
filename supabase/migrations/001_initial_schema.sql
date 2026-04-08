-- =============================================================================
-- NeoMind – Schema inicial
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard → SQL Editor)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABELAS EXISTENTES (já usadas pelo app)
-- ---------------------------------------------------------------------------

-- Cockpit diário: check-in de humor, energia, blocos do dia, etc.
CREATE TABLE IF NOT EXISTS daily_checkin (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date          date        NOT NULL,
  mission       text        NOT NULL DEFAULT '',
  humor         integer     NOT NULL DEFAULT 5 CHECK (humor BETWEEN 1 AND 10),
  energia       integer     NOT NULL DEFAULT 5 CHECK (energia BETWEEN 1 AND 10),
  foco          integer     NOT NULL DEFAULT 5 CHECK (foco BETWEEN 1 AND 10),
  ansiedade     integer     NOT NULL DEFAULT 5 CHECK (ansiedade BETWEEN 1 AND 10),
  sono          integer     NOT NULL DEFAULT 5 CHECK (sono BETWEEN 1 AND 10),
  clareza       integer     NOT NULL DEFAULT 5 CHECK (clareza BETWEEN 1 AND 10),
  bloco_manha   text        NOT NULL DEFAULT '',
  bloco_tarde   text        NOT NULL DEFAULT '',
  bloco_noite   text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Diário: entradas diárias com modo cru ou poético
CREATE TABLE IF NOT EXISTS journal_entries (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date            date        NOT NULL,
  raw_content     text        NOT NULL DEFAULT '',
  poetic_content  text,
  mode            text        NOT NULL DEFAULT 'cru' CHECK (mode IN ('cru', 'poetico')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Metas: objetivos com área, prazo, progresso e status
CREATE TABLE IF NOT EXISTS goals (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title          text        NOT NULL,
  area           text        NOT NULL CHECK (area IN ('trabalho', 'mente', 'corpo', 'dinheiro', 'social')),
  deadline_days  integer     NOT NULL CHECK (deadline_days IN (14, 30, 90)),
  status         text        NOT NULL DEFAULT 'avancou' CHECK (status IN ('feito', 'avancou', 'travou', 'abandonei')),
  contingency    text        NOT NULL DEFAULT '',
  progress       integer     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Inbox mental: captura rápida de ideias, problemas e incômodos
CREATE TABLE IF NOT EXISTS inbox_items (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     text        NOT NULL,
  category    text        NOT NULL CHECK (category IN ('ideia', 'resolver', 'incomoda')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. TABELAS FUTURAS (prontas para quando os módulos forem criados)
-- ---------------------------------------------------------------------------

-- Projetos: iniciativas maiores, ligadas ou não a metas
CREATE TABLE IF NOT EXISTS projects (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        text        NOT NULL,
  description  text        NOT NULL DEFAULT '',
  status       text        NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'concluido', 'cancelado')),
  area         text        CHECK (area IN ('trabalho', 'mente', 'corpo', 'dinheiro', 'social', 'pessoal')),
  started_at   date,
  finished_at  date,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Filmes assistidos
CREATE TABLE IF NOT EXISTS movies (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       text        NOT NULL,
  director    text        NOT NULL DEFAULT '',
  year        integer,
  rating      integer     CHECK (rating BETWEEN 1 AND 5),
  notes       text        NOT NULL DEFAULT '',
  watched_at  date        NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Músicas / álbuns ouvidos
CREATE TABLE IF NOT EXISTS music_logs (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  artist       text        NOT NULL,
  album        text        NOT NULL DEFAULT '',
  track        text        NOT NULL DEFAULT '',
  genre        text        NOT NULL DEFAULT '',
  rating       integer     CHECK (rating BETWEEN 1 AND 5),
  notes        text        NOT NULL DEFAULT '',
  listened_at  date        NOT NULL DEFAULT CURRENT_DATE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Livros lidos / em leitura
CREATE TABLE IF NOT EXISTS books (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        text        NOT NULL,
  author       text        NOT NULL DEFAULT '',
  year         integer,
  rating       integer     CHECK (rating BETWEEN 1 AND 5),
  notes        text        NOT NULL DEFAULT '',
  started_at   date,
  finished_at  date,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. ÍNDICES (performance em queries por usuário e data)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_daily_checkin_user_date   ON daily_checkin   (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries  (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_created        ON goals            (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_items_user_created  ON inbox_items      (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_created     ON projects         (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movies_user_watched       ON movies           (user_id, watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_logs_user_listened  ON music_logs       (user_id, listened_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_user_created        ON books            (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — cada usuário só vê e edita seus próprios dados
-- ---------------------------------------------------------------------------

ALTER TABLE daily_checkin   ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE books           ENABLE ROW LEVEL SECURITY;

-- daily_checkin
CREATE POLICY "daily_checkin: owner only" ON daily_checkin
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- journal_entries
CREATE POLICY "journal_entries: owner only" ON journal_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- goals
CREATE POLICY "goals: owner only" ON goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- inbox_items
CREATE POLICY "inbox_items: owner only" ON inbox_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- projects
CREATE POLICY "projects: owner only" ON projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- movies
CREATE POLICY "movies: owner only" ON movies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- music_logs
CREATE POLICY "music_logs: owner only" ON music_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- books
CREATE POLICY "books: owner only" ON books
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
