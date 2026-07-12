-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 011: Bloqueio entre Usuários
-- Rode APÓS 001–010.
--
-- Bloqueio permanente a pedido do usuário (independe de denúncia):
--  • Bloquear CORTA a amizade existente na hora.
--  • O bloqueado não consegue: enviar novo pedido de amizade, propor
--    troca, nem enviar mensagem — e NÃO é notificado do bloqueio
--    (as ações falham como se o nickname não existisse, padrão de
--    segurança para evitar retaliação).
--  • Só quem bloqueou pode desbloquear.
-- ═══════════════════════════════════════════════════════════════════

create table public.user_blocks (
  blocker_id  uuid not null references auth.users(id) on delete cascade,
  blocked_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index user_blocks_blocked_idx on public.user_blocks(blocked_id);

alter table public.user_blocks enable row level security;
create policy "bloqueios: dono le" on public.user_blocks
  for select using (auth.uid() = blocker_id);
-- Escrita apenas via RPCs (security definer).

-- Existe bloqueio em QUALQUER direção entre os dois?
create or replace function public.is_blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_blocks
     where (blocker_id = p_a and blocked_id = p_b)
        or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

-- Bloquear pelo nickname: corta amizade + registra o bloqueio.
create or replace function public.block_user(p_nickname text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_target uuid;
begin
  select id into v_target from public.profiles where nickname = p_nickname;
  if not found then return 'nickname_nao_encontrado'; end if;
  if v_target = auth.uid() then return 'nao_pode_bloquear_a_si'; end if;

  -- corta qualquer relação de amizade existente (aceita ou pendente)
  delete from public.friendships
   where least(requester_id, addressee_id) = least(auth.uid(), v_target)
     and greatest(requester_id, addressee_id) = greatest(auth.uid(), v_target);

  -- cancela trocas pendentes entre os dois
  update public.item_trades
     set status = 'cancelada', resolved_at = now()
   where status = 'pendente'
     and least(proposer_id, recipient_id) = least(auth.uid(), v_target)
     and greatest(proposer_id, recipient_id) = greatest(auth.uid(), v_target);

  insert into public.user_blocks (blocker_id, blocked_id)
  values (auth.uid(), v_target)
  on conflict do nothing;

  return 'ok';
end;
$$;

-- Desbloquear (só quem bloqueou).
create or replace function public.unblock_user(p_nickname text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_target uuid;
begin
  select id into v_target from public.profiles where nickname = p_nickname;
  if not found then return 'nickname_nao_encontrado'; end if;

  delete from public.user_blocks
   where blocker_id = auth.uid() and blocked_id = v_target;
  if not found then return 'nao_estava_bloqueado'; end if;
  return 'ok';
end;
$$;

-- Minha lista de bloqueados (para a tela de gerenciamento).
create or replace function public.my_blocks()
returns table (blocked_nickname text, blocked_at timestamptz)
language sql stable
security definer set search_path = public
as $$
  select p.nickname, b.created_at
    from public.user_blocks b
    join public.profiles p on p.id = b.blocked_id
   where b.blocker_id = auth.uid()
   order by b.created_at desc;
$$;

-- ───────────────────────────────────────────────────────────────────
-- COSTURA COM A 010: injetar a checagem de bloqueio nos pontos de
-- contato. (Redefinições — mesmas assinaturas, com a guarda nova.)
-- ───────────────────────────────────────────────────────────────────

-- Pedido de amizade: falha como se o nickname não existisse.
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

  -- bloqueio em qualquer direção → mesma resposta de "não existe"
  if public.is_blocked_between(auth.uid(), v_to) then
    return 'nickname_nao_encontrado';
  end if;

  insert into public.friendships (requester_id, addressee_id)
  values (auth.uid(), v_to);
  return 'ok';
exception
  when unique_violation then return 'ja_existe_relacao';
end;
$$;

-- Mensagens: are_friends já retorna false (bloqueio apaga a amizade),
-- mas reforçamos a guarda para cobrir qualquer estado residual.
create or replace function public.can_send_dm(p_sender uuid, p_recipient uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select public.are_friends(p_sender, p_recipient)
     and not public.is_blocked_between(p_sender, p_recipient)
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

-- Trocas: mesma lógica — propose_trade exige amizade (que o bloqueio
-- corta), e o block_user cancela as pendentes. Guarda extra:
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

  if public.is_blocked_between(auth.uid(), v_to) then
    return 'nickname_nao_encontrado';
  end if;

  if not public.are_friends(auth.uid(), v_to) then
    return 'apenas_entre_amigos';
  end if;

  if not exists (select 1 from public.user_items
                  where user_id = auth.uid() and item_id = p_offered) then
    return 'voce_nao_possui_o_item';
  end if;
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

-- ───────────────────────────────────────────────────────────────────
-- Queries para o front:
--
-- await supabase.rpc('block_user',   { p_nickname })
-- await supabase.rpc('unblock_user', { p_nickname })
-- const { data: blocked } = await supabase.rpc('my_blocks')
--
-- UX sugerida: botão "Bloquear" no perfil do amigo e nas
-- correspondências (menu ⋮), com confirmação: "Bloquear [nick]?
-- A amizade será desfeita e ele não poderá te adicionar, propor
-- trocas ou enviar mensagens. Ele não será notificado." Tela de
-- gerenciamento ("Bloqueados") nas configurações do Círculo,
-- listando my_blocks() com botão desbloquear.
-- ───────────────────────────────────────────────────────────────────
