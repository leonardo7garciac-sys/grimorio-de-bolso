-- 026_webhook_events.sql
-- Diario de bordo dos webhooks recebidos da Hotmart.
--
-- Hoje o Worker sempre responde 200 (correto: erro faz a Hotmart
-- desativar a configuracao inteira) mas nao guarda nada. Se o
-- processamento falha, o evento existe so no console.error do
-- Cloudflare — sem fila, sem reprocessamento, sem ninguem saber que
-- alguem pagou e nao recebeu acesso.
--
-- Com esta tabela o Worker passa a: gravar o payload cru ANTES de
-- processar, responder 200 na hora, e marcar processed_at no fim. O
-- que falhar fica visivel em uma consulta e pode ser reprocessado —
-- e reprocessar e seguro, porque a idempotencia ja esta garantida
-- pelos indices unicos de circle_passes e pending_grants (018).

create table if not exists public.webhook_events (
  id              uuid primary key default gen_random_uuid(),
  source          text not null default 'hotmart',
  event           text,
  transaction_ref text,
  buyer_email     text,
  payload         jsonb not null,
  received_at     timestamptz not null default now(),
  processed_at    timestamptz,
  attempts        smallint not null default 0,
  error           text
);

-- indice parcial: a consulta que importa e "o que ainda nao processou"
create index if not exists webhook_events_pendentes_idx
  on public.webhook_events (received_at desc)
  where processed_at is null;

create index if not exists webhook_events_ref_idx
  on public.webhook_events (transaction_ref);

-- O payload traz e-mail do comprador e dados de transacao. RLS ligada
-- SEM nenhuma policy: ninguem le pelo app, so a service_role (Worker e
-- painel admin).
alter table public.webhook_events enable row level security;

comment on table public.webhook_events is
  'Payload cru de cada webhook recebido. processed_at nulo = falhou ou ainda nao rodou.';
