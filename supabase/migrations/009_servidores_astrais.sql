-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 009: Servidores Astrais
-- Rode APÓS 001–008.
--
-- Cada usuário mantém seus servidores astrais: sigilo (foto), nome,
-- descrição (aparência, habilidades, background) e ciclo de recarga
-- definido por ele. O status Carregado/Carga baixa é DERIVADO de
-- last_charged_at + recharge_interval_days — nunca editado à mão
-- (mesma filosofia do XP: o banco é a fonte de verdade).
--
-- Lembrete v1 = dentro do app (status muda sozinho + indicador na
-- aba). Push notification real fica para evolução futura.
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. SERVIDORES
-- ───────────────────────────────────────────────────────────────────
create table public.servitors (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  name                    text not null check (char_length(name) between 2 and 60),
  description             text check (char_length(description) <= 6000),
                          -- aparência, habilidades, background (markdown livre)
  sigil_path              text,          -- caminho no bucket 'servidores'
  recharge_interval_days  integer not null default 7
                          check (recharge_interval_days between 1 and 365),
  last_charged_at         timestamptz not null default now(),
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create index servitors_user_idx on public.servitors(user_id);

-- ───────────────────────────────────────────────────────────────────
-- 2. RLS: estritamente pessoal (só o dono vê e gerencia os seus)
-- ───────────────────────────────────────────────────────────────────
alter table public.servitors enable row level security;

create policy "servitors: dono le"     on public.servitors
  for select using (auth.uid() = user_id);
create policy "servitors: dono cria"   on public.servitors
  for insert with check (auth.uid() = user_id);
create policy "servitors: dono edita"  on public.servitors
  for update using (auth.uid() = user_id);
create policy "servitors: dono apaga"  on public.servitors
  for delete using (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────
-- 3. RPCs
-- ───────────────────────────────────────────────────────────────────
-- Lista os servidores do usuário com o status de carga já resolvido
-- e há quantos dias venceu (negativo = ainda no prazo).
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
  days_overdue integer
)
language sql stable
security definer set search_path = public
as $$
  select
    s.id, s.name, s.description, s.sigil_path,
    s.recharge_interval_days, s.last_charged_at,
    s.last_charged_at + make_interval(days => s.recharge_interval_days)
      as next_charge_due,
    (s.last_charged_at + make_interval(days => s.recharge_interval_days)) > now()
      as is_charged,
    greatest(
      0,
      extract(day from now() -
        (s.last_charged_at + make_interval(days => s.recharge_interval_days))
      )::integer
    ) as days_overdue
  from public.servitors s
  where s.user_id = auth.uid()
  order by s.created_at;
$$;

-- Registrar a recarga (o usuário fez o ritual → toca no botão).
create or replace function public.recharge_servitor(p_servitor uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  update public.servitors
     set last_charged_at = now(),
         updated_at = now()
   where id = p_servitor and user_id = auth.uid();
  if not found then return 'nao_encontrado'; end if;
  return 'ok';
end;
$$;

-- QUEIMAR SERVIDOR 🔥 — dispensa ritual definitiva.
-- Apaga o registro (irrecuperável). O front deve exibir confirmação
-- solene antes ("Queimar [nome]? O servidor será desfeito e seus
-- dados não poderão ser recuperados.") e, após o ok, remover também
-- a foto do sigilo no Storage: storage.from('servidores').remove([path]).
create or replace function public.burn_servitor(p_servitor uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.servitors
   where id = p_servitor and user_id = auth.uid();
  if not found then return 'nao_encontrado'; end if;
  return 'queimado';
end;
$$;

-- Contagem de servidores em carga baixa (para o indicador na aba).
create or replace function public.servitors_low_charge_count()
returns integer
language sql stable
security definer set search_path = public
as $$
  select count(*)::integer
    from public.servitors s
   where s.user_id = auth.uid()
     and (s.last_charged_at + make_interval(days => s.recharge_interval_days)) <= now();
$$;

-- ───────────────────────────────────────────────────────────────────
-- 4. STORAGE — bucket dos sigilos dos servidores
--    Usuário envia em servidores/{seu_uid}/... e só lê os próprios.
-- ───────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('servidores', 'servidores', false)
on conflict (id) do nothing;

create policy "servidores storage: dono envia" on storage.objects
  for insert with check (
    bucket_id = 'servidores'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "servidores storage: dono le" on storage.objects
  for select using (
    bucket_id = 'servidores'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "servidores storage: dono apaga" on storage.objects
  for delete using (
    bucket_id = 'servidores'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ───────────────────────────────────────────────────────────────────
-- Queries para o front (referência):
--
-- const { data: servitors } = await supabase.rpc('my_servitors')
-- const { data: lowCount } = await supabase.rpc('servitors_low_charge_count')
--
-- // criar
-- await supabase.from('servitors').insert({
--   user_id: user.id, name, description,
--   recharge_interval_days: 7 })
--
-- // foto do sigilo: upload + update do caminho
-- const path = `${user.id}/${servitorId}.jpg`
-- await supabase.storage.from('servidores').upload(path, file, { upsert: true })
-- await supabase.from('servitors').update({ sigil_path: path }).eq('id', servitorId)
-- // exibir: createSignedUrl(path, 3600)
--
-- // recarregar (após o ritual)
-- await supabase.rpc('recharge_servitor', { p_servitor: id })
--
-- // editar / apagar
-- await supabase.from('servitors').update({ name, description,
--   recharge_interval_days }).eq('id', id)
-- await supabase.from('servitors').delete().eq('id', id)
-- ───────────────────────────────────────────────────────────────────
