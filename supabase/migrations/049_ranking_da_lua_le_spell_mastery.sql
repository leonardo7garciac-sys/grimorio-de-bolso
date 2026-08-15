-- 049_ranking_da_lua_le_spell_mastery.sql
-- Duas leituras de user_spells.mastered_at ficaram desalinhadas com a 047:
-- o gatilho recarimba essa coluna toda vez que o status volta a
-- 'dominado', mesmo em remarcação de uma técnica já dominada antes (cujo
-- XP real, em spell_mastery, não muda). spell_mastery.mastered_at é o
-- carimbo imutável -- grava uma vez, índice único (user_id, spell_id),
-- "on conflict do nothing". Trocar a fonte fecha a brecha de recarimbo
-- nos dois lugares que dependiam da janela de tempo em user_spells.

-- ══════════════════════════════════════════════════════════════
-- 1. ranking_da_lua: xp_dominio somava xp_reward de user_spells;
--    alternar o status (ou destrackear/retrackear) reencaixava a mesma
--    técnica na janela rolante de 30 dias sem prática nova, inflando o
--    ranking. Mesma lista, ordem e tipos de coluna de antes -- não é
--    coluna nova nem renomeada, create or replace view aceita.
-- ══════════════════════════════════════════════════════════════
create or replace view public.ranking_da_lua as
with base as (
  select
    p.id,
    p.nickname,
    p.title_id,
    t.name  as title_name,
    t.glyph as title_glyph,
    coalesce((
      select sum(m.xp_awarded)
        from spell_mastery m
       where m.user_id = p.id
         and m.mastered_at >= now() - interval '30 days'
    ), 0) as xp_dominio,
    coalesce((
      select count(distinct date(j.created_at at time zone 'America/Sao_Paulo'))
        from spell_journal j
       where j.user_id = p.id
         and j.created_at >= now() - interval '30 days'
    ), 0) as dias_praticados
  from profiles p
  join titles t on t.id = p.title_id
  where p.show_in_ranking = true
    and p.nickname is not null
    and is_paying(p.id)
)
select
  nickname,
  title_id,
  title_name,
  title_glyph,
  (xp_dominio + dias_praticados * 4)::integer as xp_lua,
  rank() over (order by (xp_dominio + dias_praticados * 4) desc) as posicao,
  xp_dominio::integer,
  dias_praticados::integer
from base;

-- ══════════════════════════════════════════════════════════════
-- 2. quest_auto_check_met('tecnica_dominada', ...): mesma vulnerabilidade
--    de recarimbo, e esta concede moeda (quest semanal "Nova Arte", 30).
--    Além do recarimbo, o check de user_spells não distinguia técnica do
--    catálogo de técnica pessoal -- pessoal chega a 'dominado' sem
--    lastro nem teto (o portão da 047 só vale quando spells.owner_id is
--    null), então a quest era completável de graça com uma técnica
--    forjada na hora. spell_mastery só recebe linha quando owner_id is
--    null (047, bloco "O portão vale só para o catálogo Baltazar"), então
--    trocar a fonte fecha as duas coisas de uma vez: sem recarimbo (o
--    índice único mantém mastered_at fixo no primeiro domínio) e sem
--    técnica pessoal.
--    A janela continua vinda de v_desde (frequência da quest), sem
--    mudança ali -- só troca a tabela lida por baixo.
-- ══════════════════════════════════════════════════════════════
create or replace function public.quest_auto_check_met(
  p_check text,
  p_user uuid,
  p_frequency quest_frequency
)
returns boolean
language plpgsql stable
security definer set search_path = public
as $$
declare
  v_tz    text := 'America/Sao_Paulo';
  v_desde timestamptz;
begin
  v_desde := case p_frequency
    when 'diaria'  then (date_trunc('day',  now() at time zone v_tz)) at time zone v_tz
    when 'semanal' then (date_trunc('week', now() at time zone v_tz)) at time zone v_tz
    else '-infinity'::timestamptz
  end;

  return case p_check

    when 'servidor_criado' then exists (
      select 1 from public.servitors s
       where s.user_id = p_user and s.created_at >= v_desde)

    when 'diario_escrito' then exists (
      select 1 from public.spell_journal j
       where j.user_id = p_user and j.created_at >= v_desde)

    when 'sigilo_forjado' then exists (
      select 1 from public.sigils g
       where g.user_id = p_user and g.created_at >= v_desde)

    when 'tecnica_dominada' then exists (
      select 1 from public.spell_mastery m
       where m.user_id = p_user
         and m.mastered_at >= v_desde)

    when 'troca_aceita' then exists (
      select 1 from public.item_trades t
       where t.status = 'aceita'
         and t.resolved_at >= v_desde
         and p_user in (t.proposer_id, t.recipient_id))

    when 'amizade_aceita' then exists (
      select 1 from public.friendships f
       where f.status = 'aceita'
         and f.responded_at >= v_desde
         and p_user in (f.requester_id, f.addressee_id))

    -- item equipado em todos os cinco pontos do corpo ao mesmo tempo.
    -- A mao conta uma vez so, mesmo com duas armas empunhadas.
    when 'arsenal_completo' then (
      select count(distinct si.slot) >= 5
        from public.user_items ui
        join public.shop_items si on si.id = ui.item_id
       where ui.user_id = p_user and ui.equipped and si.slot is not null)

    else false
  end;
end;
$$;
