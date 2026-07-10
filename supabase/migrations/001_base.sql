-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Schema Supabase (PostgreSQL)
-- Baltazar / @daily_arcane
--
-- Ordem de execução: rode o arquivo inteiro de uma vez no SQL Editor
-- do Supabase. Tudo é idempotente-friendly onde faz sentido.
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. TÍTULOS / GRAUS  (tabela de referência, lida por todos)
--    Define os limiares de XP para cada grau de mago.
-- ───────────────────────────────────────────────────────────────────
create table public.titles (
  id          smallint primary key,       -- ordem do grau (0 = Neófito)
  name        text not null unique,
  glyph       text,                        -- símbolo alquímico exibido
  min_xp      integer not null,            -- XP necessário para alcançar
  created_at  timestamptz default now()
);

insert into public.titles (id, name, glyph, min_xp) values
  (0, 'Neófito',     '☿', 0),
  (1, 'Zelator',     '🜂', 100),
  (2, 'Praticante',  '🜄', 300),
  (3, 'Adepto',      '🜁', 700),
  (4, 'Magus',       '🜃', 1500),
  (5, 'Ipsissimus',  '✶', 3000);


-- ───────────────────────────────────────────────────────────────────
-- 2. PROFILES  (1:1 com auth.users)
--    Guarda o estado de progressão. xp_total é DERIVADO — recalculado
--    por trigger sempre que o progresso muda, nunca escrito à mão.
-- ───────────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  xp_total     integer not null default 0,
  title_id     smallint not null default 0 references public.titles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Cria o profile automaticamente quando um usuário se registra no Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Iniciado'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ───────────────────────────────────────────────────────────────────
-- 3. GRIMOIRES  (catálogo — espelha teus e-books Baltazar)
--    is_premium marca o que exige compra no Hotmart.
--    Este catálogo é GLOBAL e lido por todos; só admin escreve.
-- ───────────────────────────────────────────────────────────────────
create table public.grimoires (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,        -- 'fogo-interior', 'sigilos'...
  title       text not null,
  subtitle    text,
  hue         text,                        -- cor de destaque (hex)
  sort_order  smallint default 0,
  is_premium  boolean not null default false,
  hotmart_pid text,                        -- product id no Hotmart (se premium)
  created_at  timestamptz default now()
);


-- ───────────────────────────────────────────────────────────────────
-- 4. SPELLS  (técnicas/feitiços dentro de cada grimório — catálogo)
--    xp_reward = pontos concedidos ao DOMINAR a técnica.
-- ───────────────────────────────────────────────────────────────────
create table public.spells (
  id           uuid primary key default gen_random_uuid(),
  grimoire_id  uuid not null references public.grimoires(id) on delete cascade,
  name         text not null,
  description  text,
  xp_reward    integer not null default 30,
  sort_order   smallint default 0,
  created_at   timestamptz default now()
);

create index spells_grimoire_idx on public.spells(grimoire_id);


-- ───────────────────────────────────────────────────────────────────
-- 5. USER_SPELLS  (progresso pessoal — o coração do app)
--    Uma linha por (usuário, técnica) uma vez que ele começa a praticar.
--    status: 'novo' | 'praticando' | 'dominado'
-- ───────────────────────────────────────────────────────────────────
create type spell_status as enum ('novo', 'praticando', 'dominado');

create table public.user_spells (
  user_id     uuid not null references auth.users(id) on delete cascade,
  spell_id    uuid not null references public.spells(id) on delete cascade,
  status      spell_status not null default 'novo',
  mastered_at timestamptz,                 -- preenchido ao virar 'dominado'
  updated_at  timestamptz default now(),
  primary key (user_id, spell_id)
);

create index user_spells_user_idx on public.user_spells(user_id);


-- ───────────────────────────────────────────────────────────────────
-- 6. ENTITLEMENTS  (acesso a grimórios premium via Hotmart)
--    Populada pelo webhook de compra aprovada. Sem linha aqui,
--    a RLS bloqueia o conteúdo premium.
-- ───────────────────────────────────────────────────────────────────
create table public.entitlements (
  user_id      uuid not null references auth.users(id) on delete cascade,
  grimoire_id  uuid not null references public.grimoires(id) on delete cascade,
  source       text default 'hotmart',
  granted_at   timestamptz default now(),
  primary key (user_id, grimoire_id)
);


