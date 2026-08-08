-- 043_tarot_espadas.sql
-- O naipe de Espadas: ar, pensamento, palavra, conflito. Catorze cartas.
--
-- E o naipe mais dificil de escrever sem cair no dramalhao. As cartas
-- duras deste naipe — sobretudo o Nove e o Dez — sao justamente as que
-- alguem em sofrimento tem chance de tirar num dia ruim. Os verbetes
-- foram escritos para serem honestos sobre a dor sem amplifica-la, e
-- para apontar para fora do quarto escuro em vez de decora-lo.
--
-- Mesma voz dos demais: nenhum verbete preve nada.
--
-- OBS: o editor do Supabase vai avisar de "UPDATE sem WHERE". Falso
-- positivo — os catorze comandos terminam com where slug = '...'.

update public.tarot_cards set
upright = $t$Corte limpo. O Ás de Espadas é a mão que ergue a lâmina coroada: a clareza que chega de uma vez, a decisão tomada, a verdade que finalmente se deixa dizer.

É a carta mais afiada do baralho, e afiar serve para separar. Depois dela, alguma coisa fica de um lado e alguma coisa fica do outro.

Que verdade você já formulou por dentro e ainda não disse em voz alta?$t$,
reversed = $t$Clareza usada como arma, ou clareza que não vem. Invertido, o Ás de Espadas fala tanto da franqueza que fere sem necessidade quanto da confusão que persiste porque decidir custa caro.

Também aparece quando o argumento está bom e a conclusão, errada.$t$
where slug = 'as-de-espadas';

update public.tarot_cards set
upright = $t$Duas espadas cruzadas sobre o peito e uma venda nos olhos. O Dois de Espadas é o impasse mantido pela recusa de olhar: enquanto não se enxerga, não é preciso escolher.

É uma trégua, e tréguas têm função. Mas a venda foi posta por quem a usa.

O que você decidiria se permitisse a si mesmo saber o que já sabe?$t$,
reversed = $t$A venda caindo, ou a paralisia se aprofundando. Invertido, o Dois de Espadas marca o momento em que a informação evitada chega assim mesmo — ou aquele em que o impasse já dura tanto que virou o problema principal.$t$
where slug = 'dois-de-espadas';

update public.tarot_cards set
upright = $t$A dor que veio de uma verdade. Três espadas atravessam um coração sob a chuva — e a imagem é direta de propósito: algumas coisas machucam porque são reais, não porque foram mal interpretadas.

Esta carta não pede que você relativize. Pede que você reconheça o corte, e note que a chuva também lava.

O que aconteceu que você ainda descreve com eufemismo?$t$,
reversed = $t$A cicatrização, ou a ferida remoída. Invertido, o Três de Espadas costuma marcar quem já está saindo da dor — as espadas afrouxam — e também quem repete a mágoa mentalmente para não ter que largá-la.

Doer menos não é trair o que se sentiu.$t$
where slug = 'tres-de-espadas';

update public.tarot_cards set
upright = $t$Repouso obrigatório. A figura jaz imóvel com três espadas na parede e uma ao lado — não é morte, é convalescença.

Depois do golpe vem a pausa, e ela não é opcional. Tentar seguir sem ela apenas adia.

Do que você precisa se afastar por um tempo, sem transformar isso em desistência?$t$,
reversed = $t$O fim do descanso, ou o descanso que não acontece. Invertido, o Quatro de Espadas fala de quem já pode voltar e hesita, e também de quem se recusa a parar e coleciona pequenos colapsos.

Corpo cansado não negocia para sempre.$t$
where slug = 'quatro-de-espadas';

update public.tarot_cards set
upright = $t$Vitória que custou caro. A figura recolhe as espadas com um sorriso enquanto dois vultos se afastam de costas — ganhou a discussão e perdeu alguma coisa junto.

É a carta do conflito em que estar certo não bastava. Pergunta pelo preço, não pelo resultado.

Que discussão você venceu e ainda assim saiu pior?$t$,
reversed = $t$O reconhecimento do preço, ou a derrota mal digerida. Invertido, o Cinco de Espadas marca quem enfim admite ter exagerado, quem procura reparar — e também quem continua remoendo uma disputa que já acabou.$t$
where slug = 'cinco-de-espadas';

update public.tarot_cards set
upright = $t$A travessia. Um barqueiro conduz duas figuras por água calma, com as espadas fincadas na proa — leva-se o que doeu, mas se está indo embora.

É a carta da passagem para um lugar mais tranquilo, e ela é sóbria, não festiva. Ninguém nesse barco está feliz; estão apenas melhores do que na margem que deixaram.

Que travessia você já começou e ainda não admitiu para si mesmo?$t$,
reversed = $t$A partida adiada ou a viagem que não alivia. Invertido, o Seis de Espadas fala de quem está preso na margem antiga por circunstância ou por medo, e também de quem muda de lugar levando intacto o que causava o problema.$t$
where slug = 'seis-de-espadas';

update public.tarot_cards set
upright = $t$Sair sem confrontar. A figura carrega cinco espadas do acampamento e deixa duas para trás, olhando por cima do ombro — a carta da esperteza, da retirada silenciosa, do que se resolve pelo desvio.

Nem sempre é desonestidade. Às vezes é a estratégia de quem sabe que não vence no enfrentamento direto. Mas duas espadas ficaram.

