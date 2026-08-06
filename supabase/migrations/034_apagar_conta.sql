-- 034_apagar_conta.sql
-- Direito de eliminacao (LGPD art. 18, VI): o proprio usuario apaga a
-- conta, sem depender de pedido por e-mail.
--
-- COMO FUNCIONA: apagar a linha em auth.users dispara as cascatas que
-- ja existem — profiles, user_items, user_spells, spell_journal,
-- servitors, sigils, friendships, dm_messages, item_trades,
-- quest_submissions, coin_ledger, entitlements e circle_passes. Nao e
-- preciso listar tabela por tabela, e nao ha risco de esquecer uma.
--
-- ORDEM IMPORTA: os arquivos no Storage (sigilos dos servidores em
-- servidores/{uid}/) NAO saem por cascata do banco. O front precisa
-- apaga-los ANTES de chamar esta funcao, enquanto a sessao ainda
-- existe.
--
-- O QUE NAO E APAGADO, DE PROPOSITO: webhook_events guarda o registro
-- das compras, com base legal propria (obrigacao fiscal e prova de
-- relacao de consumo). Isso precisa estar dito na politica de
-- privacidade. Apagar esses registros deixaria voce sem como provar
-- uma venda em caso de disputa.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'nao_autenticado'
      using hint = 'É preciso estar autenticado para apagar a conta.';
  end if;

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

comment on function public.delete_my_account() is
  'Apaga a conta do proprio usuario. Os arquivos do Storage devem ser removidos pelo front antes da chamada.';
