-- 036_diretrizes_correspondencias.sql
-- As Correspondencias passam a ter diretrizes proprias, em vez de
-- exibir o texto do forum.
--
-- POR QUE NAO BASTAVA TROCAR O TITULO: o corpo de forum_guidelines
-- fala em publicar, em vitrine de servicos e em parcerias — coisas do
-- forum. Exibi-lo numa tela de mensagem privada com outro cabecalho
-- deixaria o resto incoerente.
--
-- POR QUE PRECISA DE ACEITE PROPRIO: can_send_dm exigia aceite das
-- diretrizes DO FORUM para liberar mensagem. Se o texto mostrado passa
-- a ser outro, o aceite tem que apontar para esse outro — senao a
-- pessoa aceita um documento e o registro guarda outro.
--
-- AS DIRETRIZES DO FORUM NAO MUDAM. Esta migracao nao toca em
-- forum_guidelines nem em guideline_acceptances.
--
-- CONSEQUENCIA: quem ja aceitou as diretrizes do forum para mandar
-- mensagem vai precisar aceitar estas uma vez. O card de aceite ja
-- existe na tela de Correspondencias, entao e so ele passar a apontar
-- para o documento novo.

create table public.dm_guidelines (
  version     smallint primary key,
  body        text not null,
  created_at  timestamptz default now()
);

create table public.dm_guideline_acceptances (
  user_id     uuid not null references auth.users(id) on delete cascade,
  version     smallint not null references public.dm_guidelines(version),
  accepted_at timestamptz default now(),
  primary key (user_id, version)
);

alter table public.dm_guidelines enable row level security;
create policy "diretrizes dm: autenticados leem" on public.dm_guidelines
  for select using (auth.uid() is not null);

alter table public.dm_guideline_acceptances enable row level security;
create policy "aceites dm: dono le"   on public.dm_guideline_acceptances
  for select using (auth.uid() = user_id);
create policy "aceites dm: dono cria" on public.dm_guideline_acceptances
  for insert with check (auth.uid() = user_id);


insert into public.dm_guidelines (version, body) values (1, $md$
# Diretrizes para Correspondências

As correspondências são cartas entre praticantes que já se
reconheceram como amigos. Ao enviar a primeira, você concorda com:

1. **Saúde em primeiro lugar.** Não recomende a ninguém práticas
   perigosas à saúde física ou mental: jejuns extremos, privação de
   sono, uso de substâncias, automutilação ou qualquer prática de
   risco. Trabalho energético e ritual sempre dentro de limites
   seguros.
2. **Magia não substitui medicina.** Compartilhar a própria
   experiência é bem-vindo; aconselhar alguém a abandonar tratamento
   médico ou psicológico, não.
3. **Nada contra terceiros.** É proibido combinar ou solicitar
   trabalhos voltados a prejudicar, coagir ou vigiar pessoas
   específicas.
4. **Respeito entre tradições.** Discorde de ideias sem atacar quem
   as sustenta.
5. **Sem dados pessoais.** Não peça nem envie endereço, telefone,
   documento ou dado de pagamento — nem seus, nem de terceiros. Uma
   correspondência não é o lugar para isso.
6. **Sem comércio.** As correspondências não servem para oferecer
   serviços pagos, consultas ou venda de materiais.
7. **Respeite o silêncio.** Se alguém não responde, não insista.
   Insistência é assédio.
8. **Honestidade.** Distinga o que é relato pessoal, o que é
   tradição, e o que é afirmação verificável. O mesmo padrão dos
   grimórios Baltazar.

Qualquer mensagem pode ser denunciada por quem a recebeu. Denúncias
procedentes podem levar à suspensão do envio de correspondências.

Desfazer a amizade encerra a troca de mensagens.
$md$);


-- ───────────────────────────────────────────────────────────────────
-- can_send_dm passa a exigir o aceite DESTAS diretrizes.
-- Continuam valendo, de proposito: amizade aceita (anti-spam
-- estrutural) e ausencia de suspensao. O passe do Circulo NAO e
-- exigido — mensagens sao do plano gratuito desde a migracao 021.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.can_send_dm(p_sender uuid, p_recipient uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select public.are_friends(p_sender, p_recipient)
     and exists (
       select 1 from public.dm_guideline_acceptances ga
        where ga.user_id = p_sender
          and ga.version = (select max(version) from public.dm_guidelines)
     )
     and not exists (
       select 1 from public.messaging_suspensions ms
        where ms.user_id = p_sender and ms.until > now()
     );
$$;
