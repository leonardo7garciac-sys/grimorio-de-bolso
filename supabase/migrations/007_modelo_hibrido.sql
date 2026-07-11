-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 007: Modelo Híbrido de Acesso
-- Rode APÓS 001–006.
--
-- MODELO DE NEGÓCIO:
--  • Compra única de e-book (Hotmart):
--      → entitlement PERMANENTE daquele grimório no app
--      → + Passe do Círculo por 1 mês (acesso a bestiário, acervo,
--        fórum, ranking, quests premium)
--  • Assinatura mensal (Hotmart recorrência):
--      → Passe do Círculo enquanto ativa (renova a cada ciclo)
--      → + acesso aos grimórios marcados subscriber_included = true
--        (os de menor valor) ENQUANTO o passe estiver ativo
--      → grimórios de alto valor continuam exigindo compra própria
--  • E-books comprados permanecem acessíveis para sempre no app,
--    independentemente do passe (espelha o acesso fora do app).
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. PASSES DO CÍRCULO (acesso premium com validade)
--    Uma linha por concessão; o acesso vale enquanto existir alguma
--    linha com expires_at no futuro. Histórico completo preservado.
--    source: 'compra_ebook' | 'assinatura' | 'cortesia_admin'
-- ───────────────────────────────────────────────────────────────────
create table if not exists public.circle_passes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  source      text not null,
  ref_id      text,                    -- id da transação/assinatura Hotmart
  starts_at   timestamptz not null default now(),
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

create index if not exists circle_passes_user_idx
  on public.circle_passes(user_id, expires_at desc);

alter table public.circle_passes enable row level security;
drop policy if exists "passes: dono le" on public.circle_passes;
create policy "passes: dono le" on public.circle_passes
  for select using (auth.uid() = user_id);
-- Escrita: apenas service_role (webhook Hotmart / admin).


-- ───────────────────────────────────────────────────────────────────
-- 2. REDEFINIR is_paying(): agora significa "membro ATIVO do Círculo"
--    Todas as RLS e views das migrações 002–006 que usam is_paying
--    passam a obedecer à validade automaticamente — zero retrabalho.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.is_paying(p_user uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.circle_passes
     where user_id = p_user
       and expires_at > now()
  );
$$;

-- RPC de conveniência: quando expira o passe atual (para exibir
-- "Círculo ativo até 12/08" no perfil). NULL = sem passe ativo.
create or replace function public.my_circle_expiry()
returns timestamptz
language sql stable
security definer set search_path = public
as $$
  select max(expires_at) from public.circle_passes
   where user_id = auth.uid() and expires_at > now();
$$;


-- ───────────────────────────────────────────────────────────────────
-- 3. GRIMÓRIOS: marcação "incluído na assinatura"
--    true  → assinante ativo acessa sem comprar (e-books de menor valor)
--    false → exige entitlement próprio mesmo assinando (alto valor)
-- ───────────────────────────────────────────────────────────────────
alter table public.grimoires
  add column if not exists subscriber_included boolean not null default false;

-- Exemplo com o seed (ajuste conforme teu catálogo real):
-- update public.grimoires set subscriber_included = true
--  where slug in ('fogo-interior', 'sigilos');


-- ───────────────────────────────────────────────────────────────────
-- 4. VIEW my_grimoires: nova lógica de acesso em três portas
--    (substitui a versão da 001)
--    Porta 1: grimório gratuito → todos
--    Porta 2: entitlement próprio → acesso permanente (comprou)
--    Porta 3: assinante ativo + subscriber_included → enquanto assinar
--
--    NOTA: drop obrigatório — a tabela grimoires ganhou coluna nova,
--    então a estrutura da view muda e o "or replace" não basta.
-- ───────────────────────────────────────────────────────────────────
drop view if exists public.my_grimoires;

create view public.my_grimoires as
  select
    g.*,
    (
      not g.is_premium
      or exists (
        select 1 from public.entitlements e
         where e.user_id = auth.uid()
           and e.grimoire_id = g.id
      )
      or (g.subscriber_included and public.is_paying(auth.uid()))
    ) as has_access
  from public.grimoires g
  order by g.sort_order;


-- ───────────────────────────────────────────────────────────────────
-- 5. FUNÇÃO PARA O WEBHOOK: conceder/estender passe do Círculo
--    Chamada pelo webhook (service_role) a cada evento Hotmart.
--    Estende a partir do maior expires_at futuro (renovações somam,
--    não sobrepõem) ou de now() se não houver passe ativo.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.grant_circle_pass(
  p_user   uuid,
  p_source text,
  p_ref    text default null,
  p_days   integer default 30
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_base timestamptz;
  v_id   uuid;
begin
  select greatest(coalesce(max(expires_at), now()), now())
    into v_base
    from public.circle_passes
   where user_id = p_user;

  insert into public.circle_passes (user_id, source, ref_id, starts_at, expires_at)
  values (p_user, p_source, p_ref, now(), v_base + make_interval(days => p_days))
  returning id into v_id;

  return v_id;
end;
$$;

-- ───────────────────────────────────────────────────────────────────
-- LÓGICA DO WEBHOOK HOTMART (referência para a Etapa 5 — Cloudflare
-- Worker com service_role; NÃO é SQL, apenas o mapa de eventos):
--
--  COMPRA ÚNICA aprovada (e-book X):
--    1. insert into entitlements (user, grimoire_X)      [permanente]
--    2. select grant_circle_pass(user, 'compra_ebook', tx, 30)
--
--  ASSINATURA aprovada / renovada:
--    1. select grant_circle_pass(user, 'assinatura', sub_id, 30)
--       (a cada ciclo de cobrança aprovado, o Hotmart dispara o
--        evento e o passe se estende +30 dias)
--
--  ASSINATURA cancelada / inadimplente:
--    → NENHUMA ação necessária: o passe simplesmente não é renovado
--      e expira sozinho. Sem lógica de revogação = sem bugs de
--      revogação. Entitlements de compras nunca são tocados.
--
--  REEMBOLSO de compra única (opcional, política tua):
--    → delete do entitlement correspondente via service_role.
-- ───────────────────────────────────────────────────────────────────
