-- 021_social_no_gratuito.sql
-- Move as correspondencias privadas entre amigos para o plano gratuito.
--
-- Contexto: o adendo 010 exigia passe do Circulo ativo para enviar DM,
-- via public.is_paying() dentro de can_send_dm(). A decisao de 29/jul foi
-- que nenhum recurso social fica atras da assinatura -- o que sustenta o
-- Circulo e conteudo, nao recurso social.
--
-- As trocas de itens NAO precisam de alteracao: propose_trade,
-- respond_trade e cancel_trade nunca checaram is_paying, so are_friends.
--
-- Continuam valendo, de proposito:
--   * amizade aceita  -> anti-spam estrutural
--   * aceite das diretrizes vigentes
--   * ausencia de suspensao de mensagens

create or replace function public.can_send_dm(p_sender uuid, p_recipient uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select public.are_friends(p_sender, p_recipient)
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
