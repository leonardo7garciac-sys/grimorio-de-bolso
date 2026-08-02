-- 022_ranking_global_rolante.sql
-- Tres mudancas na view ranking_da_lua, decididas em 02/ago:
--
--  1. GLOBAL em vez de segmentado por grau. O rank() tinha
--     PARTITION BY p.title_id, o que dava a cada titulo a sua propria
--     classificacao. O app esta comecando e nao ha gente suficiente
--     para justificar segmentar.
--
--  2. JANELA ROLANTE DE 30 DIAS em vez do mes corrente. Com
--     date_trunc('month', now()) todo mundo zerava no dia 1o; com a
--     janela rolante a colocacao decai aos poucos, conforme os dias
--     antigos saem da conta, em vez de cair de golpe.
--
--  3. CONSTANCIA ENTRA NA CONTA. Antes o XP vinha so de dominar
--     tecnicas, entao quem praticava todo dia marcava zero ate o dia
--     do dominio. Agora soma-se tambem 4 pontos por DIA DISTINTO com
--     registro no diario. Dia distinto, nao entrada: escrever cinco
--     vezes no mesmo dia vale o mesmo que escrever uma, entao nao ha
--     como forcar a barra nem vantagem em praticar em excesso.
--
--     Regua: a tecnica media vale 30 de xp_reward (min 0, max 70).
--     30 dias praticados = 120 pontos, cerca de quatro dominios.
--     Para dar mais ou menos peso a presenca, mude o 4 abaixo.
--
-- As colunas antigas foram preservadas com os mesmos nomes E NA MESMA
-- ORDEM, entao o front continua funcionando. xp_dominio e
-- dias_praticados foram acrescentadas NO FIM, uteis para a tela
-- mostrar de onde vem a pontuacao.
--
-- A ordem importa: create or replace view so aceita colunas novas no
-- final. Inserir uma coluna no meio faz o Postgres ler aquilo como
-- renomeacao da coluna que ocupava a posicao e recusar com
-- "cannot change name of view column".
--
-- Nota: as somas usam subconsultas em vez de joins de proposito.
-- Dois LEFT JOIN para tabelas um-para-muitos multiplicariam as linhas
-- e inflariam o sum(xp_reward) pelo numero de dias de diario.

create or replace view public.ranking_da_lua as
with base as (
  select
    p.id,
    p.nickname,
    p.title_id,
    t.name  as title_name,
    t.glyph as title_glyph,
    coalesce((
      select sum(s.xp_reward)
        from user_spells us
        join spells s on s.id = us.spell_id
       where us.user_id = p.id
         and us.status = 'dominado'::spell_status
         and us.mastered_at >= now() - interval '30 days'
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
