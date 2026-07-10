-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 004 (v2): Quests e Tesouro do Mago
-- Rode APÓS 001, 002 e 003.
-- SUBSTITUI a versão anterior do 004 — se já rodou a antiga, me avise
-- que gero o script de migração; se não rodou, use apenas este.
--
-- Economia FECHADA:
--  * Moedas ENTRAM apenas completando quests diárias/semanais.
--  * Moedas SAEM apenas na loja de cosméticos.
--  * Sem compra por dinheiro real. Sem transferência entre usuários.
--  * Nada comprável afeta XP, grau ou ranking — só aparência.
--
--  Saldo é derivado de um livro-razão (coin_ledger): toda mudança é
--  uma transação auditável; nenhuma coluna de saldo editável existe.
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. QUESTS (catálogo — você define)
-- ───────────────────────────────────────────────────────────────────
create type quest_frequency as enum ('diaria', 'semanal', 'unica');
create type quest_proof     as enum ('nenhuma', 'foto', 'relato');
create type review_status   as enum ('pendente', 'aprovada', 'rejeitada');

create table public.quests (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text,
  frequency    quest_frequency not null default 'diaria',
  proof_type   quest_proof not null default 'nenhuma',
  coin_reward  integer not null check (coin_reward between 1 and 100),
  is_active    boolean not null default true,
  is_premium   boolean not null default false,   -- quest só do Círculo?
  sort_order   smallint default 0,
  created_at   timestamptz default now()
);

insert into public.quests (slug, title, description, frequency, proof_type, coin_reward, sort_order) values
  ('meditacao-diaria', 'Prática do dia',
   'Realize 10 minutos de meditação ou respiração ritual.', 'diaria', 'nenhuma', 5, 1),
  ('registro-diario', 'Diário do mago',
   'Registre em poucas linhas sua prática ou insight de hoje.', 'diaria', 'relato', 10, 2),
  ('sigilo-semanal', 'Sigilo da Semana',
   'Crie e carregue um sigilo. Envie a foto do sigilo desenhado.', 'semanal', 'foto', 40, 3),
  ('projecao-astral', 'Travessia do Véu',
   'Tente uma projeção astral e relate a experiência com detalhes.', 'semanal', 'relato', 30, 4);


-- ───────────────────────────────────────────────────────────────────
-- 2. SUBMISSÕES (prova do usuário + fila de revisão)
--    Sem prova → auto-aprova. Foto/relato → fila 'pendente' para você.
-- ───────────────────────────────────────────────────────────────────
create table public.quest_submissions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  quest_id     uuid not null references public.quests(id) on delete cascade,
  period_key   text not null,    -- 'D2026-07-10' (diária) | 'W2026-28' (semanal)
  proof_text   text,
  proof_path   text,             -- bucket 'provas'
  status       review_status not null default 'pendente',
  reviewed_at  timestamptz,
  review_note  text,
  created_at   timestamptz default now(),
  unique (user_id, quest_id, period_key)
);

create index submissions_user_idx   on public.quest_submissions(user_id);
create index submissions_review_idx on public.quest_submissions(status)
  where status = 'pendente';

create or replace function public.on_submission_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_proof quest_proof;
begin
  select proof_type into v_proof from public.quests where id = new.quest_id;
  if v_proof = 'nenhuma' then
    new.status := 'aprovada';
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_submission_insert
  before insert on public.quest_submissions
  for each row execute function public.on_submission_insert();


-- ───────────────────────────────────────────────────────────────────
-- 3. LIVRO-RAZÃO DE MOEDAS
--    reason: 'quest' | 'gasto_loja' | 'ajuste_admin'
-- ───────────────────────────────────────────────────────────────────
create table public.coin_ledger (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  delta       integer not null check (delta <> 0),
  reason      text not null,
  ref_id      uuid,
  created_at  timestamptz default now()
);

create index ledger_user_idx on public.coin_ledger(user_id, created_at desc);

