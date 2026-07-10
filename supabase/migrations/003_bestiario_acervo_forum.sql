-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 003: Bestiário, Acervo e Fórum dos Magos
-- Rode APÓS 001 (base) e 002 (ranking).
--
-- Todas as áreas deste adendo são EXCLUSIVAS PARA PAGANTES,
-- aplicado direto na RLS via public.is_paying() (criada no 002).
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. BESTIÁRIO ASTRAL
--    Catálogo de criaturas, deidades e elementos mitológicos.
--    Ilustrações: suba as imagens no Supabase Storage (bucket
--    'bestiario') e guarde o caminho em image_path.
-- ───────────────────────────────────────────────────────────────────
create type bestiary_kind as enum (
  'criatura', 'deidade', 'espirito', 'flora', 'artefato', 'lugar'
);

create table public.bestiary_entries (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  kind         bestiary_kind not null default 'criatura',
  pantheon     text,                 -- 'grego', 'nórdico', 'iorubá'...
  summary      text,                 -- 1–2 frases (aparece no card)
  lore         text,                 -- corpo longo (markdown)
  image_path   text,                 -- caminho no bucket 'bestiario'
  epistemics   text,                 -- teu framework: 'lenda' | 'relato' | 'psicologia verificada'
  sort_order   smallint default 0,
  is_published boolean not null default false,
  created_at   timestamptz default now()
);

create index bestiary_kind_idx     on public.bestiary_entries(kind);
create index bestiary_pantheon_idx on public.bestiary_entries(pantheon);


-- ───────────────────────────────────────────────────────────────────
-- 2. ACERVO / ARQUIVO PROIBIDO
--    Obras e trechos: pesquisas e conquistas de magos pela história.
--    ATENÇÃO DIREITOS AUTORAIS: publique apenas obras em domínio
--    público (autores falecidos há 70+ anos no Brasil) ou textos
--    seus/licenciados. Grimórios históricos clássicos em geral são
--    seguros; traduções modernas muitas vezes NÃO são — a tradução
--    tem copyright próprio.
-- ───────────────────────────────────────────────────────────────────
create table public.library_works (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  author       text,
  era          text,                 -- 'séc. XVI', '1888'...
  tradition    text,                 -- 'hermetismo', 'goétia', 'alquimia'...
  intro        text,                 -- tua contextualização da obra
  is_published boolean not null default false,
  sort_order   smallint default 0,
  created_at   timestamptz default now()
);

create table public.library_excerpts (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.library_works(id) on delete cascade,
  heading     text,                  -- 'Da evocação dos espíritos, cap. III'
  body        text not null,         -- o trecho em si (markdown)
  commentary  text,                  -- tua nota de estudo sobre o trecho
  sort_order  smallint default 0,
  created_at  timestamptz default now()
);

create index excerpts_work_idx on public.library_excerpts(work_id);


-- ───────────────────────────────────────────────────────────────────
-- 3. FÓRUM DOS MAGOS PESQUISADORES
--    Publicar experimentos, discutir ideias, buscar parceiros.
-- ───────────────────────────────────────────────────────────────────

-- 3a. Diretrizes: versão + aceite obrigatório antes de postar.
create table public.forum_guidelines (
  version     smallint primary key,
  body        text not null,         -- texto integral das regras (markdown)
  created_at  timestamptz default now()
);

insert into public.forum_guidelines (version, body) values (1, $md$
# Diretrizes do Fórum dos Magos

Este é um espaço de pesquisa séria. Ao publicar, você concorda com:

1. **Saúde em primeiro lugar.** É proibido conteúdo que incentive práticas
   perigosas à saúde física ou mental: jejuns extremos, privação de sono,
   uso de substâncias, automutilação ou qualquer prática de risco.
   Trabalho energético e ritual sempre dentro de limites seguros.
2. **Magia não substitui medicina.** Relatos de cura são bem-vindos como
   experiência pessoal, mas jamais como orientação para abandonar
   tratamento médico ou psicológico.
3. **Nada contra terceiros.** Proibido publicar trabalhos voltados a
   prejudicar, coagir ou vigiar pessoas específicas.
4. **Respeito entre tradições.** Debata ideias, não pessoas. Ceticismo
   metodológico é bem-vindo; deboche não.
5. **Sem dados pessoais.** Não exponha nome completo, endereço ou contato
   próprio ou alheio no corpo dos posts. Parcerias se iniciam pelo app.
6. **Honestidade epistêmica.** Distinga claramente: relato pessoal,
   tradição/lenda, e afirmação verificável. (O mesmo padrão dos
   grimórios Baltazar.)
7. **Sem comércio.** O fórum não é vitrine de serviços pagos, consultas
   ou venda de materiais.

Publicações que violem estas regras podem ser removidas e, em caso de
reincidência, o acesso ao fórum pode ser suspenso.
$md$);

-- Aceite registrado por usuário e versão.
create table public.guideline_acceptances (
  user_id     uuid not null references auth.users(id) on delete cascade,
  version     smallint not null references public.forum_guidelines(version),
  accepted_at timestamptz default now(),
  primary key (user_id, version)
);

