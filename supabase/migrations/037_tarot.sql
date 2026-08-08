-- 037_tarot.sql
-- Tarot na Forja. Primeira etapa: estrutura, o baralho de 78 cartas e o
-- sorteio no servidor.
--
-- DECISOES DE PROJETO:
--
--  * O SORTEIO ACONTECE NO BANCO, nunca no navegador. Se fosse no
--    front, bastaria recarregar a pagina ate sair uma carta que
--    agradasse. A tradicao diz que nao se refaz uma leitura, e aqui o
--    app faz a tradicao valer.
--
--  * A PERGUNTA E GRAVADA, ao contrario do intento do sigilo. Sao
--    praticas opostas: no sigilo a tradicao manda esquecer o desejo; no
--    tarot, manda anotar a pergunta, senao reler a tiragem meses depois
--    nao significa nada.
--
--  * A CARTA DO DIA E GRATUITA e vale ate a meia-noite. O indice unico
--    parcial garante uma por dia por usuario. As tiragens maiores
--    exigem passe do Circulo, conferido na propria policy de insert.
--
--  * Arte: Rider-Waite-Smith de 1909, dominio publico no Brasil desde
--    2022 (Pamela Colman Smith morreu em 1951). image_path aponta para
--    o bucket `tarot`.

create type tarot_arcana as enum ('maior', 'menor');
create type tarot_suit   as enum ('paus', 'copas', 'espadas', 'ouros');
create type tarot_spread as enum ('uma', 'tres', 'cruz_celta');


-- ───────────────────────────────────────────────────────────────────
-- O BARALHO
-- upright e reversed comecam nulos: sao o trabalho de escrita, que
-- entra depois, carta a carta, sem mexer nesta estrutura.
-- ───────────────────────────────────────────────────────────────────
create table public.tarot_cards (
  slug        text primary key,
  name        text not null,
  arcana      tarot_arcana not null,
  suit        tarot_suit,            -- nulo nos arcanos maiores
  number      smallint not null,
  image_path  text,
  upright     text,
  reversed    text,
  sort_order  smallint not null
);

alter table public.tarot_cards enable row level security;
create policy "tarot cartas: autenticados leem" on public.tarot_cards
  for select using (auth.uid() is not null);

insert into public.tarot_cards
  (slug, name, arcana, suit, number, image_path, sort_order)
