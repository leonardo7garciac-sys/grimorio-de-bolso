-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 013: Slots de equipamento no Mago
-- Rode APÓS 001–012.
--
-- Cada item do Tesouro passa a declarar ONDE no avatar ele ancora
-- (shop_items.slot). O código de exibição lê esse valor genericamente —
-- um item novo só precisa do slot certo na linha do catálogo, sem
-- mudança de código.
--
-- user_items.hand guarda, por equipamento, QUAL mão uma arma_magica
-- ocupa. Usado só na fase 2 (duas armas, uma por mão) — o front ainda
-- não envia esse parâmetro, então ele chega null e equip_item trata a
-- ausência de mão como "uma arma por vez", igual ao comportamento
-- atual (sem exclusividade nenhuma hoje).
-- ═══════════════════════════════════════════════════════════════════

alter table public.shop_items
  add column if not exists slot text
    check (slot in ('mao', 'peito', 'cintura', 'atras_cabeca'));

alter table public.user_items
  add column if not exists hand text
    check (hand in ('mao_direita', 'mao_esquerda'));

-- ───────────────────────────────────────────────────────────────────
-- Catálogo hoje: 14 linhas — 3 arma_magica + 8 item_encantado precisam
-- de slot; titulo_especial e cosmetico_perfil ficam null (não ancoram
-- no corpo, não entram na exclusividade abaixo).
--
-- Confirmados por você: pentáculo→peito, corda→cintura,
-- espelho→atras_cabeca. Os outros 5 item_encantado (lâmpada, talismã,
-- sino, turíbulo, cálice) são um palpite temático meu — ajuste as
-- linhas abaixo antes de rodar se quiser outra distribuição.
-- ───────────────────────────────────────────────────────────────────
update public.shop_items set slot = 'mao' where slug in (
  'cajado-do-carvalho-antigo',
  'athame-de-obsidiana',
  'varinha-de-amendoeira-branca'
);

update public.shop_items set slot = 'peito' where slug in (
  'pentaculo-de-salomao',        -- confirmado
  'talisma-de-saturno',          -- palpite: amuleto usado ao peito
  'turibulo-do-incenso-eterno',  -- palpite: erguido à frente do peito
  'calice-de-mercurio'           -- palpite: erguido à frente do peito
);

update public.shop_items set slot = 'cintura' where slug in (
  'corda-dos-sete-selos',        -- confirmado
  'lampada-da-chama-perene',     -- palpite: lanterna pendurada na cintura
  'sino-do-veu-celestial'        -- palpite: sino pendurado na cintura
);

update public.shop_items set slot = 'atras_cabeca' where slug in (
  'espelho-negro-de-tezcatlipoca' -- confirmado
);

-- ───────────────────────────────────────────────────────────────────
-- Exclusividade por slot: equipar um item libera automaticamente
-- qualquer outro que ocupe o MESMO slot — cada âncora do avatar nunca
-- tem mais de um item ao mesmo tempo. Para arma_magica sem mão
-- escolhida (p_hand null — o caso de hoje, o front não muda ainda), o
-- comportamento cai para "uma arma por vez", igual ao atual. Com
-- p_hand definido (fase 2, ainda não chamada pelo front), a
-- exclusividade passa a valer só para a MESMA mão — permitindo duas
-- armas ao mesmo tempo, uma por mão.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.equip_item(p_item uuid, p_equip boolean, p_hand text default null)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_kind shop_kind;
  v_slot text;
begin
  select kind, slot into v_kind, v_slot
    from public.shop_items where id = p_item;
  if not found then return 'nao_possui'; end if;

  if p_equip and v_kind = 'arma_magica' and p_hand is not null
     and p_hand not in ('mao_direita', 'mao_esquerda') then
    return 'mao_invalida';
  end if;

  if p_equip and v_slot is not null then
    if v_kind = 'arma_magica' and p_hand is not null then
      update public.user_items ui
         set equipped = false, hand = null
        from public.shop_items si
       where ui.item_id = si.id
         and ui.user_id = auth.uid()
         and ui.item_id <> p_item
         and si.kind = 'arma_magica'
         and ui.hand = p_hand;
    else
      update public.user_items ui
         set equipped = false, hand = null
        from public.shop_items si
       where ui.item_id = si.id
         and ui.user_id = auth.uid()
         and ui.item_id <> p_item
         and si.slot = v_slot;
    end if;
  end if;

  update public.user_items
     set equipped = p_equip,
         hand = case when p_equip then p_hand else null end
   where user_id = auth.uid() and item_id = p_item;
  if not found then return 'nao_possui'; end if;
  return 'ok';
end;
$$;

-- Front (fase atual — nenhuma chamada muda):
-- await supabase.rpc('equip_item', { p_item, p_equip })   -- p_hand fica null
--
-- shop_items(*) já é usado em vários pontos do app (ex.: useProfile,
-- MagoScreen) — o slot chega automaticamente, sem mudança de query.