-- 3b. Categorias fixas do fórum.
create type forum_category as enum (
  'experimento',        -- relatos de prática e resultados
  'discussao',          -- teoria, ideias, dúvidas
  'parceria'            -- busca de parceiros/grupos para projetos
);

-- 3c. Posts e comentários.
create type post_status as enum ('ativo', 'oculto', 'removido');

create table public.forum_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users(id) on delete cascade,
  category    forum_category not null,
  title       text not null check (char_length(title) between 8 and 140),
  body        text not null check (char_length(body) between 20 and 8000),
  status      post_status not null default 'ativo',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index forum_posts_cat_idx    on public.forum_posts(category, created_at desc);
create index forum_posts_author_idx on public.forum_posts(author_id);

create table public.forum_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.forum_posts(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null check (char_length(body) between 2 and 4000),
  status      post_status not null default 'ativo',
  created_at  timestamptz default now()
);

create index forum_comments_post_idx on public.forum_comments(post_id, created_at);

-- 3d. Denúncias (a válvula de segurança da comunidade).
create table public.forum_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id     uuid references public.forum_posts(id) on delete cascade,
  comment_id  uuid references public.forum_comments(id) on delete cascade,
  reason      text not null,
  resolved    boolean not null default false,
  created_at  timestamptz default now(),
  check (post_id is not null or comment_id is not null)
);


-- ───────────────────────────────────────────────────────────────────
-- 4. FUNÇÃO DE GATE: pagante + aceitou as diretrizes vigentes
-- ───────────────────────────────────────────────────────────────────
create or replace function public.can_post_forum(p_user uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_paying(p_user)
     and exists (
       select 1 from public.guideline_acceptances ga
        where ga.user_id = p_user
          and ga.version = (select max(version) from public.forum_guidelines)
     );
$$;


-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — tudo premium
-- ═══════════════════════════════════════════════════════════════════

-- Bestiário: leitura só para pagantes; escrita só via service_role (você).
alter table public.bestiary_entries enable row level security;
create policy "bestiario: pagantes leem" on public.bestiary_entries
  for select using (is_published and public.is_paying(auth.uid()));

-- Acervo: idem.
alter table public.library_works enable row level security;
alter table public.library_excerpts enable row level security;
create policy "acervo obras: pagantes leem" on public.library_works
  for select using (is_published and public.is_paying(auth.uid()));
create policy "acervo trechos: pagantes leem" on public.library_excerpts
  for select using (
    public.is_paying(auth.uid())
    and exists (select 1 from public.library_works w
                 where w.id = work_id and w.is_published)
  );

-- Diretrizes: qualquer autenticado lê (precisa ler antes de aceitar).
alter table public.forum_guidelines enable row level security;
create policy "diretrizes: autenticados leem" on public.forum_guidelines
  for select using (auth.uid() is not null);

alter table public.guideline_acceptances enable row level security;
create policy "aceites: dono lê"    on public.guideline_acceptances
  for select using (auth.uid() = user_id);
create policy "aceites: dono cria"  on public.guideline_acceptances
  for insert with check (auth.uid() = user_id);

-- Fórum: pagantes leem; postar exige aceite das diretrizes.
alter table public.forum_posts enable row level security;
create policy "posts: pagantes leem" on public.forum_posts
  for select using (status = 'ativo' and public.is_paying(auth.uid()));
create policy "posts: autor publica" on public.forum_posts
  for insert with check (auth.uid() = author_id and public.can_post_forum(auth.uid()));
create policy "posts: autor edita"   on public.forum_posts
  for update using (auth.uid() = author_id);

alter table public.forum_comments enable row level security;
create policy "comentarios: pagantes leem" on public.forum_comments
  for select using (status = 'ativo' and public.is_paying(auth.uid()));
create policy "comentarios: autor publica" on public.forum_comments
  for insert with check (auth.uid() = author_id and public.can_post_forum(auth.uid()));
create policy "comentarios: autor edita" on public.forum_comments
  for update using (auth.uid() = author_id);

alter table public.forum_reports enable row level security;
create policy "denuncias: pagante cria" on public.forum_reports
  for insert with check (auth.uid() = reporter_id and public.is_paying(auth.uid()));
create policy "denuncias: autor ve as suas" on public.forum_reports
  for select using (auth.uid() = reporter_id);

-- Moderação (ocultar/remover posts, resolver denúncias) é feita com a
-- service_role key — via painel admin próprio ou direto no Supabase.


-- ───────────────────────────────────────────────────────────────────
-- 5. STORAGE — bucket das ilustrações do bestiário
--    Rode no SQL Editor; depois suba as imagens pelo painel Storage.
-- ───────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('bestiario', 'bestiario', false)
on conflict (id) do nothing;

create policy "bestiario storage: pagantes leem"
  on storage.objects for select
  using (bucket_id = 'bestiario' and public.is_paying(auth.uid()));
