-- 027_slot_costas.sql
-- Cria o slot 'costas', para o Cajado do Carvalho Antigo passar a ser
-- usado preso as costas do avatar em vez de ocupar uma das maos.
--
-- Por que um slot novo e nao 'atras_cabeca': aquele ja e do Espelho
-- Negro de Tezcatlipoca, e a regra e de um item por slot. Sao lugares
-- diferentes do corpo, entao merecem slots diferentes — assim da para
-- usar os dois ao mesmo tempo.
--
-- A equip_item nao precisa de alteracao: ela trata slot desconhecido
-- pelo caminho generico, desequipando o que estiver no mesmo slot.
--
-- Nota: a constraint nao menciona null, e nem precisa. Em SQL
-- null = ANY (...) resulta em NULL, e CHECK so rejeita quando o
-- resultado e FALSE — por isso os cosmeticos com slot nulo passam.

alter table public.shop_items
  drop constraint if exists shop_items_slot_check;

alter table public.shop_items
  add constraint shop_items_slot_check
  check (slot = any (array['mao'::text,
                           'peito'::text,
                           'cintura'::text,
                           'atras_cabeca'::text,
                           'costas'::text]));

update public.shop_items
   set slot = 'costas'
 where slug = 'cajado-do-carvalho-antigo';

-- limpa estado antigo: se alguem estava com ele equipado numa das maos,
-- a atribuicao de mao deixa de fazer sentido
update public.user_items
   set equipped = false, hand = null
 where item_id = (select id from public.shop_items
                   where slug = 'cajado-do-carvalho-antigo');
