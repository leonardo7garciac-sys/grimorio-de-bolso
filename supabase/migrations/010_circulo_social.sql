-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 010: Círculo Social
-- (Amizades · Trocas de Itens · Correspondências Privadas)
-- Rode APÓS 001–009.
--
-- PRINCÍPIOS:
--  • Identidade pública = APENAS o nickname (mesmo do ranking).
--    Nenhum e-mail ou dado pessoal é exposto em nenhuma função aqui.
--  • Mensagens privadas SÓ entre amigos (anti-spam estrutural) e
--    exigem aceite das diretrizes do fórum + passe do Círculo ativo.
--  • Suspensão de mensagens (1 dia ou mais) aplicada pelo admin
--    via service_role quando uma denúncia procede.
--  • Trocas de itens são atômicas, só entre amigos, e desequipam
--    o item transferido. Economia segue fechada (sem dinheiro real).
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. AMIZADES
--    Uma linha por relação; unique no par ordenado impede duplicatas.
-- ───────────────────────────────────────────────────────────────────
create type friendship_status as enum ('pendente', 'aceita', 'recusada');

create table public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users(id) on delete cascade,
  addressee_id  uuid not null references auth.users(id) on delete cascade,
  status        friendship_status not null default 'pendente',
  created_at    timestamptz default now(),
  responded_at  timestamptz,
  check (requester_id <> addressee_id)
);

create unique index friendships_pair_idx on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);

alter table public.friendships enable row level security;
create policy "amizades: envolvidos leem" on public.friendships
  for select using (auth.uid() in (requester_id, addressee_id));
-- Escrita: apenas via RPCs abaixo (security definer).

-- Helper: são amigos?
create or replace function public.are_friends(p_a uuid, p_b uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.friendships
     where status = 'aceita'
       and least(requester_id, addressee_id) = least(p_a, p_b)
       and greatest(requester_id, addressee_id) = greatest(p_a, p_b)
  );
$$;