create or replace function public.coin_balance(p_user uuid)
returns integer
language sql stable
security definer set search_path = public
as $$
  select coalesce(sum(delta), 0)::integer
    from public.coin_ledger where user_id = p_user;
$$;

-- Crédito na aprovação da submissão (com teto diário anti-abuso).
create or replace function public.on_submission_approved()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_reward integer;
  v_earned_today integer;
  v_cap integer := 60;      -- teto diário de moedas via quests
begin
  if new.status = 'aprovada' and (old.status is null or old.status <> 'aprovada') then
    select coin_reward into v_reward from public.quests where id = new.quest_id;

    select coalesce(sum(delta),0) into v_earned_today
      from public.coin_ledger
     where user_id = new.user_id and reason = 'quest'
       and created_at >= date_trunc('day', now());

    v_reward := least(v_reward, greatest(v_cap - v_earned_today, 0));

    if v_reward > 0 then
      insert into public.coin_ledger (user_id, delta, reason, ref_id)
      values (new.user_id, v_reward, 'quest', new.id);
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_submission_approved
  after insert or update on public.quest_submissions
  for each row execute function public.on_submission_approved();


-- ───────────────────────────────────────────────────────────────────
-- 4. TESOURO DO MAGO (loja de cosméticos)
--    kind:
--      'item_encantado'   → itens de coleção (talismãs, relíquias)
--      'arma_magica'      → armas do arsenal astral
--      'titulo_especial'  → título cerimonial exibido junto ao grau
--      'cosmetico_perfil' → molduras, auras, selos do perfil
--    NADA aqui afeta XP, grau ou posição no ranking.
-- ───────────────────────────────────────────────────────────────────
create type shop_kind as enum (
  'item_encantado', 'arma_magica', 'titulo_especial', 'cosmetico_perfil'
);

create table public.shop_items (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  kind         shop_kind not null,
  name         text not null,
  description  text,
  image_path   text,               -- bucket 'loja'
  price_coins  integer not null check (price_coins > 0),
  is_active    boolean not null default true,
  sort_order   smallint default 0,
  created_at   timestamptz default now()
);

insert into public.shop_items (slug, kind, name, description, price_coins, sort_order) values
  ('athame-de-obsidiana', 'arma_magica', 'Athame de Obsidiana',
   'Lâmina ritual do teu arsenal astral.', 450, 1),
  ('cajado-do-carvalho-antigo', 'arma_magica', 'Cajado do Carvalho Antigo',
   'Condutor de vontade talhado na madeira dos velhos bosques.', 600, 2),
  ('talisma-de-saturno', 'item_encantado', 'Talismã de Saturno',
   'Selo planetário de disciplina e estrutura.', 250, 3),
  ('titulo-portador-da-chama', 'titulo_especial', 'Portador da Chama',
   'Título cerimonial exibido junto ao teu grau.', 300, 4),
  ('aura-dourada', 'cosmetico_perfil', 'Aura Dourada',
   'Halo dourado ao redor do teu sigilo de perfil.', 350, 5),
  ('moldura-lunar', 'cosmetico_perfil', 'Moldura Lunar',
   'Anel de fases da lua emoldurando teu perfil.', 200, 6);

-- inventário
create table public.user_items (
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     uuid not null references public.shop_items(id) on delete cascade,
  equipped    boolean not null default false,   -- exibido no perfil?
  acquired_at timestamptz default now(),
  primary key (user_id, item_id)
);

-- título cosmético escolhido (entre os que o usuário possui)
alter table public.profiles
  add column cosmetic_title_id uuid references public.shop_items(id);

