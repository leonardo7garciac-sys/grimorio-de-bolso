-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 019: itens equipados sobre o avatar
-- Rode APÓS 001–018.
--
-- Duas mudanças, ambas só de dados/schema — nenhuma lógica de negócio:
--
-- 1. shop_items.image_path_equipped: caminho opcional no bucket 'loja'
--    para a arte do item RENDERIZADA SOBRE O AVATAR, separada da arte
--    de vitrine (image_path). Quando null, o app usa image_path como
--    fallback — nenhum item precisa dessa coluna preenchida hoje.
--
-- 2. Cálice de Mercúrio e Turíbulo do Incenso Eterno passam do slot
--    'peito' para 'mao': são segurados na mão, não presos ao peito.
--    Reclassificação de dado (013 os colocou em 'peito' como palpite),
--    não muda a lista de slots válidos.
-- ═══════════════════════════════════════════════════════════════════

alter table public.shop_items
  add column if not exists image_path_equipped text; -- bucket 'loja'

update public.shop_items set slot = 'mao' where slug in (
  'calice-de-mercurio',
  'turibulo-do-incenso-eterno'
);