-- Enviar pedido pelo nickname.
create or replace function public.send_friend_request(p_nickname text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_to uuid;
begin
  select id into v_to from public.profiles
   where nickname = p_nickname;
  if not found then return 'nickname_nao_encontrado'; end if;
  if v_to = auth.uid() then return 'nao_pode_adicionar_a_si'; end if;

  insert into public.friendships (requester_id, addressee_id)
  values (auth.uid(), v_to);
  return 'ok';
exception
  when unique_violation then return 'ja_existe_relacao';
end;
$$;

-- Responder pedido recebido.
create or replace function public.respond_friend_request(
  p_request uuid, p_accept boolean
)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  update public.friendships
     set status = case when p_accept then 'aceita'::friendship_status
                       else 'recusada'::friendship_status end,
         responded_at = now()
   where id = p_request
     and addressee_id = auth.uid()
     and status = 'pendente';
  if not found then return 'pedido_nao_encontrado'; end if;
  return 'ok';
end;
$$;

-- Desfazer amizade (qualquer lado). Também apaga relação recusada,
-- liberando novo pedido futuro.
create or replace function public.remove_friendship(p_friendship uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.friendships
   where id = p_friendship
     and auth.uid() in (requester_id, addressee_id);
  if not found then return 'nao_encontrado'; end if;
  return 'ok';
end;
$$;

-- Minha lista: amigos aceitos + pedidos pendentes (enviados/recebidos).
create or replace function public.my_friendships()
returns table (
  friendship_id uuid,
  friend_id uuid,
  friend_nickname text,
  friend_title text,
  friend_glyph text,
  status friendship_status,
  i_am_requester boolean
)
language sql stable
security definer set search_path = public
as $$
  select
    f.id,
    case when f.requester_id = auth.uid() then f.addressee_id
         else f.requester_id end,
    p.nickname,
    t.name,
    t.glyph,
    f.status,
    f.requester_id = auth.uid()
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = auth.uid()
                   then f.addressee_id else f.requester_id end
  join public.titles t on t.id = p.title_id
  where auth.uid() in (f.requester_id, f.addressee_id)
    and f.status <> 'recusada'
  order by f.status, p.nickname;
$$;

-- Perfil público de um amigo: grau, título cerimonial, itens e
-- servidor ativo (nome, sigilo, status de carga — SEM a descrição,
-- que é íntima). Só funciona entre amigos.
create or replace function public.friend_profile(p_friend uuid)
returns table (
  nickname text,
  title_name text,
  title_glyph text,
  cosmetic_title text,
  xp_total integer,
  items jsonb,          -- [{name, kind, glyph? via image_path, equipped}]
  servitor jsonb        -- {name, sigil_path, is_charged} | null
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
      order by s.created_at desc
      limit 1
    )
  from public.profiles p
  join public.titles t on t.id = p.title_id
  where p.id = p_friend
    and public.are_friends(auth.uid(), p_friend);
$$;


-- ───────────────────────────────────────────────────────────────────
-- 2. TROCAS DE ITENS (proposta → aceite; atômica; só entre amigos)
--    requested_item_id NULL = presente (dou sem pedir nada).
-- ───────────────────────────────────────────────────────────────────
create type trade_status as enum ('pendente', 'aceita', 'recusada', 'cancelada');

create table public.item_trades (
  id                 uuid primary key default gen_random_uuid(),
  proposer_id        uuid not null references auth.users(id) on delete cascade,
  recipient_id       uuid not null references auth.users(id) on delete cascade,
  offered_item_id    uuid not null references public.shop_items(id),
  requested_item_id  uuid references public.shop_items(id),
  status             trade_status not null default 'pendente',
  created_at         timestamptz default now(),
  resolved_at        timestamptz,
  check (proposer_id <> recipient_id)
);

create index trades_recipient_idx on public.item_trades(recipient_id, status);
create index trades_proposer_idx  on public.item_trades(proposer_id, status);

alter table public.item_trades enable row level security;
create policy "trocas: envolvidos leem" on public.item_trades
  for select using (auth.uid() in (proposer_id, recipient_id));
-- Escrita: apenas via RPCs (security definer).

-- Transferência interna de um item entre usuários (desequipa e limpa
-- título cosmético se necessário). Uso interno das RPCs de troca.
create or replace function public._transfer_item(
  p_from uuid, p_to uuid, p_item uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.user_items
   where user_id = p_from and item_id = p_item;

  insert into public.user_items (user_id, item_id, equipped)
  values (p_to, p_item, false);

  -- se o item era o título cosmético em uso de quem enviou, limpa
  update public.profiles
     set cosmetic_title_id = null, updated_at = now()
   where id = p_from and cosmetic_title_id = p_item;
end;
$$;

-- Propor troca (ou presente, com p_requested = null).
create or replace function public.propose_trade(
  p_to_nickname text,
  p_offered uuid,
  p_requested uuid default null
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_to uuid;
begin
  select id into v_to from public.profiles where nickname = p_to_nickname;
  if not found then return 'nickname_nao_encontrado'; end if;

  if not public.are_friends(auth.uid(), v_to) then
    return 'apenas_entre_amigos';
  end if;

  -- proponente precisa possuir o item ofertado
  if not exists (select 1 from public.user_items
                  where user_id = auth.uid() and item_id = p_offered) then
    return 'voce_nao_possui_o_item';
  end if;
  -- destinatário não pode já possuir o item ofertado
  if exists (select 1 from public.user_items
              where user_id = v_to and item_id = p_offered) then
    return 'amigo_ja_possui_o_item';
  end if;

  if p_requested is not null then
    if not exists (select 1 from public.user_items
                    where user_id = v_to and item_id = p_requested) then
      return 'amigo_nao_possui_o_item_pedido';
    end if;
    if exists (select 1 from public.user_items
                where user_id = auth.uid() and item_id = p_requested) then
      return 'voce_ja_possui_o_item_pedido';
    end if;
  end if;

  insert into public.item_trades
    (proposer_id, recipient_id, offered_item_id, requested_item_id)
  values (auth.uid(), v_to, p_offered, p_requested);
  return 'ok';
end;
$$;

-- Responder proposta (aceitar executa a troca atomicamente,
-- revalidando posses no momento do aceite).
create or replace function public.respond_trade(p_trade uuid, p_accept boolean)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  tr record;
begin
  select * into tr from public.item_trades
   where id = p_trade and recipient_id = auth.uid() and status = 'pendente'
   for update;
  if not found then return 'proposta_nao_encontrada'; end if;

  if not p_accept then
    update public.item_trades
       set status = 'recusada', resolved_at = now() where id = p_trade;
    return 'recusada';
  end if;

  -- revalidações (as posses podem ter mudado desde a proposta)
  if not exists (select 1 from public.user_items
                  where user_id = tr.proposer_id and item_id = tr.offered_item_id)
     or exists (select 1 from public.user_items
                 where user_id = tr.recipient_id and item_id = tr.offered_item_id)
  then
    update public.item_trades
       set status = 'cancelada', resolved_at = now() where id = p_trade;
    return 'proposta_invalida';
  end if;

  if tr.requested_item_id is not null then
    if not exists (select 1 from public.user_items
                    where user_id = tr.recipient_id and item_id = tr.requested_item_id)
       or exists (select 1 from public.user_items
                   where user_id = tr.proposer_id and item_id = tr.requested_item_id)
    then
      update public.item_trades
         set status = 'cancelada', resolved_at = now() where id = p_trade;
      return 'proposta_invalida';
    end if;
  end if;

  perform public._transfer_item(tr.proposer_id, tr.recipient_id, tr.offered_item_id);
  if tr.requested_item_id is not null then
    perform public._transfer_item(tr.recipient_id, tr.proposer_id, tr.requested_item_id);
  end if;

  update public.item_trades
     set status = 'aceita', resolved_at = now() where id = p_trade;
  return 'ok';
end;
$$;

-- Cancelar proposta que eu mesmo enviei (enquanto pendente).
create or replace function public.cancel_trade(p_trade uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  update public.item_trades
     set status = 'cancelada', resolved_at = now()
   where id = p_trade and proposer_id = auth.uid() and status = 'pendente';
  if not found then return 'nao_encontrada'; end if;
  return 'ok';
end;
$$;


-- ───────────────────────────────────────────────────────────────────
-- 3. CORRESPONDÊNCIAS PRIVADAS (mensagens entre amigos)
--    Requisitos para ENVIAR: amizade aceita + aceite das diretrizes
--    vigentes (mesmas do fórum) + passe do Círculo ativo + não estar
--    suspenso. Ler as próprias conversas é sempre permitido.
-- ───────────────────────────────────────────────────────────────────
create table public.messaging_suspensions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  until       timestamptz not null,
  reason      text,
  created_at  timestamptz default now()
);
create index msg_susp_user_idx on public.messaging_suspensions(user_id, until desc);

alter table public.messaging_suspensions enable row level security;
create policy "suspensoes: dono le" on public.messaging_suspensions
  for select using (auth.uid() = user_id);
-- Escrita: apenas service_role (painel admin). Suspensão padrão:
--   insert into messaging_suspensions (user_id, until, reason)
--   values (:user, now() + interval '1 day', 'violação das diretrizes');

create or replace function public.can_send_dm(p_sender uuid, p_recipient uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select public.are_friends(p_sender, p_recipient)
     and public.is_paying(p_sender)
     and exists (
       select 1 from public.guideline_acceptances ga
        where ga.user_id = p_sender
          and ga.version = (select max(version) from public.forum_guidelines)
     )
     and not exists (
       select 1 from public.messaging_suspensions ms
        where ms.user_id = p_sender and ms.until > now()
     );
$$;

create table public.dm_messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references auth.users(id) on delete cascade,
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 3000),
  created_at    timestamptz default now(),
  read_at       timestamptz,
  check (sender_id <> recipient_id)
);

create index dm_pair_idx on public.dm_messages (
  least(sender_id, recipient_id),
  greatest(sender_id, recipient_id),
  created_at desc
);

alter table public.dm_messages enable row level security;
create policy "dm: envolvidos leem" on public.dm_messages
  for select using (auth.uid() in (sender_id, recipient_id));
create policy "dm: envia se autorizado" on public.dm_messages
  for insert with check (
    sender_id = auth.uid()
    and public.can_send_dm(auth.uid(), recipient_id)
  );
create policy "dm: destinatario marca lida" on public.dm_messages
  for update using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Conversas: última mensagem por amigo + não-lidas.
create or replace function public.my_dm_threads()
returns table (
  friend_id uuid,
  friend_nickname text,
  last_body text,
  last_at timestamptz,
  unread_count bigint
)
language sql stable
security definer set search_path = public
as $$
  with pairs as (
    select
      case when sender_id = auth.uid() then recipient_id else sender_id end as friend_id,
      body, created_at, read_at, recipient_id
    from public.dm_messages
    where auth.uid() in (sender_id, recipient_id)
  )
  select
    p.friend_id,
    pr.nickname,
    (select body from pairs p2 where p2.friend_id = p.friend_id
      order by created_at desc limit 1),
    max(p.created_at),
    count(*) filter (where p.recipient_id = auth.uid() and p.read_at is null)
  from pairs p
  join public.profiles pr on pr.id = p.friend_id
  group by p.friend_id, pr.nickname
  order by max(p.created_at) desc;
$$;

-- Status da minha suspensão (para o front avisar).
create or replace function public.my_messaging_suspension()
returns timestamptz
language sql stable
security definer set search_path = public
as $$
  select max(until) from public.messaging_suspensions
   where user_id = auth.uid() and until > now();
$$;

-- Denúncias de mensagens (avaliadas pelo admin → suspensão se procedente).
create table public.dm_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  message_id  uuid not null references public.dm_messages(id) on delete cascade,
  reason      text not null,
  resolved    boolean not null default false,
  created_at  timestamptz default now()
);

alter table public.dm_reports enable row level security;
create policy "dm denuncias: autor cria" on public.dm_reports
  for insert with check (
    reporter_id = auth.uid()
    and exists (select 1 from public.dm_messages m
                 where m.id = message_id
                   and auth.uid() in (m.sender_id, m.recipient_id))
  );
create policy "dm denuncias: autor le as suas" on public.dm_reports
  for select using (auth.uid() = reporter_id);


-- ───────────────────────────────────────────────────────────────────
-- Queries para o front (referência):
--
-- AMIZADES
-- await supabase.rpc('send_friend_request', { p_nickname })
-- await supabase.rpc('respond_friend_request', { p_request, p_accept })
-- await supabase.rpc('remove_friendship', { p_friendship })
-- const { data } = await supabase.rpc('my_friendships')
-- const { data } = await supabase.rpc('friend_profile', { p_friend })
--   // items (jsonb) e servitor (jsonb) já vêm prontos; sigilo/imagens
--   // via createSignedUrl como nas outras abas
--
-- TROCAS
-- await supabase.rpc('propose_trade', { p_to_nickname, p_offered, p_requested })
-- await supabase.rpc('respond_trade', { p_trade, p_accept })
-- await supabase.rpc('cancel_trade', { p_trade })
-- const { data: trades } = await supabase.from('item_trades')
--   .select('*').eq('status','pendente')
--
-- CORRESPONDÊNCIAS
-- const { data: threads } = await supabase.rpc('my_dm_threads')
-- const { data: msgs } = await supabase.from('dm_messages').select('*')
--   .or(`sender_id.eq.${friendId},recipient_id.eq.${friendId}`)
--   .order('created_at')
-- await supabase.from('dm_messages').insert({
--   sender_id: user.id, recipient_id: friendId, body })
--   // a RLS bloqueia sozinha se: não-amigo, sem Círculo, sem aceite
--   // das diretrizes, ou suspenso → tratar erro exibindo o motivo
-- await supabase.from('dm_messages').update({ read_at: new Date() })
--   .eq('recipient_id', user.id).eq('sender_id', friendId).is('read_at', null)
-- await supabase.from('dm_reports').insert({
--   reporter_id: user.id, message_id, reason })
-- const { data: suspendedUntil } = await supabase.rpc('my_messaging_suspension')
-- ───────────────────────────────────────────────────────────────────
