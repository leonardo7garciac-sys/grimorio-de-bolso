-- 023_duas_maos.sql
-- Atribuicao automatica de mao, decidida em 02/ago:
--   * nenhuma mao ocupada  -> vai para a DIREITA
--   * direita ocupada      -> vai para a ESQUERDA
--   * as duas ocupadas     -> SUBSTITUI A DIREITA
--   * tirar o item da direita nao mexe no da esquerda
--
-- Duas correcoes em relacao a versao anterior:
--
--  1. A decisao passa a ser por SLOT, nao por kind. Antes so
--     'arma_magica' ganhava tratamento de mao; como calice e turibulo
--     sao 'item_encantado' e agora ocupam o slot 'mao', eles nunca
--     chegariam a segunda mao.
--
--  2. Ao liberar a mao escolhida, tambem desequipa itens de mao com
--     hand NULO. Todas as linhas existentes de user_items estao com
--     hand nulo (o front nunca mandou p_hand), e sem isso elas nunca
--     seriam substituidas — o usuario ficaria com dois itens
--     desenhados no mesmo ponto.
--
-- ATENCAO: create or replace function nao aceita mudanca nos nomes dos
-- parametros. Se a assinatura real diferir de (p_item, p_equip,
-- p_hand), ajuste os nomes abaixo antes de rodar.

create or replace function public.equip_item(
  p_item uuid, p_equip boolean, p_hand text default null
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_slot text;
  v_dir  uuid;
  v_esq  uuid;
begin
  select slot into v_slot from public.shop_items where id = p_item;
  if not found then return 'nao_possui'; end if;

  if p_equip and p_hand is not null
     and p_hand not in ('mao_direita', 'mao_esquerda') then
    return 'mao_invalida';
  end if;

  if p_equip and v_slot = 'mao' then

    select ui.item_id into v_dir
      from public.user_items ui
      join public.shop_items si on si.id = ui.item_id
     where ui.user_id = auth.uid() and ui.equipped
       and si.slot = 'mao' and ui.hand = 'mao_direita'
       and ui.item_id <> p_item;

    select ui.item_id into v_esq
      from public.user_items ui
      join public.shop_items si on si.id = ui.item_id
     where ui.user_id = auth.uid() and ui.equipped
       and si.slot = 'mao' and ui.hand = 'mao_esquerda'
       and ui.item_id <> p_item;

    if p_hand is null then
      if    v_dir is null then p_hand := 'mao_direita';
      elsif v_esq is null then p_hand := 'mao_esquerda';
      else                     p_hand := 'mao_direita';
      end if;
    end if;

    -- libera so a mao escolhida (mais os legados sem mao definida)
    update public.user_items ui
       set equipped = false, hand = null
      from public.shop_items si
     where ui.item_id = si.id
       and ui.user_id = auth.uid()
       and ui.item_id <> p_item
       and si.slot = 'mao'
       and (ui.hand = p_hand or ui.hand is null);

  elsif p_equip and v_slot is not null then

    update public.user_items ui
       set equipped = false, hand = null
      from public.shop_items si
     where ui.item_id = si.id
       and ui.user_id = auth.uid()
       and ui.item_id <> p_item
       and si.slot = v_slot;

  end if;

  update public.user_items
     set equipped = p_equip,
         hand = case when p_equip and v_slot = 'mao' then p_hand else null end
   where user_id = auth.uid() and item_id = p_item;
  if not found then return 'nao_possui'; end if;
  return 'ok';
end;
$$;