values
  ('o-louco', 'O Louco', 'maior', null, 0, 'o-louco.webp', 0),
  ('o-mago', 'O Mago', 'maior', null, 1, 'o-mago.webp', 1),
  ('a-sacerdotisa', 'A Sacerdotisa', 'maior', null, 2, 'a-sacerdotisa.webp', 2),
  ('a-imperatriz', 'A Imperatriz', 'maior', null, 3, 'a-imperatriz.webp', 3),
  ('o-imperador', 'O Imperador', 'maior', null, 4, 'o-imperador.webp', 4),
  ('o-hierofante', 'O Hierofante', 'maior', null, 5, 'o-hierofante.webp', 5),
  ('os-amantes', 'Os Amantes', 'maior', null, 6, 'os-amantes.webp', 6),
  ('o-carro', 'O Carro', 'maior', null, 7, 'o-carro.webp', 7),
  ('a-forca', 'A Força', 'maior', null, 8, 'a-forca.webp', 8),
  ('o-eremita', 'O Eremita', 'maior', null, 9, 'o-eremita.webp', 9),
  ('a-roda-da-fortuna', 'A Roda da Fortuna', 'maior', null, 10, 'a-roda-da-fortuna.webp', 10),
  ('a-justica', 'A Justiça', 'maior', null, 11, 'a-justica.webp', 11),
  ('o-enforcado', 'O Enforcado', 'maior', null, 12, 'o-enforcado.webp', 12),
  ('a-morte', 'A Morte', 'maior', null, 13, 'a-morte.webp', 13),
  ('a-temperanca', 'A Temperança', 'maior', null, 14, 'a-temperanca.webp', 14),
  ('o-diabo', 'O Diabo', 'maior', null, 15, 'o-diabo.webp', 15),
  ('a-torre', 'A Torre', 'maior', null, 16, 'a-torre.webp', 16),
  ('a-estrela', 'A Estrela', 'maior', null, 17, 'a-estrela.webp', 17),
  ('a-lua', 'A Lua', 'maior', null, 18, 'a-lua.webp', 18),
  ('o-sol', 'O Sol', 'maior', null, 19, 'o-sol.webp', 19),
  ('o-julgamento', 'O Julgamento', 'maior', null, 20, 'o-julgamento.webp', 20),
  ('o-mundo', 'O Mundo', 'maior', null, 21, 'o-mundo.webp', 21),
  ('as-de-paus', 'Ás de Paus', 'menor', 'paus', 1, 'as-de-paus.webp', 101),
  ('dois-de-paus', 'Dois de Paus', 'menor', 'paus', 2, 'dois-de-paus.webp', 102),
  ('tres-de-paus', 'Três de Paus', 'menor', 'paus', 3, 'tres-de-paus.webp', 103),
  ('quatro-de-paus', 'Quatro de Paus', 'menor', 'paus', 4, 'quatro-de-paus.webp', 104),
  ('cinco-de-paus', 'Cinco de Paus', 'menor', 'paus', 5, 'cinco-de-paus.webp', 105),
  ('seis-de-paus', 'Seis de Paus', 'menor', 'paus', 6, 'seis-de-paus.webp', 106),
  ('sete-de-paus', 'Sete de Paus', 'menor', 'paus', 7, 'sete-de-paus.webp', 107),
  ('oito-de-paus', 'Oito de Paus', 'menor', 'paus', 8, 'oito-de-paus.webp', 108),
  ('nove-de-paus', 'Nove de Paus', 'menor', 'paus', 9, 'nove-de-paus.webp', 109),
  ('dez-de-paus', 'Dez de Paus', 'menor', 'paus', 10, 'dez-de-paus.webp', 110),
  ('valete-de-paus', 'Valete de Paus', 'menor', 'paus', 11, 'valete-de-paus.webp', 111),
  ('cavaleiro-de-paus', 'Cavaleiro de Paus', 'menor', 'paus', 12, 'cavaleiro-de-paus.webp', 112),
  ('rainha-de-paus', 'Rainha de Paus', 'menor', 'paus', 13, 'rainha-de-paus.webp', 113),
  ('rei-de-paus', 'Rei de Paus', 'menor', 'paus', 14, 'rei-de-paus.webp', 114),
  ('as-de-copas', 'Ás de Copas', 'menor', 'copas', 1, 'as-de-copas.webp', 121),
  ('dois-de-copas', 'Dois de Copas', 'menor', 'copas', 2, 'dois-de-copas.webp', 122),
  ('tres-de-copas', 'Três de Copas', 'menor', 'copas', 3, 'tres-de-copas.webp', 123),
  ('quatro-de-copas', 'Quatro de Copas', 'menor', 'copas', 4, 'quatro-de-copas.webp', 124),
  ('cinco-de-copas', 'Cinco de Copas', 'menor', 'copas', 5, 'cinco-de-copas.webp', 125),
  ('seis-de-copas', 'Seis de Copas', 'menor', 'copas', 6, 'seis-de-copas.webp', 126),
  ('sete-de-copas', 'Sete de Copas', 'menor', 'copas', 7, 'sete-de-copas.webp', 127),
  ('oito-de-copas', 'Oito de Copas', 'menor', 'copas', 8, 'oito-de-copas.webp', 128),
  ('nove-de-copas', 'Nove de Copas', 'menor', 'copas', 9, 'nove-de-copas.webp', 129),
  ('dez-de-copas', 'Dez de Copas', 'menor', 'copas', 10, 'dez-de-copas.webp', 130),
  ('valete-de-copas', 'Valete de Copas', 'menor', 'copas', 11, 'valete-de-copas.webp', 131),
  ('cavaleiro-de-copas', 'Cavaleiro de Copas', 'menor', 'copas', 12, 'cavaleiro-de-copas.webp', 132),
  ('rainha-de-copas', 'Rainha de Copas', 'menor', 'copas', 13, 'rainha-de-copas.webp', 133),
  ('rei-de-copas', 'Rei de Copas', 'menor', 'copas', 14, 'rei-de-copas.webp', 134),
  ('as-de-espadas', 'Ás de Espadas', 'menor', 'espadas', 1, 'as-de-espadas.webp', 141),
  ('dois-de-espadas', 'Dois de Espadas', 'menor', 'espadas', 2, 'dois-de-espadas.webp', 142),
  ('tres-de-espadas', 'Três de Espadas', 'menor', 'espadas', 3, 'tres-de-espadas.webp', 143),
  ('quatro-de-espadas', 'Quatro de Espadas', 'menor', 'espadas', 4, 'quatro-de-espadas.webp', 144),
  ('cinco-de-espadas', 'Cinco de Espadas', 'menor', 'espadas', 5, 'cinco-de-espadas.webp', 145),
  ('seis-de-espadas', 'Seis de Espadas', 'menor', 'espadas', 6, 'seis-de-espadas.webp', 146),
  ('sete-de-espadas', 'Sete de Espadas', 'menor', 'espadas', 7, 'sete-de-espadas.webp', 147),
  ('oito-de-espadas', 'Oito de Espadas', 'menor', 'espadas', 8, 'oito-de-espadas.webp', 148),
  ('nove-de-espadas', 'Nove de Espadas', 'menor', 'espadas', 9, 'nove-de-espadas.webp', 149),
  ('dez-de-espadas', 'Dez de Espadas', 'menor', 'espadas', 10, 'dez-de-espadas.webp', 150),
  ('valete-de-espadas', 'Valete de Espadas', 'menor', 'espadas', 11, 'valete-de-espadas.webp', 151),
  ('cavaleiro-de-espadas', 'Cavaleiro de Espadas', 'menor', 'espadas', 12, 'cavaleiro-de-espadas.webp', 152),
  ('rainha-de-espadas', 'Rainha de Espadas', 'menor', 'espadas', 13, 'rainha-de-espadas.webp', 153),
  ('rei-de-espadas', 'Rei de Espadas', 'menor', 'espadas', 14, 'rei-de-espadas.webp', 154),
  ('as-de-ouros', 'Ás de Ouros', 'menor', 'ouros', 1, 'as-de-ouros.webp', 161),
  ('dois-de-ouros', 'Dois de Ouros', 'menor', 'ouros', 2, 'dois-de-ouros.webp', 162),
  ('tres-de-ouros', 'Três de Ouros', 'menor', 'ouros', 3, 'tres-de-ouros.webp', 163),
  ('quatro-de-ouros', 'Quatro de Ouros', 'menor', 'ouros', 4, 'quatro-de-ouros.webp', 164),
  ('cinco-de-ouros', 'Cinco de Ouros', 'menor', 'ouros', 5, 'cinco-de-ouros.webp', 165),
  ('seis-de-ouros', 'Seis de Ouros', 'menor', 'ouros', 6, 'seis-de-ouros.webp', 166),
  ('sete-de-ouros', 'Sete de Ouros', 'menor', 'ouros', 7, 'sete-de-ouros.webp', 167),
  ('oito-de-ouros', 'Oito de Ouros', 'menor', 'ouros', 8, 'oito-de-ouros.webp', 168),
  ('nove-de-ouros', 'Nove de Ouros', 'menor', 'ouros', 9, 'nove-de-ouros.webp', 169),
  ('dez-de-ouros', 'Dez de Ouros', 'menor', 'ouros', 10, 'dez-de-ouros.webp', 170),
  ('valete-de-ouros', 'Valete de Ouros', 'menor', 'ouros', 11, 'valete-de-ouros.webp', 171),
  ('cavaleiro-de-ouros', 'Cavaleiro de Ouros', 'menor', 'ouros', 12, 'cavaleiro-de-ouros.webp', 172),
  ('rainha-de-ouros', 'Rainha de Ouros', 'menor', 'ouros', 13, 'rainha-de-ouros.webp', 173),
  ('rei-de-ouros', 'Rei de Ouros', 'menor', 'ouros', 14, 'rei-de-ouros.webp', 174);