O que você está evitando dizer de frente, e a que custo?$t$,
reversed = $t$O flagra, o arrependimento, ou a decisão de assumir. Invertido, o Sete de Espadas costuma marcar quem devolve o que pegou — literal ou não — e também quem foi descoberto e agora precisa lidar com isso.$t$
where slug = 'sete-de-espadas';

update public.tarot_cards set
upright = $t$Amarrada, vendada, cercada por oito espadas — e os pés estão livres, e há espaço entre as lâminas.

É a carta da limitação que se sustenta pela crença de que não há saída. Ela não nega que a situação seja difícil; aponta que a prisão é menos fechada do que parece de dentro.

Que passo você não dá porque decidiu de antemão que não daria certo?$t$,
reversed = $t$A soltura, ou o aperto. Invertido, o Oito de Espadas marca quem começa a se desamarrar — e o começo costuma ser pequeno, um único movimento — e também quem apertou mais os próprios nós ao tentar resolver tudo de uma vez.$t$
where slug = 'oito-de-espadas';

update public.tarot_cards set
upright = $t$O sofrimento das três da manhã. A figura senta na cama com o rosto nas mãos, e as nove espadas estão na parede — não sobre ela.

É a carta da angústia que a mente fabrica no escuro, onde tudo tem o pior tamanho possível. A aflição é real; a proporção, quase nunca.

Não decida nada nesse estado. Anote a preocupação, durma se der, e leia de novo à luz do dia — e se ela continuar do mesmo tamanho depois de dias, isso é sinal de procurar alguém com quem falar, não de resolver sozinho.$t$,
reversed = $t$O amanhecer, ou a noite que se estende. Invertido, o Nove de Espadas costuma indicar que o pior já passou e a mente ainda não percebeu — mas também aparece quando a angústia deixou de ser episódio e virou paisagem.

Se for esse o caso, o que a carta pede não é interpretação. É ajuda de gente de verdade.$t$
where slug = 'nove-de-espadas';

update public.tarot_cards set
upright = $t$O fundo. Dez espadas nas costas, e nada mais a perder por esse caminho — a carta do fim que não deixa dúvida.

Ela é dura e tem uma misericórdia própria: acabou. Não há mais o que sustentar, defender ou adiar. E ao fundo da imagem, o céu já está clareando.

O que na tua vida terminou de forma tão completa que já não exige nada de você?$t$,
reversed = $t$O levantar. Invertido, o Dez de Espadas quase sempre é melhor que direito: é o corpo se erguendo depois do que parecia definitivo, a recuperação lenta, o retorno.

Na leitura menos generosa, é a resistência a aceitar um fim que já se consumou.$t$
where slug = 'dez-de-espadas';

update public.tarot_cards set
upright = $t$Vigilância curiosa. O Valete de Espadas fica em terreno aberto com a lâmina erguida, olhando para todos os lados — a carta de quem quer entender, pergunta demais e ainda não sabe a hora de calar.

É a inteligência sem experiência: afiada, rápida, e sem noção do próprio alcance.

O que você precisa investigar antes de opinar?$t$,
reversed = $t$Curiosidade que vira intromissão, ou palavra que sai antes da hora. Invertido, o Valete de Espadas fala de fofoca, de julgamento apressado, e também de quem se informa muito e nunca conclui nada.$t$
where slug = 'valete-de-espadas';

update public.tarot_cards set
upright = $t$Investida. O Cavaleiro de Espadas avança a galope com a lâmina à frente, e é a figura mais veloz do baralho — decisão tomada, discussão comprada, sem tempo para hesitação.

Ele resolve o que a demora estragava, e atropela o que exigia cuidado. As duas coisas, sempre.

Onde a tua pressa está ajudando, e onde já passou do ponto?$t$,
reversed = $t$Ímpeto sem direção. Invertido, o Cavaleiro de Espadas é a agressividade que perdeu o alvo, a briga comprada por hábito, a palavra dita para ferir e disfarçada de sinceridade.

Também marca a energia que se dissipou antes de chegar a lugar nenhum.$t$
where slug = 'cavaleiro-de-espadas';

update public.tarot_cards set
upright = $t$Lucidez comprada com experiência. A Rainha de Espadas senta com a lâmina reta e a mão estendida — vê com clareza porque já passou por coisas, e não se ilude mais com facilidade.

É a carta do discernimento sem crueldade: dizer a verdade sem usá-la para machucar exige mais habilidade do que qualquer das duas isoladas.

De quem você precisa ouvir uma opinião honesta, mesmo que incômoda?$t$,
reversed = $t$Lucidez que azedou. Invertida, a Rainha de Espadas mostra a inteligência a serviço da amargura — o cinismo confundido com maturidade, a crítica que já não constrói nada.

Também aparece em quem se protege tanto que não deixa mais ninguém chegar.$t$
where slug = 'rainha-de-espadas';

update public.tarot_cards set
upright = $t$Autoridade do julgamento. O Rei de Espadas senta ereto, lâmina para cima — a carta da lei, do princípio, da decisão tomada por critério e não por vontade.

Ele é justo e não é caloroso. Serve exatamente para os momentos em que o afeto atrapalharia a avaliação.

Que decisão sua precisa de um critério, e não de um sentimento?$t$,
reversed = $t$Rigidez ou abuso da razão. Invertido, o Rei de Espadas é a norma aplicada sem contexto, o argumento usado para dominar, a frieza vendida como imparcialidade.

Também marca quem se refugia na lógica para não sentir o que está sentindo.$t$
where slug = 'rei-de-espadas';
