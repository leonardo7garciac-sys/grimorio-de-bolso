-- 039_tarot_posicoes.sql
-- Significado das posicoes de cada tiragem.
--
-- Na Cruz Celta a posicao pesa tanto quanto a carta: a mesma Torre lida
-- na base da situacao e a mesma Torre lida no desfecho dizem coisas
-- diferentes. Sem isso, dez cartas viram dez leituras soltas.
--
-- Segue a disposicao de Waite, que e a que acompanha o Rider-Waite-Smith.

create table public.tarot_positions (
  spread      tarot_spread not null,
  posicao     smallint not null,
  name        text not null,
  meaning     text not null,
  primary key (spread, posicao)
);

alter table public.tarot_positions enable row level security;
create policy "posicoes: autenticados leem" on public.tarot_positions
  for select using (auth.uid() is not null);


insert into public.tarot_positions (spread, posicao, name, meaning) values

('uma', 1, 'A carta do dia',
$p$O que pede atenção hoje. Não é previsão do que vai acontecer: é um ângulo oferecido para o dia, e vale mais relida à noite do que interpretada de manhã.$p$),

('tres', 1, 'O que passou',
$p$De onde a situação vem. O que já aconteceu e ainda exerce peso — não para ser remoído, mas para ser reconhecido como origem.$p$),
('tres', 2, 'O que é agora',
$p$O estado atual, com o que ele tem de desconfortável. É a carta que costuma ser a mais difícil de aceitar, porque descreve o presente sem a maquiagem que a gente aplica nele.$p$),
('tres', 3, 'Para onde tende',
$p$A direção que as coisas tomam se nada mudar. Não é destino: é a projeção do que já está em movimento, e existe justamente para poder ser alterada.$p$),

('cruz_celta',  1, 'A situação',
$p$O coração da questão, como ela se apresenta agora. Tudo o mais nesta tiragem se lê em relação a esta carta.$p$),
('cruz_celta',  2, 'O que atravessa',
$p$O obstáculo, ou aquilo que complica. Nem sempre é adversário — às vezes é a força contrária que dá forma ao problema, e sem a qual ele nem existiria.$p$),
('cruz_celta',  3, 'O que coroa',
$p$O melhor que se pode alcançar por este caminho, e o objetivo consciente. É o que você diz querer — e comparar com a carta da base costuma revelar desencontro.$p$),
('cruz_celta',  4, 'A base',
$p$A raiz da questão, o que sustenta tudo por baixo. Costuma ser o motivo verdadeiro, aquele que não se admite com facilidade.$p$),
('cruz_celta',  5, 'O que se afasta',
$p$A influência que está passando. Já foi determinante e está perdendo força — reconhecê-la evita continuar reagindo a algo que já não manda.$p$),
('cruz_celta',  6, 'O que se aproxima',
$p$O que entra em cena a seguir. Não é o desfecho, é o próximo movimento — a onda que já está formada e ainda não quebrou.$p$),
('cruz_celta',  7, 'Você',
$p$Como você se coloca diante da questão. A postura, a defesa, o papel que assumiu — inclusive o que nele é hábito e não escolha.$p$),
('cruz_celta',  8, 'O ambiente',
$p$O que vem de fora: as pessoas envolvidas, o contexto, o que se espera de você. É a carta que mede o quanto do problema é seu e o quanto é do lugar onde ele acontece.$p$),
('cruz_celta',  9, 'Esperanças e medos',
$p$O que você deseja e o que teme, que nesta posição costumam ser a mesma coisa vista de dois lados. É a carta mais desconfortável da tiragem, e a mais reveladora.$p$),
('cruz_celta', 10, 'O desfecho',
$p$Onde isto tende a desembocar, mantidas as condições atuais. Leia como consequência, não como sentença: as nove cartas anteriores descrevem exatamente o que precisaria mudar para que esta fosse outra.$p$);
