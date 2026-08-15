-- 050_dominios_por_grimorio.sql
-- RPC para o cabeçalho "X/Y dominadas" de cada grimório em GrimoriosTab:
-- numerador e denominador vêm os dois do catálogo, não da coleção
-- rastreada pelo usuário.
--
-- dominadas: spell_mastery (histórico permanente, 047) — não cai quando o
-- usuário destrackeia a técnica.
-- total: TODAS as técnicas do catálogo daquele grimório (spells com
-- owner_id is null), não só as que o usuário rastreia. "2 de 31" informa
-- o tamanho do caminho; "2 de 2" (rastreadas) não dizia nada — e como
-- dominadas é sempre um subconjunto do catálogo do grimório, o numerador
-- nunca ultrapassa o denominador.
--
-- Parte de spells (não de spell_mastery) via left join, por isso um
-- grimório com zero domínios ainda aparece na resposta com dominadas = 0 —
-- se partisse de spell_mastery, sumiria da lista.
--
-- left join é 1-para-no-máximo-1 aqui: spell_mastery tem índice único em
-- (user_id, spell_id), então para um auth.uid() fixo cada spell casa com
-- no máximo uma linha — count(*) não sofre fan-out.
--
-- owner_id is null exclui prática pessoal dos dois lados: ela nunca entra
-- em spells por essa condição, e nunca teria linha em spell_mastery de
-- qualquer forma (047, "o portão vale só para o catálogo Baltazar").

create or replace function public.my_mastery_counts()
returns table (
  grimoire_id uuid,
  dominadas   bigint,
  total       bigint
)
language sql stable
security definer set search_path = public
as $$
  select
    s.grimoire_id,
    count(*) filter (where m.id is not null) as dominadas,
    count(*) as total
  from public.spells s
  left join public.spell_mastery m
    on m.spell_id = s.id and m.user_id = auth.uid()
  where s.owner_id is null
  group by s.grimoire_id;
$$;