-- ═══════════════════════════════════════════════════════════════════
-- LÓGICA DE XP E PROGRESSÃO
-- Recalcula xp_total e title_id sempre que o progresso do usuário muda.
-- XP só conta de técnicas 'dominado'. Fonte única de verdade.
-- ═══════════════════════════════════════════════════════════════════
create or replace function public.recalc_progression(p_user uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp    integer;
  v_title smallint;
begin
  -- soma o xp_reward de todas as técnicas dominadas pelo usuário
  select coalesce(sum(s.xp_reward), 0)
    into v_xp
    from public.user_spells us
    join public.spells s on s.id = us.spell_id
   where us.user_id = p_user
     and us.status = 'dominado';

  -- encontra o grau mais alto cujo limiar o XP alcança
  select id into v_title
    from public.titles
   where min_xp <= v_xp
   order by min_xp desc
   limit 1;

  update public.profiles
     set xp_total   = v_xp,
         title_id   = coalesce(v_title, 0),
         updated_at = now()
   where id = p_user;
end;
$$;

-- Trigger: em qualquer insert/update/delete de user_spells,
-- carimba mastered_at e dispara o recálculo.
create or replace function public.on_user_spell_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- carimba/limpa o momento de domínio
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    if new.status = 'dominado' and (old is null or old.status <> 'dominado') then
      new.mastered_at := now();
    elsif new.status <> 'dominado' then
      new.mastered_at := null;
    end if;
    new.updated_at := now();
  end if;

  -- recalcula para o usuário afetado (após a linha ser gravada)
  perform public.recalc_progression(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

create trigger trg_user_spell_change
  after insert or update or delete on public.user_spells
  for each row execute function public.on_user_spell_change();


-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Regra de ouro: cada usuário só enxerga/edita os próprios dados.
-- Catálogo (grimoires, spells, titles) é leitura pública.
-- ═══════════════════════════════════════════════════════════════════

-- profiles ──────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles: dono lê"   on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: dono edita" on public.profiles
  for update using (auth.uid() = id);

-- user_spells ───────────────────────────────────────
alter table public.user_spells enable row level security;

create policy "user_spells: dono lê"     on public.user_spells
  for select using (auth.uid() = user_id);
create policy "user_spells: dono insere" on public.user_spells
  for insert with check (auth.uid() = user_id);
create policy "user_spells: dono edita"  on public.user_spells
  for update using (auth.uid() = user_id);
create policy "user_spells: dono apaga"  on public.user_spells
  for delete using (auth.uid() = user_id);

-- entitlements ──────────────────────────────────────
-- Só leitura pelo dono. Escrita é feita pelo webhook via service_role,
-- que ignora RLS por padrão.
alter table public.entitlements enable row level security;

create policy "entitlements: dono lê" on public.entitlements
  for select using (auth.uid() = user_id);

-- Catálogo: leitura para todos (inclusive anônimos, se quiser vitrine) ──
alter table public.titles     enable row level security;
alter table public.grimoires  enable row level security;
alter table public.spells     enable row level security;

create policy "titles: leitura pública"    on public.titles
  for select using (true);
create policy "grimoires: leitura pública" on public.grimoires
  for select using (true);
create policy "spells: leitura pública"    on public.spells
  for select using (true);


-- ═══════════════════════════════════════════════════════════════════
-- VIEW DE CONVENIÊNCIA
-- Entrega ao front-end cada grimório com uma flag de acesso já resolvida,
-- evitando lógica de permissão no cliente.
-- ═══════════════════════════════════════════════════════════════════
create or replace view public.my_grimoires as
  select
    g.*,
    (
      not g.is_premium
      or exists (
        select 1 from public.entitlements e
         where e.user_id = auth.uid()
           and e.grimoire_id = g.id
      )
    ) as has_access
  from public.grimoires g
  order by g.sort_order;


-- ═══════════════════════════════════════════════════════════════════
-- SEED DE EXEMPLO (opcional — remova em produção se preferir)
-- ═══════════════════════════════════════════════════════════════════
insert into public.grimoires (slug, title, subtitle, hue, sort_order, is_premium) values
  ('fogo-interior', 'O Fogo Interior',  'Hermetismo & Magia do Caos', '#c9962e', 1, false),
  ('sigilos',       'Sigilos & Caos',   'A técnica das sentenças',    '#8a7fd6', 2, false),
  ('mascaras',      'Máscaras Divinas', 'Assunção da forma-deus',     '#c96a4a', 3, true);

insert into public.spells (grimoire_id, name, description, xp_reward, sort_order)
select id, 'Respiração da Chama', 'Ritmo respiratório de concentração', 40, 1 from public.grimoires where slug = 'fogo-interior';
insert into public.spells (grimoire_id, name, description, xp_reward, sort_order)
select id, 'Concentração no Ponto', 'Dharana sobre um foco único', 30, 2 from public.grimoires where slug = 'fogo-interior';
insert into public.spells (grimoire_id, name, description, xp_reward, sort_order)
select id, 'A Vontade Verdadeira', 'Descoberta do propósito central', 60, 3 from public.grimoires where slug = 'fogo-interior';
