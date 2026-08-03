-- 024_friend_profile_avatar.sql
-- Acrescenta ao friend_profile o que falta para desenhar o AVATAR do
-- amigo, e nao apenas listar os itens dele.
--
-- O jsonb de items ja trazia name, kind, image_path e equipped. Faltavam
-- tres campos que o AvatarEtereo precisa:
--   * slot   -> em que ponto do avatar a peca vai (mao, peito, cintura,
--               atras_cabeca) — vem de shop_items
--   * hand   -> mao_direita ou mao_esquerda, para os itens de mao —
--               vem de user_items, nao de shop_items
--   * image_path_equipped -> arte propria do estado equipado, quando
--               existir; o front cai em image_path quando for nulo
--
-- A assinatura da funcao NAO muda: items continua sendo jsonb, so o
-- conteudo de cada objeto ganha campos. create or replace function nao
-- aceitaria mudanca no tipo de retorno.
--
-- Segue valendo: so funciona entre amigos (are_friends), expoe apenas o
-- nickname como identidade, e nao devolve a descricao do servidor
-- astral, que e considerada intima.

create or replace function public.friend_profile(p_friend uuid)
returns table (
  nickname text,
  title_name text,
  title_glyph text,
  cosmetic_title text,
  xp_total integer,
  items jsonb,
  servitor jsonb
)
language sql stable
security definer set search_path = public
as $$
  select
    p.nickname,
    t.name,
    t.glyph,
    (select si.name from public.shop_items si
      where si.id = p.cosmetic_title_id),
    p.xp_total,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',                si.name,
        'kind',                si.kind,
        'slot',                si.slot,
        'hand',                ui.hand,
        'image_path',          si.image_path,
        'image_path_equipped', si.image_path_equipped,
        'equipped',            ui.equipped)
        order by ui.acquired_at)
      from public.user_items ui
      join public.shop_items si on si.id = ui.item_id
      where ui.user_id = p.id
    ), '[]'::jsonb),
    (
      select jsonb_build_object(
        'name', s.name,
        'sigil_path', s.sigil_path,
        'is_charged',
          (s.last_charged_at + make_interval(days => s.recharge_interval_days)) > now())
      from public.servitors s
      where s.user_id = p.id
      order by s.created_at desc
      limit 1
    )
  from public.profiles p
  join public.titles t on t.id = p.title_id
  where p.id = p_friend
    and public.are_friends(auth.uid(), p_friend);
$$;
