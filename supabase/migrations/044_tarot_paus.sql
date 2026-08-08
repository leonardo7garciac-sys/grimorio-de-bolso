-- 044_tarot_paus.sql
-- O naipe de Paus: fogo, vontade, iniciativa, o que se poe em
-- movimento. Catorze cartas.
--
-- Mesma voz dos demais naipes: nenhum verbete preve nada.
--
-- OBS: o editor do Supabase vai avisar de "UPDATE sem WHERE". Falso
-- positivo — os catorze comandos terminam com where slug = '...'.

update public.tarot_cards set
upright = $t$Uma faísca oferecida. O Ás de Paus é a mão que estende o bastão ainda brotando folhas: energia bruta, entusiasmo antes de qualquer plano, a vontade de fazer que aparece antes de saber o quê.

É o começo com combustível. Ainda não há direção, e tudo bem — direção se acha andando.

O que te dá vontade de levantar, e você vem tratando como distração?$t$,
reversed = $t$Impulso que não pega. Invertido, o Ás de Paus fala do entusiasmo que morre no dia seguinte, do projeto anunciado e não começado, ou do cansaço que apagou a chama piloto.

Também aparece quando a energia existe e está sendo gasta na coisa errada.$t$
where slug = 'as-de-paus';

update public.tarot_cards set
upright = $t$O mundo na mão e os pés ainda em casa. A figura olha o horizonte da própria muralha, segurando um globo — decidiu que vai, ainda não saiu.

É a carta do planejamento com ambição, do momento entre a ideia e a partida. Legítimo, e com prazo de validade.

Você está planejando ou está adiando?$t$,
reversed = $t$Plano que não vira viagem. Invertido, o Dois de Paus mostra quem fica na muralha indefinidamente, e também quem parte sem preparo nenhum e descobre o custo depois.

Medo de errar e pressa de sair produzem o mesmo resultado por caminhos opostos.$t$
where slug = 'dois-de-paus';

update public.tarot_cards set
upright = $t$Os navios já partiram. A figura observa o mar de costas para nós, com três bastões fincados — o trabalho foi feito, foi lançado, e agora depende de coisas que não estão mais sob controle.

É a carta da espera ativa, aquela em que não há o que fazer além de continuar de pé olhando.

O que você já colocou no mundo e ainda está esperando voltar?$t$,
reversed = $t$Retorno que demora ou não vem. Invertido, o Três de Paus fala do plano que não rendeu o previsto, do alcance menor do que se esperava, ou da ansiedade de quem confere o horizonte de hora em hora.

Também pode marcar o momento de reconhecer que aquele navio não volta.$t$
where slug = 'tres-de-paus';

update public.tarot_cards set
upright = $t$Uma soleira festiva. Quatro bastões sustentam uma guirlanda e há gente comemorando ao fundo — a carta da etapa concluída, do lar estabelecido, do alívio que merece ser celebrado.

Não é o fim de tudo, é um marco. E marcos existem para serem reconhecidos, senão a vida vira uma fila de tarefas.

O que você conquistou e passou batido sem comemorar?$t$,
reversed = $t$Celebração adiada ou base instável. Invertido, o Quatro de Paus fala da conquista que não se deixou sentir, da casa que não virou lar, ou da estrutura montada às pressas que ainda pede reforço.$t$
where slug = 'quatro-de-paus';

update public.tarot_cards set
upright = $t$Cinco pessoas brandindo bastões, e não dá para saber se brigam ou treinam. É essa a carta: o atrito confuso, a competição sem regras claras, a discussão em que todos falam ao mesmo tempo.

Raramente é guerra. Quase sempre é bagunça — e bagunça também cansa.

Nesse conflito, o que você está defendendo de fato?$t$,
reversed = $t$Ou a poeira baixou, ou o conflito foi para debaixo do tapete. Invertido, o Cinco de Paus marca o acordo alcançado, e também a rivalidade que deixou de ser aberta e virou silenciosa — que costuma ser pior.$t$
where slug = 'cinco-de-paus';

update public.tarot_cards set
upright = $t$Reconhecimento público. O cavaleiro coroado atravessa a multidão com o bastão erguido — venceu, e os outros sabem.

É a carta do mérito que apareceu. Ela tem um aviso embutido: quem está sendo aplaudido hoje está sendo observado.

Que trabalho seu merece ser mostrado, e você vem escondendo por modéstia?$t$,
reversed = $t$Vitória sem público, ou aplauso que subiu à cabeça. Invertido, o Seis de Paus fala tanto do esforço que ninguém viu quanto da arrogância que se instala depois do sucesso — e da queda que costuma vir junto.$t$
where slug = 'seis-de-paus';

update public.tarot_cards set
upright = $t$Defender a posição. A figura está em terreno elevado, enfrentando seis bastões que sobem de baixo — está em desvantagem numérica e em vantagem de posição.

É a carta de sustentar o que você conquistou quando aparece quem questione. Cansa, e às vezes é exatamente o que precisa ser feito.

