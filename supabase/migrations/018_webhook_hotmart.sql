-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 018: suporte ao webhook Hotmart
-- Rode APÓS 001–017, e DEPOIS de conferir o PRE-CHECK_018.sql.
--
-- Versão revisada. Mudanças em relação ao rascunho original:
--   • if not exists em tabela e índices (script re-rodável)
--   • check ligando grant_kind ao payload obrigatório
--   • apply_pending_grants: cada linha da fila em subtransação
--     própria; unique_violation tratada como sucesso (é idempotência);
--     qualquer outro erro vira warning em vez de derrubar tudo
--   • handle_new_user: a chamada da fila não pode mais impedir o
--     cadastro do usuário
--
-- ⚠ ANTES DE RODAR: o item 5 troca o corpo INTEIRO de
--   handle_new_user. Rode a consulta 1 do PRE-CHECK e, se a versão
--   atual fizer mais do que inserir em profiles, traga essa lógica
--   para cá primeiro.
--
-- A lógica de evento (o que cada webhook faz) está em
-- 007_modelo_hibrido.sql, no comentário "LÓGICA DO WEBHOOK HOTMART".
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. IDEMPOTÊNCIA DE circle_passes: uma linha por transação, nunca
--    duas. grant_circle_pass() sempre insere; sem este índice, a
--    mesma transação chegando de novo (reentrega do Hotmart) somaria
--    +30 dias outra vez.
--
--    Consequência importante para o Worker: com o índice no lugar, a
--    reentrega não soma dias — ela levanta unique_violation (SQLSTATE
--    23505). O Worker precisa tratar 23505 como SUCESSO e devolver
--    200, senão o Hotmart vê erro e reentrega em loop.
-- ───────────────────────────────────────────────────────────────────
create unique index if not exists circle_passes_ref_id_key
  on public.circle_passes (ref_id)
  where ref_id is not null;

-- ───────────────────────────────────────────────────────────────────
-- 2. PENDING_GRANTS: concessão para um e-mail que ainda não tem conta
--    no app. Aplicada (via apply_pending_grants) no instante em que
--    essa pessoa se cadastra com o mesmo e-mail — pelo trigger
--    on_auth_user_created, que vem do 001 e NÃO é criado aqui.
--
--    grant_kind: 'entitlement' (grimoire_id preenchido) ou
--    'circle_pass' (days preenchido). O índice único usa um uuid
--    sentinela no lugar de NULL porque unique index trata NULL como
--    "sempre distinto" — sem isso, a mesma transação de assinatura
--    (sem grimoire_id) poderia enfileirar-se duas vezes.
-- ───────────────────────────────────────────────────────────────────
create table if not exists public.pending_grants (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  grant_kind  text not null check (grant_kind in ('entitlement', 'circle_pass')),
  grimoire_id uuid references public.grimoires(id) on delete cascade,
  source      text not null,
  ref_id      text not null,
  days        integer,
  applied_at  timestamptz,
  created_at  timestamptz default now(),
  -- Sem isto, um bug no Worker enfileira circle_pass com days NULL e
  -- o erro só aparece no cadastro da pessoa, longe da causa.
  constraint pending_grants_payload_ck check (
    (grant_kind = 'entitlement'  and grimoire_id is not null)
    or (grant_kind = 'circle_pass' and days is not null and days > 0)
  )
);

create index if not exists pending_grants_email_idx
  on public.pending_grants (lower(email))
  where applied_at is null;

