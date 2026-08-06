-- 033_quests_premium_visivel.sql
-- Quests exclusivas do Circulo passam a aparecer SELADAS para quem nao
-- assina, em vez de sumir da lista -- mesmo padrao das outras areas
-- premium do app.
--
-- POR QUE MUDAR my_quests_today():
--   Ela filtrava as quests com is_premium fora da resposta pra quem
--   nao e pagante (004_quests_tesouro.sql). O front nunca recebia a
--   linha, entao so podia mostrar ou esconder a quest por completo --
--   nao tinha como desenhar o selo. Agora a funcao devolve TODAS as
--   quests ativas, com is_premium na resposta, e quem decide entre
--   selo ou botao de reivindicar e o front.
--
-- POR QUE TRAVAR TAMBEM NO GATILHO:
--   O filtro de my_quests_today() era a UNICA barreira contra um
--   nao-assinante reivindicar uma quest premium -- a policy de insert
--   em quest_submissions so confere auth.uid() = user_id, sem olhar
--   pra quest nenhuma. Tirando o filtro da funcao sem por nada no
--   lugar, bastaria conhecer o quest_id pra reivindicar "Forja Acesa"
--   sem assinar.
--
-- DOIS CUIDADOS NESTA VERSAO:
--
--   1. DROP OBRIGATORIO. O retorno ganha a coluna is_premium, e o
--      Postgres nao permite que "create or replace" mude a forma do
--      retorno (erro 42P13). Mesmo caso da my_servitors no adendo 012.
--
--   2. FUSO NO period_key. A versao anterior usava to_char(now(), ...)
--      com o fuso da sessao, que no Supabase e UTC. Das 21h de Brasilia
--      a meia-noite ja e o dia seguinte em UTC, entao uma quest diaria
--      ja reivindicada voltava a aparecer como disponivel; o usuario
--      clicava, o front mandava a chave calculada em horario local, e
--      batia no indice unico com erro sem explicacao. Agora a chave e
--      calculada no fuso de Sao Paulo, igual ao ranking.

drop function if exists public.my_quests_today();

create or replace function public.my_quests_today()
returns table (
  quest_id uuid, slug text, title text, description text,
  frequency quest_frequency, proof_type quest_proof,
  coin_reward integer, submission_status review_status,
  is_premium boolean
)
language sql stable security definer
set search_path = public
as $$
  select q.id, q.slug, q.title, q.description, q.frequency, q.proof_type,
         q.coin_reward, s.status, q.is_premium
    from public.quests q
    left join public.quest_submissions s
      on s.quest_id = q.id
     and s.user_id = auth.uid()
     and s.period_key = case q.frequency
           when 'diaria'
             then 'D' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')
           when 'semanal'
             then 'W' || to_char(now() at time zone 'America/Sao_Paulo', 'IYYY-IW')
           else 'U'
         end
   where q.is_active
   order by q.sort_order;
$$;


-- ───────────────────────────────────────────────────────────────────
-- Gatilho: acrescenta a checagem de premium antes das demais, no
-- mesmo formato de excecao com hint que auto_check ja usa.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.on_submission_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_proof      quest_proof;
  v_check      text;
  v_frequency  quest_frequency;
  v_premium    boolean;
begin
  select proof_type, auto_check, frequency, is_premium
    into v_proof, v_check, v_frequency, v_premium
    from public.quests where id = new.quest_id;

  if coalesce(v_premium, false) and not public.is_paying(new.user_id) then
    raise exception 'quest_exclusiva_circulo'
      using hint = 'Esta missão é exclusiva de assinantes do Círculo.';
  end if;

  if v_check is not null then
    if not public.quest_auto_check_met(v_check, new.user_id, v_frequency) then
      raise exception 'condicao_nao_cumprida'
        using hint = 'A ação exigida por esta missão ainda não foi registrada.';
    end if;
    new.status := 'aprovada';
    new.reviewed_at := now();

  elsif v_proof = 'nenhuma' then
    new.status := 'aprovada';
    new.reviewed_at := now();
  end if;

  return new;
end;
$$;
