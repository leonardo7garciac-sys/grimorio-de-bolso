-- 045_tarot_ouros.sql
-- O naipe de Ouros: terra, trabalho, corpo, dinheiro, o que se
-- constroi com tempo. Catorze cartas.
--
-- Com esta migracao o baralho fica COMPLETO: 78 cartas com verbete, e
-- draw_tarot passa a sortear entre todas. A Cruz Celta deixa de puxar
-- dez de um conjunto pequeno, e as repeticoes entre tiragens caem.
--
-- OBS: o editor do Supabase vai avisar de "UPDATE sem WHERE". Falso
-- positivo — os catorze comandos terminam com where slug = '...'.

update public.tarot_cards set
upright = $t$Uma oportunidade concreta. O Ás de Ouros é a mão que oferece a moeda sobre um jardim — o começo no terreno mais palpável: trabalho, dinheiro, saúde, um lugar para morar.

Diferente dos outros ases, este vem com prazo e com preço. Oportunidade material não espera indefinidamente.

O que apareceu na tua frente que exige que você faça alguma coisa a respeito?$t$,
reversed = $t$Chance perdida ou mal avaliada. Invertido, o Ás de Ouros fala da oportunidade que passou enquanto se pensava, e também daquela que parecia boa e não se sustenta ao ser examinada de perto.

Vale olhar duas vezes antes de lamentar ou de aceitar.$t$
where slug = 'as-de-ouros';

update public.tarot_cards set
upright = $t$Equilibrar duas coisas ao mesmo tempo. A figura dança segurando duas moedas ligadas por uma fita infinita, com navios balançando ao fundo — mantém-se, mas o mar não está calmo.

É a carta de quem administra demandas concorrentes e consegue. Consegue enquanto continuar dançando.

O que você está sustentando com esforço que ninguém vê?$t$,
reversed = $t$Malabarismo que cai. Invertido, o Dois de Ouros marca o excesso de frentes abertas, a conta que não fecha, o momento em que manter tudo em pé deixou de ser possível.

Costuma pedir que se solte uma bola de propósito, antes que caiam todas.$t$
where slug = 'dois-de-ouros';

update public.tarot_cards set
upright = $t$Ofício reconhecido. Um artesão trabalha na catedral enquanto dois outros consultam a planta — a carta da competência que os outros enxergam, e do trabalho que só existe em colaboração.

Ela marca o fim do aprendizado solitário: alguém confiou em você para fazer.

Que trabalho você faz bem e ainda não tratou como ofício?$t$,
reversed = $t$Trabalho sem sintonia, ou sem qualidade. Invertido, o Três de Ouros fala da equipe em que cada um puxa para um lado, do esforço que não é reconhecido, e também da entrega feita sem cuidado por pressa ou desânimo.$t$
where slug = 'tres-de-ouros';

update public.tarot_cards set
upright = $t$Segurar firme. A figura abraça uma moeda, pisa em duas e equilibra outra na cabeça — não sobra mão para mais nada.

É a carta da segurança conquistada pelo aperto: guardar, controlar, não arriscar. Faz sentido para quem já passou por falta, e cobra um preço em movimento.

O que você está segurando com tanta força que já não consegue usar?$t$,
reversed = $t$Ou a mão afrouxa, ou aperta mais. Invertido, o Quatro de Ouros marca quem começa a soltar — gastar, doar, arriscar de novo — e também quem apertou a ponto de a avareza virar o problema principal.$t$
where slug = 'quatro-de-ouros';

update public.tarot_cards set
upright = $t$Falta, e a janela acesa. Duas figuras atravessam a neve diante de um vitral iluminado — e passam direto, sem olhar.

Essa é a carta inteira: a privação é real, e há socorro por perto que não está sendo visto ou não está sendo pedido. Orgulho, vergonha e cansaço fecham portas que estavam abertas.

De quem você não pediu ajuda porque preferiu não pedir?$t$,
reversed = $t$A recuperação, ou o fundo. Invertido, o Cinco de Ouros costuma indicar quem enfim entra na igreja — pede, aceita, se acolhe — e também o aprofundamento do isolamento em quem decidiu que ninguém vai ajudar mesmo.$t$
where slug = 'cinco-de-ouros';

update public.tarot_cards set
upright = $t$Dar e receber, com uma balança na mão. O mercador distribui moedas a dois mendigos e pesa o que dá — a carta da generosidade que existe, e da relação desigual que ela cria.

Vale notar quem segura a balança. Toda ajuda tem uma direção, e ela costuma ser lembrada.

Nesta situação, você está dando ou recebendo — e isso está te servindo?$t$,
reversed = $t$Troca desequilibrada. Invertido, o Seis de Ouros fala da caridade com cobrança embutida, da dívida que nunca se quita, e da dependência que se instalou onde deveria haver ajuda temporária.$t$
where slug = 'seis-de-ouros';

update public.tarot_cards set
upright = $t$Parar para olhar a plantação. A figura se apoia na enxada e contempla o que cresceu — não é colheita ainda, é avaliação.

É a carta da paciência de quem investiu e precisa esperar, e do momento honesto de perguntar se vale continuar regando isto.