create unique index if not exists pending_grants_ref_kind_key
  on public.pending_grants (
    ref_id,
    grant_kind,
    coalesce(grimoire_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

alter table public.pending_grants enable row level security;
-- Sem policies: nem anon nem authenticated leem ou escrevem aqui.
-- Só o service_role (que ignora RLS), usado exclusivamente pelo
-- webhook — e as funções security definer abaixo, que rodam como o
-- dono da tabela e por isso também não passam pela RLS.

-- ───────────────────────────────────────────────────────────────────
-- 3. find_user_by_email: ponte para auth.users, que o REST/PostgREST
--    não expõe. security definer permite ler auth.users mesmo com o
--    caller não tendo acesso direto ao schema.
--
--    É um oráculo de enumeração de e-mails — por isso o revoke do
--    item 6 não é opcional.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.find_user_by_email(p_email text)
returns uuid
language sql
stable
security definer set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

-- ───────────────────────────────────────────────────────────────────
-- 4. apply_pending_grants: aplica tudo que estava na fila para um
--    e-mail assim que o user_id passa a existir. Chamada pelo trigger
--    de novo cadastro (item 5) — não precisa ser chamada de fora.
--
--    Cada linha roda em subtransação própria (o begin/exception
--    interno). Motivo: esta função roda DENTRO da transação que
--    insere em auth.users. Sem isso, uma única linha problemática na
--    fila impede a pessoa de criar conta no app.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.apply_pending_grants(p_user uuid, p_email text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  r record;
begin
  if p_user is null or p_email is null then
    return;
  end if;

  for r in
    select * from public.pending_grants
     where lower(email) = lower(p_email) and applied_at is null
     order by created_at
  loop
    begin
      if r.grant_kind = 'entitlement' then
        insert into public.entitlements (user_id, grimoire_id, source)
        values (p_user, r.grimoire_id, r.source)
        on conflict (user_id, grimoire_id) do nothing;
      elsif r.grant_kind = 'circle_pass' then
        perform public.grant_circle_pass(p_user, r.source, r.ref_id,
                                         coalesce(r.days, 30));
      end if;

      update public.pending_grants set applied_at = now() where id = r.id;
    exception
      when unique_violation then
        -- Já concedido para esta transação (índice do item 1).
        -- Isso é o resultado desejado, não uma falha: marca e segue.
        update public.pending_grants set applied_at = now() where id = r.id;
      when others then
        -- Fica na fila com applied_at nulo para reprocessar depois.
        -- Ver a consulta de pendências no fim deste arquivo.
        raise warning 'pending_grant % (% / %) falhou: %',
          r.id, r.grant_kind, r.ref_id, sqlerrm;
    end;
  end loop;
end;
$$;

-- ───────────────────────────────────────────────────────────────────
-- 5. handle_new_user(): mesma função da 001_base.sql, só acrescenta a
--    chamada a apply_pending_grants no fim.
--
--    ⚠ COMPARE COM pg_get_functiondef ANTES DE RODAR (PRE-CHECK #1):
--    create or replace substitui o corpo inteiro. Se a versão atual
--    do banco também dá moedas iniciais, título ou settings, isso
--    precisa estar aqui — senão desaparece sem aviso, como aconteceu
--    com a view my_grimoires e o select g.*.
--
--    A chamada da fila está envolvida em begin/exception: concessão
--    de compra nunca deve poder bloquear a criação de conta. Se
--    falhar, o cadastro segue e a linha continua na fila.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Iniciado'));

  begin
    perform public.apply_pending_grants(new.id, new.email);
  exception when others then
    raise warning 'apply_pending_grants falhou no cadastro de %: %',
      new.id, sqlerrm;
  end;

  return new;
end;
$$;

-- ───────────────────────────────────────────────────────────────────
-- 6. TRAVA DE SEGURANÇA — por padrão do Postgres, toda função criada
--    com "create function" concede EXECUTE a PUBLIC (todo mundo) a
--    menos que se revogue explicitamente. grant_circle_pass nunca
--    teve esse revoke — ou seja, hoje qualquer usuário autenticado
--    pode chamar
--      supabase.rpc('grant_circle_pass', { p_user: '<uuid>', p_days: 99999 })
--    e conceder Círculo ilimitado a si mesmo (ou a qualquer um).
--
--    ⚠ DUAS CONFERÊNCIAS ANTES:
--    (a) revoke ... from public NÃO remove grant explícito para
--        authenticated ou anon. Se proacl (PRE-CHECK #3) mostrar
--        authenticated=X, descomente a linha correspondente abaixo.
--    (b) grep em grant_circle_pass no repo do app: feito — nenhum
--        front-end ou admin chama essa função hoje, só o Worker novo
--        e as próprias migrações SQL. Seguro revogar.
-- ───────────────────────────────────────────────────────────────────
revoke execute on function public.grant_circle_pass(uuid, text, text, integer) from public;
revoke execute on function public.grant_circle_pass(uuid, text, text, integer) from anon;
revoke execute on function public.grant_circle_pass(uuid, text, text, integer) from authenticated;
grant  execute on function public.grant_circle_pass(uuid, text, text, integer) to service_role;

revoke execute on function public.find_user_by_email(text) from public;
grant  execute on function public.find_user_by_email(text) to service_role;

revoke execute on function public.apply_pending_grants(uuid, text) from public;
grant  execute on function public.apply_pending_grants(uuid, text) to service_role;

-- ───────────────────────────────────────────────────────────────────
-- 7. VERIFICAÇÃO PÓS-MIGRAÇÃO (rode separado, não faz parte do DDL)
-- ───────────────────────────────────────────────────────────────────
-- Concessões que ficaram na fila sem aplicar — deve ser vazio em
-- operação normal. Rode de vez em quando depois de o webhook entrar
-- no ar; linha antiga aqui é dinheiro recebido sem entrega:
--
--   select id, email, grant_kind, source, ref_id, days, created_at
--     from public.pending_grants
--    where applied_at is null
--    order by created_at;
--
-- Para reaplicar uma linha depois de corrigir a causa:
--
--   select public.apply_pending_grants(
--     public.find_user_by_email('<email>'), '<email>');
