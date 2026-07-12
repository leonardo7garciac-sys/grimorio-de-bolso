-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 012: Visibilidade do Servidor Astral
-- Rode APÓS 001–011.
--
-- O dono decide, por servidor, se amigos podem vê-lo no seu perfil.
-- Padrão: visível (comportamento atual preservado). Ocultar não
-- afeta nada do próprio dono — só o que o friend_profile expõe.
-- ═══════════════════════════════════════════════════════════════════

alter table public.servitors
  add column if not exists visible_to_friends boolean not null default true;

-- Alternar visibilidade (só o dono).
create or replace function public.set_servitor_visibility(
  p_servitor uuid, p_visible boolean
)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  update public.servitors
     set visible_to_friends = p_visible,
         updated_at = now()
   where id = p_servitor and user_id = auth.uid();
  if not found then return 'nao_encontrado'; end if;
  return 'ok';
end;
$$;

-- friend_profile: passa a considerar só servidores visíveis.
-- (Mesma assinatura da 010; única mudança é o filtro no bloco servitor.)
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
        'name', si.name, 'kind', si.kind,
        'image_path', si.image_path, 'equipped', ui.equipped)
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
        and s.visible_to_friends            -- ← o filtro novo
      order by s.created_at desc
      limit 1
    )
  from public.profiles p
  join public.titles t on t.id = p.title_id
  where p.id = p_friend
    and public.are_friends(auth.uid(), p_friend);
$$;

-- my_servitors: expõe a flag para a UI do dono.
-- DROP obrigatório: o tipo de retorno ganhou uma coluna nova e o
-- Postgres não permite "or replace" mudar a forma do retorno (42P13).
drop function if exists public.my_servitors();

create or replace function public.my_servitors()
returns table (
  id uuid,
  name text,
  description text,
  sigil_path text,
  recharge_interval_days integer,
  last_charged_at timestamptz,
  next_charge_due timestamptz,
  is_charged boolean,
  days_overdue integer,
  visible_to_friends boolean
)
language sql stable
security definer set search_path = public
as $$
  select
    s.id, s.name, s.description, s.sigil_path,
    s.recharge_interval_days, s.last_charged_at,
    s.last_charged_at + make_interval(days => s.recharge_interval_days),
    (s.last_charged_at + make_interval(days => s.recharge_interval_days)) > now(),
    greatest(0, extract(day from now() -
      (s.last_charged_at + make_interval(days => s.recharge_interval_days))
    )::integer),
    s.visible_to_friends
  from public.servitors s
  where s.user_id = auth.uid()
  order by s.created_at;
$$;

-- Front:
-- await supabase.rpc('set_servitor_visibility', { p_servitor, p_visible })
-- my_servitors() agora retorna visible_to_friends para o toggle.
