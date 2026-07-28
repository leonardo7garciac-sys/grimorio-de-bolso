-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 017: checkout_url em my_grimoires
-- Rode APÓS 001–016.
--
-- 016 assumiu que "select g.*" em my_grimoires reexporia a coluna
-- nova automaticamente. Errado: no Postgres, "*" é expandido na
-- lista de colunas no momento em que a view é criada, e essa lista
-- fica congelada — my_grimoires nunca devolveu checkout_url, e por
-- isso o botão de compra não aparecia no front.
--
-- Definição abaixo reproduz exatamente o pg_get_viewdef() atual de
-- public.my_grimoires (conferido no Supabase antes de escrever este
-- arquivo), só acrescentando checkout_url. CREATE OR REPLACE VIEW
-- exige que colunas existentes mantenham nome e posição — por isso
-- checkout_url entra no final, depois de has_access.
-- ═══════════════════════════════════════════════════════════════════

create or replace view public.my_grimoires as
  select
    g.id,
    g.slug,
    g.title,
    g.subtitle,
    g.hue,
    g.sort_order,
    g.is_premium,
    g.hotmart_pid,
    g.created_at,
    g.subscriber_included,
    not g.is_premium
      or (exists (
        select 1 from public.entitlements e
         where e.user_id = auth.uid() and e.grimoire_id = g.id
      ))
      or (g.subscriber_included and public.is_paying(auth.uid())) as has_access,
    g.checkout_url
  from public.grimoires g
  order by g.sort_order;
