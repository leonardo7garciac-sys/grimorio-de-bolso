-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 008: Correção da view do Fórum (006)
-- Rode APÓS 001–007.
--
-- BUG na 006: forum_posts_with_author usava security_invoker = true e
-- fazia "join profiles". Como a RLS de profiles só permite
-- auth.uid() = id ("profiles: dono lê"), o join só encontrava a linha
-- de profiles de quem ESTÁ CONSULTANDO — os posts de qualquer outro
-- autor perdiam o join (inner join) e desapareciam da listagem.
-- Na prática, cada usuário só veria os próprios posts no fórum.
--
-- CORREÇÃO: mesma receita já usada em ranking_da_lua / get_ranking_da_lua
-- (002) — a view roda com o privilégio de quem a criou (sem
-- security_invoker), só filtrando regras intrínsecas do domínio
-- (status = 'ativo'); quem pode LER passa a ser decidido por uma RPC
-- security definer que aplica is_paying(auth.uid()) por cima da view.
-- Mesmo tratamento para os comentários, que precisam do mesmo relance
-- de nickname e esbarrariam no mesmo problema.
-- ═══════════════════════════════════════════════════════════════════

drop view if exists public.forum_posts_with_author;

create view public.forum_posts_with_author as
  select
    p.id,
    p.category,
    p.title,
    p.body,
    p.status,
    p.created_at,
    p.updated_at,
    coalesce(pr.nickname, 'Mago anônimo') as author_nickname,
    (
      select count(*) from public.forum_comments c
       where c.post_id = p.id and c.status = 'ativo'
    ) as comment_count
  from public.forum_posts p
  join public.profiles pr on pr.id = p.author_id
  where p.status = 'ativo';

create or replace function public.forum_feed(p_category forum_category default null)
returns setof public.forum_posts_with_author
language sql
stable
security definer set search_path = public
as $$
  select * from public.forum_posts_with_author
  where public.is_paying(auth.uid())
    and (p_category is null or category = p_category)
  order by created_at desc;
$$;

create view public.forum_comments_with_author as
  select
    c.id,
    c.post_id,
    c.body,
    c.status,
    c.created_at,
    coalesce(pr.nickname, 'Mago anônimo') as author_nickname
  from public.forum_comments c
  join public.profiles pr on pr.id = c.author_id
  where c.status = 'ativo';

create or replace function public.forum_post_comments(p_post uuid)
returns setof public.forum_comments_with_author
language sql
stable
security definer set search_path = public
as $$
  select * from public.forum_comments_with_author
  where public.is_paying(auth.uid())
    and post_id = p_post
  order by created_at asc;
$$;

-- No front-end (Parte 1 do HANDOFF, corrigida):
-- const { data: posts } = await supabase.rpc('forum_feed', { p_category: cat })
-- const { data: comments } = await supabase.rpc('forum_post_comments', { p_post: postId })
-- Criar post/comentário continua indo direto em forum_posts/forum_comments
-- (a RLS de insert de 003 não muda).