O que vale a pena defender, e o que você defende só por teimosia?$t$,
reversed = $t$Defesa que esgotou. Invertido, o Sete de Paus mostra quem já não tem fôlego para continuar segurando, e também quem se defende de ataque que não existe mais.

Vale checar se ainda há alguém subindo o morro.$t$
where slug = 'sete-de-paus';

update public.tarot_cards set
upright = $t$Oito bastões em pleno voo, sem ninguém na imagem. É a única carta do baralho sem figura humana — porque aqui nada depende de você: as coisas estão em movimento.

Notícias chegam, respostas aparecem, o que estava travado destrava. Rápido.

O que você precisa estar pronto para receber?$t$,
reversed = $t$Atraso ou correria sem rumo. Invertido, o Oito de Paus fala da mensagem que não chega, do processo que emperrou — e do oposto, do excesso de coisas acontecendo ao mesmo tempo, em que velocidade vira confusão.$t$
where slug = 'oito-de-paus';

update public.tarot_cards set
upright = $t$Ferido e ainda de pé. A figura tem a cabeça enfaixada e se apoia num bastão, com oito atrás formando uma cerca — já apanhou, e continua guardando.

É a carta da resistência de quem aprendeu na prática. A desconfiança aqui é experiência, não paranoia — mas anda perto.

O que você protege por precaução justa, e o que protege por medo antigo?$t$,
reversed = $t$Exaustão ou muralha desnecessária. Invertido, o Nove de Paus mostra quem já não aguenta continuar em guarda, e também quem defende um território que ninguém mais está tentando tomar.

Baixar a guarda também é decisão, e exige coragem.$t$
where slug = 'nove-de-paus';

update public.tarot_cards set
upright = $t$Carga demais. A figura carrega dez bastões abraçados, sem enxergar à frente, curvada — chegou longe, e a esta altura o peso é maior que o avanço.

Repara no detalhe: os bastões são os mesmos que antes davam impulso. O que era energia virou obrigação.

O que na tua carga não é mais seu, e você continua levando?$t$,
reversed = $t$O momento de largar, ou o colapso. Invertido, o Dez de Paus marca quem finalmente delega, recusa ou solta — e também quem insistiu além do limite e agora paga.

Ninguém entrega prêmio por carregar sozinho.$t$
where slug = 'dez-de-paus';

update public.tarot_cards set
upright = $t$Entusiasmo sem experiência. O Valete de Paus segura o bastão e olha para o alto dele, como quem examina uma ideia que acabou de ter — a carta do começo animado, da curiosidade que quer virar projeto.

Ele ainda não sabe fazer, e essa é a graça. Nesta fase, o que importa é começar mal.

Que ideia você teve e engavetou por não saber executar?$t$,
reversed = $t$Empolgação que não dura. Invertido, o Valete de Paus fala do começo eterno — a pessoa que inicia dez coisas por mês — e também da notícia esperada que não vem.$t$
where slug = 'valete-de-paus';

update public.tarot_cards set
upright = $t$Investida com fogo. O Cavaleiro de Paus galopa com o cavalo empinado — o mais impetuoso do baralho, movido por vontade e não por cálculo.

Ele parte antes de todos, chega antes de todos, e às vezes chega no lugar errado. A energia é real e o alvo é discutível.

Onde vale correr o risco agora, sem esperar estar seguro?$t$,
reversed = $t$Ímpeto que dispersa. Invertido, o Cavaleiro de Paus é a pressa que atropela, a mudança feita por inquietação, o abandono do projeto no meio porque outro pareceu mais interessante.

Também marca a energia bloqueada de quem quer sair e não sai.$t$
where slug = 'cavaleiro-de-paus';

update public.tarot_cards set
upright = $t$Calor que atrai. A Rainha de Paus senta de frente, girassol na mão e um gato preto aos pés — confiança que não precisa gritar, presença que ocupa o espaço sem tomá-lo de ninguém.

É a carta do carisma sustentado por competência, e da generosidade de quem tem energia de sobra.

Onde você diminui a própria presença para não incomodar?$t$,
reversed = $t$Brilho que queima. Invertida, a Rainha de Paus mostra o ciúme, a necessidade de ser o centro, a intensidade que consome quem está por perto — e também a autoconfiança que ruiu e virou insegurança disfarçada.$t$
where slug = 'rainha-de-paus';

update public.tarot_cards set
upright = $t$Visão que mobiliza. O Rei de Paus é quem enxerga onde a coisa pode chegar e consegue fazer outros enxergarem junto — a carta do empreendedor, do líder por entusiasmo e não por cargo.

Ele não administra bem o detalhe. Serve para abrir caminho, não para manter a estrada.

Que visão sua você ainda não contou a ninguém?$t$,
reversed = $t$Autoridade que vira imposição. Invertido, o Rei de Paus mostra quem confunde liderar com mandar, promete mais do que sustenta, ou tem a visão certa e não consegue executá-la.

Também marca a impaciência com quem não acompanha o próprio ritmo.$t$
where slug = 'rei-de-paus';
