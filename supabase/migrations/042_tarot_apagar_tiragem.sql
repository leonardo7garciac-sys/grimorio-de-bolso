-- 042_tarot_apagar_tiragem.sql
-- Fecha uma brecha aberta pelo botao de apagar tiragem.
--
-- A policy de exclusao criada na 037 deixava o dono apagar qualquer
-- tiragem, inclusive a carta do dia de HOJE. Como e o indice unico
-- (user_id, period_key) que garante uma carta por dia, apagar a de hoje
-- libera a chave e permite sortear outra — exatamente o refazer que o
-- desenho se propos a impedir.
--
-- Esconder o botao na tela nao bastaria: a chamada de exclusao continua
-- disponivel pela API do Supabase. A regra tem que viver aqui.
--
-- O que muda: tiragem de tres cartas e Cruz Celta podem ser apagadas
-- sempre. A carta do dia pode ser apagada a partir do dia seguinte —
-- so a de hoje fica protegida.

drop policy if exists "tiragens: dono apaga" on public.tarot_readings;

create policy "tiragens: dono apaga" on public.tarot_readings
  for delete using (
    auth.uid() = user_id
    and not (
      spread = 'uma'
      and period_key = 'D' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')
    )
  );
