-- 047_dominio_permanente_e_portao.sql
-- Duas mudanças ligadas:
-- (1) o XP de domínio deixa de derivar do estado atual de user_spells e passa
--     a vir de um registro imutável (spell_mastery), no mesmo espírito do
--     coin_ledger — deixar de rastrear não apaga mais o que foi conquistado;
-- (2) marcar como dominado passa por um portão no gatilho: lastro de prática
--     no diário e teto diário. O portão vive no banco porque o front escreve
--     direto em user_spells pelas policies de RLS.

-- ══════════════════════════════════════════════════════════════
-- 1. Registro imutável de domínio
-- ══════════════════════════════════════════════════════════════
create table if not exists public.spell_mastery (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  spell_id    uuid references public.spells(id) on delete set null,
  spell_name  text not null,
  xp_awarded  integer not null default 0,
  mastered_at timestamptz not null default now()
);

-- spell_id é anulável de propósito: apagar uma técnica do catálogo passa a
-- preservar o histórico de quem já a dominou, em vez de levar o XP junto.
create unique index if not exists spell_mastery_user_spell_key
  on public.spell_mastery (user_id, spell_id);

create index if not exists spell_mastery_user_data_idx
  on public.spell_mastery (user_id, mastered_at);

alter table public.spell_mastery enable row level security;

drop policy if exists "spell_mastery: dono le" on public.spell_mastery;
create policy "spell_mastery: dono le" on public.spell_mastery
  for select using (auth.uid() = user_id);
-- Sem policy de insert/update/delete: só o gatilho (security definer) escreve.

-- ══════════════════════════════════════════════════════════════
-- 2. Backfill do que já foi dominado
-- ══════════════════════════════════════════════════════════════
insert into public.spell_mastery (user_id, spell_id, spell_name, xp_awarded, mastered_at)
select us.user_id, us.spell_id, s.name, s.xp_reward, coalesce(us.mastered_at, now())
from public.user_spells us
join public.spells s on s.id = us.spell_id
where us.status = 'dominado'
  and s.owner_id is null
on conflict (user_id, spell_id) do nothing;

-- ══════════════════════════════════════════════════════════════
-- 3. XP passa a somar do registro, não do estado
-- ══════════════════════════════════════════════════════════════
create or replace function public.recalc_progression(p_user uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_xp    integer;
  v_title smallint;
begin
  select coalesce(sum(m.xp_awarded), 0)
    into v_xp
    from public.spell_mastery m
   where m.user_id = p_user;

  select id into v_title
    from public.titles
   where min_xp <= v_xp
   order by min_xp desc
   limit 1;

  update public.profiles
     set xp_total   = v_xp,
         title_id   = coalesce(v_title, 0),
         updated_at = now()
   where id = p_user;
end;
$function$;

-- ══════════════════════════════════════════════════════════════
-- 4. Portão de domínio + carimbo (BEFORE)
-- ══════════════════════════════════════════════════════════════
create or replace function public.on_user_spell_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_owner uuid;
  v_xp    integer;
  v_name  text;
  v_dias  integer;
  v_hoje  integer;
  c_dias_minimos constant integer := 3;  -- dias distintos de diário exigidos
  c_teto_diario  constant integer := 2;  -- domínios por dia
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then

    if new.status = 'dominado'
       and (tg_op = 'INSERT' or old.status is distinct from 'dominado') then

      select s.owner_id, s.xp_reward, s.name
        into v_owner, v_xp, v_name
        from public.spells s
       where s.id = new.spell_id;

      -- O portão vale só para o catálogo Baltazar. Técnica pessoal não dá XP
      -- e não deve ganhar atrito.
      if v_owner is null then

        select count(distinct (sj.created_at at time zone 'America/Sao_Paulo')::date)
          into v_dias
          from public.spell_journal sj
         where sj.user_id = new.user_id
           and sj.spell_id = new.spell_id;

        if v_dias < c_dias_minimos then
          raise exception 'lastro_insuficiente'
            using hint = format(
              'Registra a prática desta técnica no diário em pelo menos %s dias diferentes antes de marcá-la como dominada. Hoje somam %s.',
              c_dias_minimos, v_dias);
        end if;

        select count(*)
          into v_hoje
          from public.spell_mastery m
         where m.user_id = new.user_id
           and m.mastered_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo')
                                 at time zone 'America/Sao_Paulo';

        if v_hoje >= c_teto_diario then
          raise exception 'teto_diario_de_dominio'
            using hint = format(
              'Já dominaste %s técnicas hoje; o limite é %s por dia. O domínio pede assentamento — volta amanhã.',
              v_hoje, c_teto_diario);
        end if;

        -- Registro imutável. Remarcar a mesma técnica não concede XP de novo
        -- nem consome o teto, porque esbarra no índice único.
        insert into public.spell_mastery (user_id, spell_id, spell_name, xp_awarded)
        values (new.user_id, new.spell_id, v_name, coalesce(v_xp, 0))
        on conflict (user_id, spell_id) do nothing;
      end if;

      new.mastered_at := now();

    elsif new.status <> 'dominado' then
      -- Volta a praticar: o acompanhamento muda, o histórico em
      -- spell_mastery permanece.
      new.mastered_at := null;
    end if;

    new.updated_at := now();
  end if;

  return new;
end;
$function$;

-- ══════════════════════════════════════════════════════════════
-- 5. Recálculo separado (AFTER), para ler a linha já gravada
-- ══════════════════════════════════════════════════════════════
create or replace function public.on_user_spell_recalc()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  perform public.recalc_progression(coalesce(new.user_id, old.user_id));
  return null;
end;
$function$;

drop trigger if exists trg_user_spell_change on public.user_spells;
create trigger trg_user_spell_change
  before insert or update on public.user_spells
  for each row execute function public.on_user_spell_change();

drop trigger if exists trg_user_spell_recalc on public.user_spells;
create trigger trg_user_spell_recalc
  after insert or update or delete on public.user_spells
  for each row execute function public.on_user_spell_recalc();

-- ══════════════════════════════════════════════════════════════
-- 6. Conferência
-- ══════════════════════════════════════════════════════════════
-- Domínios registrados por usuário e XP resultante:
select p.nickname, count(m.*) as dominios, coalesce(sum(m.xp_awarded), 0) as xp_registro, p.xp_total
from public.profiles p
left join public.spell_mastery m on m.user_id = p.id
group by p.id, p.nickname, p.xp_total
order by xp_registro desc;