-- ───────────────────────────────────────────────────────────────────
-- AS TIRAGENS
-- ───────────────────────────────────────────────────────────────────
create table public.tarot_readings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  spread      tarot_spread not null,
  question    text check (char_length(question) <= 500),
  cards       jsonb not null,   -- [{slug, reversed, position}]
  period_key  text,             -- 'D2026-08-07' na carta do dia
  note        text,             -- anotacao do praticante, escrita depois
  created_at  timestamptz not null default now()
);

create index tarot_readings_user_idx
  on public.tarot_readings(user_id, created_at desc);

-- uma carta do dia por usuario por dia
create unique index tarot_readings_dia_idx
  on public.tarot_readings(user_id, period_key)
  where spread = 'uma';

alter table public.tarot_readings enable row level security;

create policy "tiragens: dono le" on public.tarot_readings
  for select using (auth.uid() = user_id);

-- anotar depois e do dono, pagante ou nao
create policy "tiragens: dono anota" on public.tarot_readings
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tiragens: dono apaga" on public.tarot_readings
  for delete using (auth.uid() = user_id);

-- carta do dia e livre; tiragens maiores exigem o Circulo
create policy "tiragens: sorteia" on public.tarot_readings
  for insert with check (
    auth.uid() = user_id
    and (spread = 'uma' or public.is_paying(auth.uid()))
  );


-- ───────────────────────────────────────────────────────────────────
-- O SORTEIO
-- Escolhe as cartas, decide invertida ou nao, grava e devolve. Como e
-- o banco quem sorteia, nao ha como repetir ate gostar do resultado.
-- ───────────────────────────────────────────────────────────────────
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
  v_period text;
  v_cards  jsonb;
  v_id     uuid;
begin
  if v_uid is null then
    raise exception 'nao_autenticado';
  end if;

  v_qtd := case p_spread
    when 'uma' then 1 when 'tres' then 3 else 10 end;

  -- a chave do dia usa o fuso de Sao Paulo, para o "hoje" do banco ser
  -- o mesmo do praticante
  v_period := case when p_spread = 'uma'
    then 'D' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')
    else null end;

  select jsonb_agg(jsonb_build_object(
           'slug', c.slug,
           'reversed', random() < 0.4,
           'position', c.pos))
    into v_cards
    from (
      select t.slug, row_number() over ()::smallint as pos
        from public.tarot_cards t
       order by random()
       limit v_qtd
    ) c;

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

revoke all on function public.draw_tarot(tarot_spread, text) from public, anon;
grant execute on function public.draw_tarot(tarot_spread, text) to authenticated;
