-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 014: Seed do catálogo real de grimórios
-- Rode APÓS 001–013.
--
-- Idempotente: ON CONFLICT (slug) DO NOTHING, pode rodar de novo sem
-- duplicar. Não apaga nem altera os grimórios de exemplo inseridos em
-- 001_base.sql (fogo-interior, sigilos, mascaras).
-- ═══════════════════════════════════════════════════════════════════

insert into public.grimoires
  (slug, title, subtitle, hue, is_premium, subscriber_included, hotmart_pid, sort_order)
values
  ('fundamentos', 'Fundamentos', 'Respiração, aterramento e os primeiros passos', '#C9A227', false, false, null, 1),
  ('workbook-sigilos', 'Workbook de Sigilos Práticos', 'Complemento do livro Sigilos & O Paradoxo de Zenão', '#8A7FD1', true, true, '7901411', 2),
  ('blindagem-energetica', 'Blindagem Energética', 'A Camisa de Ferro', '#C25B3A', true, false, '8190564', 3),
  ('bestiario-astral', 'Bestiário Astral', 'Criaturas, Entidades e Flora dos Planos Ocultos', '#4FA88B', true, true, '8030337', 4)
on conflict (slug) do nothing;
