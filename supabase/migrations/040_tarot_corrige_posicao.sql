-- 040_tarot_corrige_posicao.sql
-- Conserta a numeracao das posicoes em draw_tarot.
--
-- O BUG: a versao anterior fazia
--
--     select t.slug, row_number() over () as pos
--       from tarot_cards t
--      where t.upright is not null
--      order by random()
--      limit v_qtd
--
-- e funcoes de janela sao avaliadas ANTES do order by e do limit. Ou
-- seja: o Postgres numerava as 22 cartas de 1 a 22 na ordem em que as
-- lia, depois embaralhava, depois cortava. As tres cartas de uma
-- tiragem saiam com posicoes como 17, 3 e 9 — que nunca casam com
-- tarot_positions, onde as posicoes de 'tres' sao 1, 2 e 3.
--
-- Na Cruz Celta o efeito era intermitente: dez numeros sorteados entre
-- 1 e 22 as vezes caem no intervalo 1-10 e casam por acaso. Nao havia
-- limite na quarta carta; era coincidencia do sorteio testado.
--
-- A CORRECAO: numerar depois de escolher. A CTE sorteia e corta; a
-- segunda numera o que sobrou, de 1 ate a quantidade da tiragem.
--
-- `as materialized` e proposital: sem isso o Postgres pode embutir a
-- CTE na consulta de fora e reavaliar o random() de cada linha, o que
-- desfaria a ordem que acabou de ser sorteada.

create or replace function public.draw_tarot(
  p_spread tarot_spread,
  p_question text default null
)
returns table (
  reading_id uuid,
  slug text,
  name text,
  reversed boolean,
  posicao smallint,
  image_path text
)
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_qtd    smallint;
  v_disp   smallint;
  v_period text;
  v_cards  jsonb;
  v_id     uuid;
begin
  if v_uid is null then
    raise exception 'nao_autenticado';
  end if;

  v_qtd := case p_spread
    when 'uma' then 1 when 'tres' then 3 else 10 end;

  select count(*) into v_disp
    from public.tarot_cards where upright is not null;

  if v_disp < v_qtd then
    raise exception 'baralho_incompleto'
      using hint = 'Ainda não há cartas escritas o bastante para esta tiragem.';
  end if;

  v_period := case when p_spread = 'uma'
    then 'D' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')
    else null end;

  with sorteadas as materialized (
    select t.slug, random() as ordem
      from public.tarot_cards t
     where t.upright is not null
     order by ordem
     limit v_qtd
  ), numeradas as (
    select s.slug,
           (row_number() over (order by s.ordem))::smallint as pos
      from sorteadas s
  )
  select jsonb_agg(jsonb_build_object(
           'slug', n.slug,
           'reversed', random() < 0.4,
           'position', n.pos)
         order by n.pos)
    into v_cards
    from numeradas n;

  insert into public.tarot_readings (user_id, spread, question, cards, period_key)
  values (v_uid, p_spread, nullif(btrim(coalesce(p_question, '')), ''), v_cards, v_period)
  returning id into v_id;

  return query
    select v_id,
           t.slug, t.name,
           (e->>'reversed')::boolean,
           (e->>'position')::smallint,
           t.image_path
      from jsonb_array_elements(v_cards) e
      join public.tarot_cards t on t.slug = e->>'slug'
     order by (e->>'position')::smallint;
end;
$fn$;


-- As tiragens ja feitas em teste guardam posicoes erradas no jsonb e
-- nao tem como serem exibidas certas. Se quiser limpar o historico de
-- teste antes de seguir, rode isto separadamente:
--
--   delete from public.tarot_readings;