-- Compra atômica: debita e concede na mesma transação.
create or replace function public.buy_item(p_item uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_price integer;
  v_bal   integer;
begin
  select price_coins into v_price
    from public.shop_items where id = p_item and is_active;
  if not found then return 'item_indisponivel'; end if;

  if exists (select 1 from public.user_items
              where user_id = auth.uid() and item_id = p_item) then
    return 'ja_possui';
  end if;

  v_bal := public.coin_balance(auth.uid());
  if v_bal < v_price then return 'saldo_insuficiente'; end if;

  insert into public.coin_ledger (user_id, delta, reason, ref_id)
  values (auth.uid(), -v_price, 'gasto_loja', p_item);

  insert into public.user_items (user_id, item_id)
  values (auth.uid(), p_item);

  return 'ok';
end;
$$;

-- Equipar/desequipar item e escolher título cosmético.
create or replace function public.equip_item(p_item uuid, p_equip boolean)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  update public.user_items
     set equipped = p_equip
   where user_id = auth.uid() and item_id = p_item;
  if not found then return 'nao_possui'; end if;
  return 'ok';
end;
$$;

create or replace function public.set_cosmetic_title(p_item uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  if p_item is not null and not exists (
    select 1 from public.user_items ui
      join public.shop_items si on si.id = ui.item_id
     where ui.user_id = auth.uid() and ui.item_id = p_item
       and si.kind = 'titulo_especial'
  ) then
    return 'nao_possui';
  end if;

  update public.profiles
     set cosmetic_title_id = p_item,   -- null limpa o título
         updated_at = now()
   where id = auth.uid();
  return 'ok';
end;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════

alter table public.quests enable row level security;
create policy "quests: autenticados leem ativas" on public.quests
  for select using (
    is_active and auth.uid() is not null
    and (not is_premium or public.is_paying(auth.uid()))
  );

alter table public.quest_submissions enable row level security;
create policy "submissoes: dono le"   on public.quest_submissions
  for select using (auth.uid() = user_id);
create policy "submissoes: dono cria" on public.quest_submissions
  for insert with check (auth.uid() = user_id);
-- aprovar/rejeitar: apenas service_role (teu painel de revisão).

alter table public.coin_ledger enable row level security;
create policy "ledger: dono le" on public.coin_ledger
  for select using (auth.uid() = user_id);
-- Sem policy de escrita: só funções security definer escrevem. Nunca o usuário.

alter table public.shop_items enable row level security;
create policy "loja: autenticados leem" on public.shop_items
  for select using (is_active and auth.uid() is not null);

alter table public.user_items enable row level security;
create policy "inventario: dono le" on public.user_items
  for select using (auth.uid() = user_id);


-- ───────────────────────────────────────────────────────────────────
-- STORAGE
-- ───────────────────────────────────────────────────────────────────
-- provas de quest: usuário envia em provas/{uid}/... e só lê as suas
insert into storage.buckets (id, name, public)
values ('provas', 'provas', false)
on conflict (id) do nothing;

create policy "provas: dono envia" on storage.objects
  for insert with check (
    bucket_id = 'provas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "provas: dono le" on storage.objects
  for select using (
    bucket_id = 'provas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ilustrações da loja
insert into storage.buckets (id, name, public)
values ('loja', 'loja', false)
on conflict (id) do nothing;

create policy "loja storage: autenticados leem" on storage.objects
  for select using (bucket_id = 'loja' and auth.uid() is not null);


-- ───────────────────────────────────────────────────────────────────
-- RPCs para o front
-- ───────────────────────────────────────────────────────────────────
create or replace function public.my_balance()
returns integer language sql stable security definer
set search_path = public
as $$ select public.coin_balance(auth.uid()) $$;

create or replace function public.my_quests_today()
returns table (
  quest_id uuid, slug text, title text, description text,
  frequency quest_frequency, proof_type quest_proof,
  coin_reward integer, submission_status review_status
)
language sql stable security definer
set search_path = public
as $$
  select q.id, q.slug, q.title, q.description, q.frequency, q.proof_type,
         q.coin_reward, s.status
    from public.quests q
    left join public.quest_submissions s
      on s.quest_id = q.id
     and s.user_id = auth.uid()
     and s.period_key = case q.frequency
           when 'diaria'  then 'D' || to_char(now(), 'YYYY-MM-DD')
           when 'semanal' then 'W' || to_char(now(), 'IYYY-IW')
           else 'U'
         end
   where q.is_active
     and (not q.is_premium or public.is_paying(auth.uid()))
   order by q.sort_order;
$$;
