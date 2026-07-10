-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo: Ranking dos Magos (usuários pagos)
-- Rode APÓS o schema principal (schema-grimorio.sql).
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. Nickname fictício + opt-in no profile
--    O nickname é único e é a ÚNICA identidade exposta no ranking.
-- ───────────────────────────────────────────────────────────────────
alter table public.profiles
  add column nickname       text unique,
  add column show_in_ranking boolean not null default false;

-- Formato razoável: 3–24 caracteres, letras/números/espaço/hífen.
alter table public.profiles
  add constraint nickname_format
  check (nickname is null or nickname ~ '^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 \-]{2,23}$');


-- ───────────────────────────────────────────────────────────────────
-- 2. Quem é "pagante"?
--    Definição: tem pelo menos um entitlement (comprou algo no Hotmart).
-- ───────────────────────────────────────────────────────────────────
create or replace function public.is_paying(p_user uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.entitlements where user_id = p_user);
$$;


-- ───────────────────────────────────────────────────────────────────
-- 3. XP da lua corrente
--    Soma o xp_reward das técnicas dominadas DENTRO do mês vigente
--    (usa mastered_at, que o schema principal já carimba).
--    Trocar 'month' por janelas lunares reais fica como refinamento.
-- ───────────────────────────────────────────────────────────────────
create or replace view public.ranking_da_lua as
  select
    p.nickname,
    p.title_id,
    t.name  as title_name,
    t.glyph as title_glyph,
    coalesce(sum(s.xp_reward), 0)::integer as xp_lua,
    rank() over (
      partition by p.title_id                       -- liga por grau
      order by coalesce(sum(s.xp_reward), 0) desc
    ) as posicao
  from public.profiles p
  join public.titles t on t.id = p.title_id
  left join public.user_spells us
         on us.user_id = p.id
        and us.status = 'dominado'
        and us.mastered_at >= date_trunc('month', now())
  left join public.spells s on s.id = us.spell_id
  where p.show_in_ranking = true
    and p.nickname is not null
    and public.is_paying(p.id)                       -- só pagantes
  group by p.id, p.nickname, p.title_id, t.name, t.glyph;

-- Nota de segurança: a view NÃO expõe user_id nem e-mail.
-- Apenas nickname, grau e XP da janela — nada rastreável.


-- ───────────────────────────────────────────────────────────────────
-- 4. Acesso à view
--    Qualquer usuário autenticado E pagante pode ler o ranking.
--    (Views não têm RLS própria; controlamos via grant + security
--    barrier ou simplesmente checando is_paying no front + aqui.)
-- ───────────────────────────────────────────────────────────────────
create or replace function public.get_ranking_da_lua()
returns setof public.ranking_da_lua
language sql
stable
security definer set search_path = public
as $$
  select * from public.ranking_da_lua
  where public.is_paying(auth.uid())   -- só pagantes enxergam o ranking
  order by title_id desc, posicao asc;
$$;

-- No front-end: supabase.rpc('get_ranking_da_lua')


-- ───────────────────────────────────────────────────────────────────
-- 5. RPC para o usuário definir o próprio nickname + opt-in
--    (poderia ser um update direto, mas o RPC valida unicidade
--     com mensagem amigável)
-- ───────────────────────────────────────────────────────────────────
create or replace function public.set_ranking_identity(
  p_nickname text,
  p_show     boolean
)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
     set nickname        = p_nickname,
         show_in_ranking = p_show,
         updated_at      = now()
   where id = auth.uid();
  return 'ok';
exception
  when unique_violation then
    return 'nickname_em_uso';
  when check_violation then
    return 'nickname_invalido';
end;
$$;
