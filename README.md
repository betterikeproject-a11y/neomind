# NeoMind

Cockpit mental pessoal. Auth, check-in diário, inbox de ideias, metas e diário com modo poético via Claude.

## Stack

- Next.js 14 (App Router)
- Supabase (auth + banco)
- Tailwind CSS
- Anthropic API (Diário Poético)

## Setup

### 1. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Supabase — criar as tabelas

No Supabase, vá em **SQL Editor** e execute:

```sql
-- Check-in diário
create table daily_checkin (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  mission text default '',
  humor int2 default 5,
  energia int2 default 5,
  foco int2 default 5,
  ansiedade int2 default 5,
  sono int2 default 5,
  clareza int2 default 5,
  bloco_manha text default '',
  bloco_tarde text default '',
  bloco_noite text default '',
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table daily_checkin enable row level security;
create policy "Users own their checkins" on daily_checkin
  for all using (auth.uid() = user_id);

-- Inbox mental
create table inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  category text check (category in ('ideia','resolver','incomoda')) not null,
  created_at timestamptz default now()
);

alter table inbox_items enable row level security;
create policy "Users own their inbox" on inbox_items
  for all using (auth.uid() = user_id);

-- Metas
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  area text check (area in ('trabalho','mente','corpo','dinheiro','social')) not null,
  deadline_days int2 not null,
  status text check (status in ('feito','avancou','travou','abandonei')) default 'avancou',
  contingency text default '',
  progress int2 default 0,
  created_at timestamptz default now()
);

alter table goals enable row level security;
create policy "Users own their goals" on goals
  for all using (auth.uid() = user_id);

-- Diário
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  raw_content text not null,
  poetic_content text,
  mode text check (mode in ('cru','poetico')) default 'cru',
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table journal_entries enable row level security;
create policy "Users own their journal" on journal_entries
  for all using (auth.uid() = user_id);
```

### 3. Supabase — criar usuário

Em **Authentication > Users**, clique em **Add user** e crie seu usuário com email/senha.

### 4. Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

```bash
npx vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel (Settings > Environment Variables):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

## Features

| Seção | O que faz |
|---|---|
| **Cockpit** | Missão do dia, 6 sliders de estado, 3 blocos do dia |
| **Inbox Mental** | Captura rápida com categorias: ideia / resolver / incomoda |
| **Metas** | CRUD de metas com área, prazo, progresso e plano de contingência |
| **Diário** | 3 prompts fixos + modo Cru vs Poético (via Claude API) |
