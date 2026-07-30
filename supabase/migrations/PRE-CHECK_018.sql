-- ═══════════════════════════════════════════════════════════════════
-- PRE-CHECK antes de rodar 018_webhook_hotmart.sql
-- Só leitura — nenhuma linha aqui altera o banco. Rode as três e leia
-- o resultado antes de prosseguir para o 018.
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. Definição ATUAL de handle_new_user(). O 018 substitui o corpo
--    inteiro dessa função (create or replace). Se o resultado abaixo
--    fizer mais do que "insert into profiles" — conceder moedas
--    iniciais, título, settings, o que for — essa lógica precisa ser
--    incorporada ao novo corpo antes de rodar o 018, senão ela some
--    sem aviso (mesma classe de problema que a view my_grimoires teve
--    com "select g.*").
-- ───────────────────────────────────────────────────────────────────
select pg_get_functiondef('public.handle_new_user()'::regprocedure);

-- ───────────────────────────────────────────────────────────────────
-- 2. Transações duplicadas já existentes em circle_passes.ref_id.
--    O 018 cria "unique index ... on circle_passes (ref_id) where
--    ref_id is not null" — se já existir alguma duplicata hoje, essa
--    criação de índice falha. Deve devolver zero linhas.
-- ───────────────────────────────────────────────────────────────────
select ref_id, count(*)
  from public.circle_passes
 where ref_id is not null
 group by ref_id
having count(*) > 1;

-- ───────────────────────────────────────────────────────────────────
-- 3. Quem hoje tem EXECUTE em grant_circle_pass. "revoke ... from
--    public" (item 6 do 018) só remove a concessão implícita a
--    PUBLIC — se authenticated ou anon tiverem grant EXPLÍCITO
--    separado (não deveriam, mas confira), ele sobrevive ao revoke e
--    precisa ser removido à parte (linhas comentadas no item 6).
-- ───────────────────────────────────────────────────────────────────
select p.proname, p.proacl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname = 'grant_circle_pass';
