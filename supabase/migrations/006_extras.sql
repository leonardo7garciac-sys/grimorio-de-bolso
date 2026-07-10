-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 006: Extras da Fundação (Claude Code, P1)
-- Rode APÓS 001–005.
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. RPC de conveniência para o front: "eu sou pagante?"
--    Fina camada sobre public.is_paying (criada na 002), já resolvendo
--    auth.uid() — o front nunca precisa saber o próprio user_id.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.am_i_paying()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_paying(auth.uid());
$$;


-- ───────────────────────────────────────────────────────────────────
-- 2. VIEW do Fórum: posts com autor exposto SÓ por nickname
--    Nunca author_id, nunca e-mail. Se o autor ainda não escolheu um
--    nickname (ver set_ranking_identity, 002), cai no rótulo genérico.
--
--    security_invoker garante que a RLS de forum_posts (status='ativo'
--    e is_paying(auth.uid())) continua valendo para quem consulta a
--    view — a view não deve abrir nada que a tabela já não permita.
-- ───────────────────────────────────────────────────────────────────
create or replace view public.forum_posts_with_author
with (security_invoker = true)
as
  select
    p.id,
    p.category,
    p.title,
    p.body,
    p.status,
    p.created_at,
    p.updated_at,
    coalesce(pr.nickname, 'Mago anônimo') as author_nickname
  from public.forum_posts p
  join public.profiles pr on pr.id = p.author_id;

-- No front-end: supabase.from('forum_posts_with_author').select('*, forum_comments(count)')
-- em vez de supabase.from('forum_posts'), conforme a Parte 1 do HANDOFF.
