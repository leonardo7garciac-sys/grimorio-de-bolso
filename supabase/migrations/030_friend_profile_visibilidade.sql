-- 030_friend_profile_visibilidade.sql
-- Conserta uma regressao introduzida pelas migracoes 024 e 025.
--
-- O Adendo 012 acrescentou a coluna servitors.visible_to_friends e o
-- filtro correspondente dentro da friend_profile. Depois disso, as
-- migracoes 024 e 025 reescreveram a friend_profile inteira partindo
-- da versao do Adendo 010 — que nao tinha esse filtro. Resultado: a
-- coluna continua sendo gravada pelo set_servitor_visibility, mas
-- ninguem mais a le, e o servidor aparece para os amigos mesmo com a
-- caixa desmarcada.
--
-- Esta versao junta as duas coisas:
--   * os campos que o AvatarEtereo precisa no jsonb de items
--     (slug, slot, hand, image_path_equipped), vindos da 024/025;
--   * o filtro and s.visible_to_friends no bloco do servidor,
--     vindo do Adendo 012.
--
-- Licao para as proximas: friend_profile e reescrita por inteiro a
-- cada alteracao, entao qualquer mudanca precisa partir da versao que
-- esta EM PRODUCAO (pg_proc.prosrc), nunca de um adendo antigo.

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
        and s.visible_to_friends
      order by s.created_at desc
      limit 1
    )
  from public.profiles p
  join public.titles t on t.id = p.title_id
  where p.id = p_friend
    and public.are_friends(auth.uid(), p_friend);
$$;
