-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 016: checkout_url para compra avulsa
-- Rode APÓS 001–015.
--
-- Hoje todo grimório premium sem acesso mostra "🗝 Círculo" no front,
-- sugerindo que assinar o Círculo sempre libera o grimório. Isso é
-- falso para os grimórios com subscriber_included = false: a pessoa
-- pode assinar esperando liberar um grimório que a assinatura nunca
-- vai destravar. checkout_url guarda o link de compra avulsa na
-- Hotmart para o front decidir a mensagem certa por grimório.
--
-- my_grimoires (007_modelo_hibrido.sql) usa "select g.*", então a
-- coluna nova chega ao front sem precisar recriar a view.
-- ═══════════════════════════════════════════════════════════════════

alter table public.grimoires
  add column if not exists checkout_url text;

update public.grimoires set checkout_url = 'https://pay.hotmart.com/N106222223B'
  where slug = 'workbook-sigilos';

update public.grimoires set checkout_url = 'https://pay.hotmart.com/B106540209G'
  where slug = 'bestiario-astral';

update public.grimoires set checkout_url = 'https://pay.hotmart.com/B106879022Y'
  where slug = 'blindagem-energetica';
