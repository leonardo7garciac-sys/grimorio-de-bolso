-- 025_friend_profile_slug.sql
-- Corrige uma omissao da 024.
--
-- O jsonb de items ganhou slot, hand e image_path_equipped, mas ficou
-- sem o SLUG. E o slug e a chave do ITEM_OVERRIDE no AvatarEtereo:
-- sem ele, nenhum ajuste por item casa (grip, size, rotate, offsetX,
-- flipX, filter) e tudo cai no padrao do slot — que e exatamente o
-- estado anterior a calibracao.
--
-- Sintoma: no avatar do amigo as pecas aparecem fora do eixo, do jeito
-- que ficavam antes de os overrides existirem, enquanto no proprio
-- avatar tudo aparece certo.

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
        'slug',                si.slug,
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
