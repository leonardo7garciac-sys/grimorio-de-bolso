-- 048_dias_de_diario_em_my_collection.sql
-- Expõe o lastro de dias distintos de diário por técnica em my_collection(),
-- para o front antecipar o portão de domínio da 047 (3 dias distintos de
-- spell_journal) antes que o usuário esbarre nele.
--
-- journal_days conta o mesmo que o gatilho trg_user_spell_change: dias
-- civis distintos em America/Sao_Paulo com registro no diário daquela
-- técnica. Calculado para toda linha (não só catálogo) porque é barato e
-- o front decide onde exibir.
--
-- returns table ganhou coluna -- create or replace não basta (42P13).
drop function if exists public.my_collection();

create function public.my_collection()
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
  journal_count bigint,
  journal_days bigint
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
      where j.user_id = auth.uid() and j.spell_id = s.id),
    (select count(distinct (j.created_at at time zone 'America/Sao_Paulo')::date)
      from public.spell_journal j
      where j.user_id = auth.uid() and j.spell_id = s.id)
  from public.user_spells us
  join public.spells s on s.id = us.spell_id
  left join public.grimoires g on g.id = s.grimoire_id
  where us.user_id = auth.uid()
  order by g.sort_order nulls last, s.sort_order;
$$;
