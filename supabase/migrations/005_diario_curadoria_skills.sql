-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 005 (v2): Diário, Curadoria e Skills Próprias
-- SUBSTITUI a versão anterior do 005. Rode APÓS 001–004.
--
-- Três recursos:
--  A) Diário de Práticas por técnica (privado).
--  B) Curadoria: o usuário escolhe QUAIS técnicas do catálogo aparecem
--     no seu "Teus Grimórios" (rastrear/deixar de rastrear).
--  C) Skills próprias: o usuário escreve técnicas personalizadas, que
--     vivem numa seção "Práticas Pessoais".
--
-- REGRA DE INTEGRIDADE DO RANKING:
--  Skills criadas pelo usuário NÃO concedem XP (xp_reward forçado a 0
--  e excluídas do recálculo). Caso contrário, criar e "dominar" skills
--  em massa viraria farm de XP e corromperia o ranking. Elas têm
--  status, diário e lugar na coleção — o valor é o registro, não o grau.
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- A) DIÁRIO DE PRÁTICAS (privado, por técnica)
-- ───────────────────────────────────────────────────────────────────
create table public.spell_journal (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  spell_id    uuid not null references public.spells(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index journal_user_spell_idx
  on public.spell_journal(user_id, spell_id, created_at desc);

alter table public.spell_journal enable row level security;
create policy "diario: dono le" on public.spell_journal
  for select using (auth.uid() = user_id);
create policy "diario: dono escreve" on public.spell_journal
  for insert with check (auth.uid() = user_id);
create policy "diario: dono edita" on public.spell_journal
  for update using (auth.uid() = user_id);
create policy "diario: dono apaga" on public.spell_journal
  for delete using (auth.uid() = user_id);


-- ───────────────────────────────────────────────────────────────────
-- B+C) SKILLS PRÓPRIAS via extensão da tabela spells
--    owner_id NULL  → técnica do catálogo (tua, oficial)
--    owner_id = uid → técnica pessoal do usuário
--    Técnicas pessoais podem não ter grimório (seção "Práticas
--    Pessoais" no front) — grimoire_id vira opcional.
-- ───────────────────────────────────────────────────────────────────
alter table public.spells
  add column owner_id uuid references auth.users(id) on delete cascade,
  alter column grimoire_id drop not null;

-- Integridade: skill pessoal nunca vale XP; skill de catálogo sempre
-- pertence a um grimório.
alter table public.spells add constraint custom_spell_rules check (
  (owner_id is null and grimoire_id is not null)
  or
  (owner_id is not null and xp_reward = 0)
);

create index spells_owner_idx on public.spells(owner_id)
  where owner_id is not null;

-- RLS de spells: substituir a policy de leitura pública da 001 por
-- leitura de catálogo + as próprias, e permitir CRUD das próprias.
drop policy if exists "spells: leitura pública" on public.spells;

create policy "spells: catalogo e proprias" on public.spells
  for select using (owner_id is null or owner_id = auth.uid());

create policy "spells: cria proprias" on public.spells
  for insert with check (
    owner_id = auth.uid()
    and xp_reward = 0
    and char_length(name) between 3 and 80
  );

create policy "spells: edita proprias" on public.spells
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and xp_reward = 0);

create policy "spells: apaga proprias" on public.spells
  for delete using (owner_id = auth.uid());


-- ───────────────────────────────────────────────────────────────────
-- Recalculo de XP: passar a IGNORAR skills pessoais.
-- (Mesma função da 001, com o filtro owner_id is null adicionado.)
-- ───────────────────────────────────────────────────────────────────
create or replace function public.recalc_progression(p_user uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp    integer;
  v_title smallint;
begin
  select coalesce(sum(s.xp_reward), 0)
    into v_xp
    from public.user_spells us
    join public.spells s on s.id = us.spell_id
   where us.user_id = p_user
     and us.status = 'dominado'
     and s.owner_id is null;          -- só técnicas do catálogo dão XP

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


-- ───────────────────────────────────────────────────────────────────
-- B) CURADORIA: rastrear / deixar de rastrear
--    A própria user_spells É a seleção: existir uma linha = a técnica
--    aparece em "Teus Grimórios". Não existir = fica só no catálogo.
--    (A RLS de user_spells da 001 já permite insert/delete do dono —
--    nada novo a criar; só a semântica muda no front.)
--
--    RPC de conveniência: coleção completa do usuário numa chamada,
--    já com dados da técnica, do grimório e contagem de diário.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.my_collection()
returns table (
  spell_id uuid,
  spell_name text,
  spell_description text,
  xp_reward integer,
  is_custom boolean,
  grimoire_id uuid,
  grimoire_title text,
  grimoire_hue text,
  status spell_status,
  mastered_at timestamptz,
  journal_count bigint
)
language sql stable
security definer set search_path = public
as $$
  select
    s.id, s.name, s.description, s.xp_reward,
    (s.owner_id is not null) as is_custom,
    g.id, coalesce(g.title, 'Práticas Pessoais'),
    coalesce(g.hue, '#8a93a8'),
    us.status, us.mastered_at,
    (select count(*) from public.spell_journal j
      where j.user_id = auth.uid() and j.spell_id = s.id)
  from public.user_spells us
  join public.spells s on s.id = us.spell_id
  left join public.grimoires g on g.id = s.grimoire_id
  where us.user_id = auth.uid()
  order by g.sort_order nulls last, s.sort_order;
$$;

-- RPC: criar skill própria E já rastreá-la, numa operação só.
create or replace function public.create_custom_spell(
  p_name text,
  p_description text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.spells (name, description, owner_id, xp_reward, grimoire_id)
  values (trim(p_name), p_description, auth.uid(), 0, null)
  returning id into v_id;

  insert into public.user_spells (user_id, spell_id, status)
  values (auth.uid(), v_id, 'novo');

  return v_id;
end;
$$;


-- ───────────────────────────────────────────────────────────────────
-- Queries para o front (Parte 1 do HANDOFF):
--
-- // coleção do usuário (alimenta "Teus Grimórios" inteira)
-- const { data: col } = await supabase.rpc('my_collection')
--
-- // catálogo para a tela "Adicionar técnica" (as ainda não rastreadas
-- // filtram-se no front comparando com a coleção)
-- const { data: catalog } = await supabase.from('spells')
--   .select('id, name, description, xp_reward, grimoire_id')
--   .is('owner_id', null)
--
-- // rastrear técnica do catálogo
-- await supabase.from('user_spells').insert({
--   user_id: user.id, spell_id, status: 'novo' })
--
-- // deixar de rastrear (o diário permanece guardado)
-- await supabase.from('user_spells').delete()
--   .eq('user_id', user.id).eq('spell_id', spellId)
--
-- // criar skill própria (já entra rastreada)
-- const { data: newId } = await supabase.rpc('create_custom_spell', {
--   p_name: 'Escaneamento etérico matinal',
--   p_description: 'Varredura corporal em estado hipnagógico' })
--
-- // editar/apagar skill própria
-- await supabase.from('spells').update({ name, description }).eq('id', id)
-- await supabase.from('spells').delete().eq('id', id)
--
-- // diário (igual à versão anterior)
-- await supabase.from('spell_journal').insert({
--   user_id: user.id, spell_id, body })
--
-- NOTA DE UX: ao deixar de rastrear, avisar que o progresso e o diário
-- ficam salvos e voltam se rastrear de novo. Ao APAGAR skill própria,
-- avisar que o diário dela se perde junto (cascade).
-- ───────────────────────────────────────────────────────────────────
