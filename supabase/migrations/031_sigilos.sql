-- 031_sigilos.sql
-- Sigilos gerados na Forja.
--
-- DECISAO DELIBERADA: nao existe coluna para o INTENTO. Alem de ser
-- dado intimo demais para o banco, a propria tradicao manda esquece-lo
-- — no metodo de Spare o sigilo so opera depois que o desejo
-- consciente e solto. Guardar o texto contrariaria a pratica que a
-- ferramenta ensina. O intento vive so na sessao do navegador.
--
-- O glifo e guardado como SVG em texto, nao como arquivo em bucket:
-- e leve, escala sem perder, da para recolorir pelo tema do app e
-- dispensa signed URL. Para anexar a um servidor astral, o front
-- converte para imagem na hora do upload.

create table if not exists public.sigils (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text check (char_length(name) between 1 and 60),
  method      text not null check (method in ('kamea', 'roda', 'spare', 'rosa_cruz')),
  detail      text,              -- ex.: qual planeta foi usado no kamea
  svg         text not null check (char_length(svg) <= 60000),
  created_at  timestamptz default now()
);

create index if not exists sigils_user_idx
  on public.sigils(user_id, created_at desc);

alter table public.sigils enable row level security;

-- Ler e apagar: qualquer dono, pagante ou nao. Se a assinatura vencer,
-- o mago nao perde os sigilos que ja forjou — so nao forja novos.
create policy "sigilos: dono le" on public.sigils
  for select using (auth.uid() = user_id);

create policy "sigilos: dono apaga" on public.sigils
  for delete using (auth.uid() = user_id);

create policy "sigilos: dono renomeia" on public.sigils
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Criar: exige passe do Circulo ativo. Este e o portao de verdade —
-- bloqueio so no front seria contornavel.
create policy "sigilos: pagante forja" on public.sigils
  for insert with check (
    auth.uid() = user_id
    and public.is_paying(auth.uid())
  );

comment on table public.sigils is
  'Glifos forjados na Forja. Sem coluna de intento, por decisao de projeto.';