O que você vem cultivando há tempo demais sem conferir se ainda dá fruto?$t$,
reversed = $t$Impaciência ou investimento perdido. Invertido, o Sete de Ouros marca quem colhe antes da hora por ansiedade, e também quem reconhece que aquele plantio não vai render e insiste porque já gastou muito nele.

O que já foi gasto não volta por insistência.$t$
where slug = 'sete-de-ouros';

update public.tarot_cards set
upright = $t$Repetição que constrói. O artesão cinzela a oitava moeda, as anteriores penduradas ao lado — a carta do treino, do aprimoramento, do trabalho feito muitas vezes até sair bom.

Não é glamorosa e é a mais confiável do baralho. O que se domina, domina-se assim.

Que prática você faria melhor se simplesmente fizesse mais vezes?$t$,
reversed = $t$Repetição sem avanço. Invertido, o Oito de Ouros fala do trabalho mecânico que já não ensina nada, do perfeccionismo que impede terminar, e também de quem quer o resultado sem atravessar a parte tediosa.$t$
where slug = 'oito-de-ouros';

update public.tarot_cards set
upright = $t$Independência conquistada. A figura passeia sozinha pelo próprio jardim, com uma ave de caça na mão enluvada — sofisticação, autonomia, o conforto que veio de trabalho e não de sorte.

A ave encapuzada é o detalhe: houve disciplina aqui, e um instinto que foi domado para chegar até isto.

O que você construiu sozinho e ainda trata como pouco?$t$,
reversed = $t$Autonomia que virou isolamento, ou conforto sem base. Invertido, o Nove de Ouros fala de quem se basta a ponto de não deixar ninguém entrar, e também da aparência de segurança sustentada por dívida ou por outro alguém.$t$
where slug = 'nove-de-ouros';

update public.tarot_cards set
upright = $t$O que dura além de você. Três gerações no pátio, cães, o brasão na parede — a carta do patrimônio, da família, da estrutura que sustenta quem vem depois.

É a mais estável do baralho, e a que menos fala de você sozinho. Aqui o que importa é o que atravessa o tempo.

O que você está construindo que continua sem a tua presença?$t$,
reversed = $t$Herança pesada ou estrutura em risco. Invertido, o Dez de Ouros fala da família que aprisiona, do legado recebido como obrigação, e da segurança material que se revelou menos sólida do que parecia.$t$
where slug = 'dez-de-ouros';

update public.tarot_cards set
upright = $t$Aprender com as mãos. O Valete de Ouros examina a moeda com atenção, parado num campo — a carta do estudo, do estágio, do começo de um ofício que se leva a sério.

Ele é o mais aplicado dos valetes e o mais lento. Aqui não há atalho, e não deveria haver.

O que você quer aprender e vem adiando por achar que já passou da idade?$t$,
reversed = $t$Estudo que não avança. Invertido, o Valete de Ouros fala de quem se prepara indefinidamente sem nunca aplicar, da falta de foco, e também da oportunidade prática desperdiçada por desatenção.$t$
where slug = 'valete-de-ouros';

update public.tarot_cards set
upright = $t$Passo firme, sem pressa. O Cavaleiro de Ouros é o único parado — cavalo plantado, moeda na mão, olhando o campo arado.

É o mais confiável dos cavaleiros: faz o combinado, no prazo, sem drama. Não empolga ninguém e termina o que começa.

Onde a tua vida pediria constância, e você vem tentando resolver com surto de esforço?$t$,
reversed = $t$Constância que virou estagnação. Invertido, o Cavaleiro de Ouros mostra a rotina sem propósito, o trabalho feito no piloto automático, a inércia confundida com prudência.

Também marca a lentidão que já custou uma oportunidade.$t$
where slug = 'cavaleiro-de-ouros';

update public.tarot_cards set
upright = $t$Cuidado prático. A Rainha de Ouros segura a moeda como quem segura um filho, cercada de vegetação e com um coelho aos pés — a carta de quem cuida do concreto: do corpo, da casa, das contas, de quem depende dela.

É generosidade com pé no chão. Ela alimenta as pessoas de verdade, não em palavras.

De que parte prática da tua vida você anda cuidando mal?$t$,
reversed = $t$Cuidado que se perde. Invertida, a Rainha de Ouros mostra quem cuida de tudo e de si não cuida, quem se afoga em tarefa doméstica, e também quem confunde prover com estar presente.$t$
where slug = 'rainha-de-ouros';

update public.tarot_cards set
upright = $t$Domínio do material. O Rei de Ouros senta entre videiras, moeda na mão e o castelo que construiu ao fundo — a carta de quem transformou trabalho em estrutura duradoura.

Ele é generoso porque pode ser, e realista porque aprendeu. Sabe quanto custa cada coisa.

Que decisão sua ficaria melhor se você calculasse em vez de esperar dar certo?$t$,
reversed = $t$Domínio que vira posse. Invertido, o Rei de Ouros mostra quem mede tudo em dinheiro, quem controla os outros pelo que provê, e também quem perdeu o chão material e não sabe existir sem ele.$t$
where slug = 'rei-de-ouros';
