-- 032_quests_verificadas.sql
-- Quests que se verificam sozinhas, sem passar pela fila de revisao.
--
-- POR QUE UMA COLUNA NOVA E NAO UM VALOR NO ENUM quest_proof:
--   1. O Postgres nao permite usar um valor de enum recem-criado na
--      mesma transacao — inserir as quests logo apos o ALTER TYPE
--      falharia com "unsafe use of new value of enum type".
--   2. Conceitualmente sao eixos diferentes: proof_type diz o que o
--      USUARIO entrega (nada, foto, relato); auto_check diz o que o
--      SISTEMA confere. Uma quest pode ter os dois, ou so um.
--
-- COMO SE ENCAIXA NO QUE JA EXISTE:
--   * on_submission_insert ja aprovava sozinho quando proof_type era
--     'nenhuma'. Agora tambem aprova quando ha auto_check — mas so
--     depois de confirmar que a acao aconteceu de verdade.
--   * on_submission_approved continua creditando a moeda e aplicando
--     o teto de 60 por dia. Nao muda nada nele.
--   * O indice unico (user_id, quest_id, period_key) ja impede
--     reivindicar duas vezes no mesmo periodo.
--
-- A CHECAGEM FICA NO GATILHO, de proposito. Se ficasse numa funcao
-- chamada pelo front, bastaria inserir a submissao direto na tabela
-- para levar a moeda sem fazer nada.

alter table public.quests
  add column if not exists auto_check text;

comment on column public.quests.auto_check is
  'Regra que o banco confere sozinho. Nulo = quest comum, com revisao.';


-- ───────────────────────────────────────────────────────────────────
-- A janela vem da FREQUENCIA da quest, nao do period_key: diaria olha
-- desde o inicio do dia, semanal desde o inicio da semana, unica olha
-- a vida inteira. Assim a funcao nao depende do formato de period_key
-- que o front usa, que pode mudar.
-- Fuso de Sao Paulo, para o "hoje" do banco ser o mesmo do praticante.
-- ───────────────────────────────────────────────────────────────────
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
      select 1 from public.user_spells us
       where us.user_id = p_user
         and us.status = 'dominado'::spell_status
         and us.mastered_at >= v_desde)

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


-- ───────────────────────────────────────────────────────────────────
-- Gatilho de insercao: alem do caso 'nenhuma' que ja existia, agora
-- trata as quests com auto_check.
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
begin
  select proof_type, auto_check, frequency
    into v_proof, v_check, v_frequency
    from public.quests where id = new.quest_id;

  if v_check is not null then
    if not public.quest_auto_check_met(v_check, new.user_id, v_frequency) then
      raise exception 'condicao_nao_cumprida'
        using hint = 'A acao exigida por esta missao ainda nao foi registrada.';
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


-- ───────────────────────────────────────────────────────────────────
-- O Diario do mago deixa de ser revisado a mao: escrever no diario JA
-- e uma linha em spell_journal, entao o banco confere sozinho.
-- ───────────────────────────────────────────────────────────────────
update public.quests
   set proof_type = 'nenhuma',
       auto_check = 'diario_escrito'
 where slug = 'registro-diario';


-- ───────────────────────────────────────────────────────────────────
-- Seis missoes novas. Teto diario permanece em 60 moedas.
--   nenhuma diaria nova (total diario segue em 15)
--   semanais novas: 65  (total semanal passa a 135)
--   unicas: 100, uma vez na vida
--
-- Nao ha quest de recarregar servidor: recharge_servitor nao tem trava
-- nenhuma, entao bastaria tocar no botao para colher moeda sem pratica.
-- ───────────────────────────────────────────────────────────────────
insert into public.quests
  (slug, title, description, frequency, proof_type, auto_check,
   coin_reward, is_active, is_premium, sort_order)
values
  ('forja-acesa', 'Forja Acesa',
   'Forje um sigilo nesta semana.',
   'semanal', 'nenhuma', 'sigilo_forjado', 25, true, true, 40),

  ('nova-arte', 'Nova Arte',
   'Domine uma técnica nesta semana.',
   'semanal', 'nenhuma', 'tecnica_dominada', 30, true, false, 50),

  ('elo-do-circulo', 'Elo do Círculo',
   'Conclua uma troca de itens com um amigo nesta semana.',
   'semanal', 'nenhuma', 'troca_aceita', 10, true, false, 60),

  ('primeiro-servidor', 'O Primeiro Servidor',
   'Crie o seu primeiro servidor astral.',
   'unica', 'nenhuma', 'servidor_criado', 25, true, false, 70),

  ('companhia', 'Companhia',
   'Faça o seu primeiro elo de amizade no Círculo.',
   'unica', 'nenhuma', 'amizade_aceita', 15, true, false, 80),

  ('arsenal-do-mago', 'Arsenal do Mago',
   'Tenha um item equipado em todos os pontos do corpo ao mesmo tempo.',
   'unica', 'nenhuma', 'arsenal_completo', 60, true, false, 90)

on conflict (slug) do update set
  title       = excluded.title,
  description = excluded.description,
  frequency   = excluded.frequency,
  proof_type  = excluded.proof_type,
  auto_check  = excluded.auto_check,
  coin_reward = excluded.coin_reward,
  is_active   = excluded.is_active,
  is_premium  = excluded.is_premium,
  sort_order  = excluded.sort_order;
