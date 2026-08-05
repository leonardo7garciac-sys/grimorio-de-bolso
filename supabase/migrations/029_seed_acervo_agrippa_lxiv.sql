-- 029_seed_acervo_agrippa_lxiv.sql
-- Segundo lote de trechos da mesma obra (agrippa-filosofia-oculta-i):
-- o Capitulo LXIV, sobre as paixoes da alma, a imaginacao e o corpo.
--
-- sort_order de 40 a 80, para nao colidir com os tres do Capitulo I
-- (10, 20 e 30) semeados pela 028.
--
-- ATENCAO: a 028 apaga TODOS os trechos da obra antes de reinserir os
-- dela. Se voce rodar a 028 de novo depois desta, o Capitulo LXIV some.
-- Para evitar, edite o delete da 028 acrescentando "and sort_order < 40".
-- Esta migracao ja usa delete com faixa, e por isso e re-executavel sem
-- afetar o Capitulo I.

delete from public.library_excerpts
 where work_id = (select id from public.library_works
                   where slug = 'agrippa-filosofia-oculta-i')
   and sort_order between 40 and 80;

insert into public.library_excerpts (work_id, heading, body, commentary, sort_order)
select w.id, v.heading, v.body, v.commentary, v.sort_order
from public.library_works w,
(values

('Capítulo LXIV — A imitação: o corpo responde à semelhança',
$b$As paixões mencionadas por vezes alteram o corpo em razão da virtude que a semelhança de uma coisa possui para transformá-lo — virtude que a imaginação intensa põe em movimento —, como quando sentimos os dentes se arrepiarem ao ver ou ouvir algo, ou ao ver, ou imaginar, alguém comendo alimentos ácidos ou azedos. Assim, quem vê outra pessoa bocejar também boceja; e há quem sinta a língua ficar áspera apenas ao ouvir alguém mencionar coisas azedas. Da mesma forma, a visão de algo repugnante provoca náusea. Muitos desmaiam ao ver sangue humano. Alguns, ao verem que se oferece a outrem um alimento amargo, sentem um gosto amargo na própria boca. E Guilherme de Paris relata ter visto um homem que, à simples vista de um medicamento, era afetado tanto quanto queria, embora nem a substância, nem o odor, nem o sabor do remédio chegassem até ele — apenas uma espécie de semelhança era apreendida por ele. É por isso que alguns, ao sonharem, julgam estar queimando em meio ao fogo e sofrem tormentos terríveis, como se de fato ardessem, quando a substância do fogo não está perto deles — apenas uma semelhança apreendida por sua imaginação.$b$,
$c$Este é o trecho de Agrippa mais próximo do que hoje se pode verificar — e a lista dele é quase toda de fenômenos que ganharam nome depois.

O bocejo contagioso é documentado e associado a mecanismos de espelhamento no cérebro. A boca que saliva ao ouvir falar de algo azedo é resposta condicionada, o mesmo terreno que Pavlov exploraria trezentos e cinquenta anos mais tarde. O desmaio diante de sangue tem nome próprio: síncope vasovagal, um reflexo que derruba pressão e frequência cardíaca. A náusea diante do repugnante é resposta de aversão. E o homem de Guilherme de Auvergne, afetado pela mera visão do remédio, é uma das descrições mais antigas do que hoje se chama efeito nocebo — o parente sombrio do placebo, em que a expectativa produz o sintoma.

Repara na assimetria: as observações estão certas, a explicação está errada. Agrippa atribui tudo à virtude da semelhança operando por meio da imaginação. Não é isso que acontece. Mas ele viu os fenômenos, catalogou-os e insistiu que corpo e imaginação não são compartimentos separados — numa época em que dizer isso era heterodoxo.

É a essa altura que o praticante moderno deve prestar atenção. Todo trabalho de visualização, aqui inclusive, aposta exatamente nisto: que o corpo responde ao imaginado. Agrippa não estava fantasiando ao afirmar isso. Estava fantasiando ao explicar por quê.$c$,
40),

('Capítulo LXIV — A transformação: o mecanismo da impressão',
$b$E, por vezes, os corpos dos homens são transformados, transfigurados e até mesmo transportados; isso ocorre frequentemente enquanto sonham, e às vezes quando estão despertos. Assim Cipo, depois de escolhido rei da Itália, muito se maravilhou e meditou sobre a luta e a vitória dos touros, e nesse pensamento dormiu a noite inteira, e pela manhã foi encontrado com chifres — não de outro modo senão pela potência vegetativa que, estimulada por uma imaginação veemente, elevou à cabeça humores geradores de chifres e os produziu. Pois uma cogitação veemente, ao mover intensamente as espécies, delineia a figura da coisa pensada, e elas a representam no sangue, e o sangue imprime essa figura nos membros que nutre — tanto nos do próprio corpo quanto nos de outro. Assim a imaginação de uma mulher grávida imprime no filho a marca daquilo que desejou, e a imaginação de um homem mordido por um cão raivoso imprime em seu corpo a imagem de cães. Assim os homens podem embranquecer de repente. E alguns, pelo sonho de uma única noite, cresceram de meninos a homens feitos. A isso também se podem referir as muitas cicatrizes do rei Dagoberto e as marcas de Francisco, recebidas — as primeiras enquanto ele temia um castigo, e as segundas enquanto meditava maravilhosamente sobre as chagas de Cristo.$b$,
$c$Aqui o capítulo atravessa a fronteira. No trecho anterior Agrippa catalogava fenômenos que hoje têm nome; neste ele propõe um mecanismo e o estica até onde ele não vai.

O mecanismo é este: o pensamento intenso move as espécies — termo escolástico para as formas que a percepção transporta até a alma —, elas imprimem a figura no sangue, e o sangue a leva aos membros que alimenta. Uma teoria coerente, elegante, e errada.

O homem que amanhece com chifres por ter pensado em touros é lenda romana, e Agrippa a repete como caso. Não é isso que acontece.

A crença mais custosa da lista é outra: a de que a imaginação da grávida marca o filho. Ela sobreviveu até o século XIX e serviu, por séculos, para responsabilizar mulheres por malformações dos filhos — o que a mãe viu, o que desejou, o susto que levou. É um bom lembrete de que ideias sobre a mente que age no corpo não são inofensivas quando erram.

Duas da lista, porém, não se descartam tão rápido. Embranquecer subitamente é fenômeno relatado o bastante para ter nome próprio na literatura médica, ainda que o mecanismo provável não seja o pigmento sumindo, e sim a queda seletiva dos fios ainda escuros. E os estigmas de Francisco são caso documentado, discutido até hoje entre explicações devocionais, psicogênicas e menos generosas.

Ler este trecho ao lado do anterior é o exercício que importa. O mesmo autor, no mesmo capítulo, acerta e erra — e o que separa uma coisa da outra não é o tema, é o método. Ele observou bem e explicou mal, e quando explicou mal, estendeu a explicação a casos que nunca observou.$c$,
50),

('Capítulo LXIV — O transporte: a alma leva o corpo aonde imagina ir',
$b$Assim, muitos são transportados de um lugar para outro, atravessando rios, fogos e lugares intransitáveis — isto é, quando as espécies de algum desejo veemente, ou medo, ou audácia, se imprimem em seus espíritos e, misturando-se a vapores, movem o órgão do tato em sua origem, juntamente com a fantasia, que é a origem do movimento local. Desse modo, eles estimulam os membros e órgãos do movimento a se moverem, e são conduzidos, sem erro algum, até o lugar imaginado — não pela vista, mas a partir da fantasia interior. Tamanho é o poder da alma sobre o corpo que, para onde quer que a alma imagine e sonhe ir, para lá ela conduz o corpo.$b$,
$c$Descarta o mecanismo e fica com a observação: é a regra deste capítulo, e aqui ela rende o achado mais surpreendente.

O mecanismo é fisiologia galênica pura — espíritos, vapores, humores circulando. Não sobrou nada disso. Mas repara na frase que Agrippa deixa cair no meio: a fantasia é a origem do movimento local. A faculdade imaginativa é o que põe o corpo em marcha.

Isso hoje tem nome e evidência: imagética motora. Imaginar um movimento ativa boa parte dos mesmos circuitos que executá-lo, e o treino mental por imaginação melhora desempenho motor de forma mensurável — é técnica corrente em reabilitação e em esporte de alto rendimento. Agrippa não sabia por quê, mas apontou para o lugar certo.

Quanto aos transportados, a leitura mais econômica é o sonambulismo. Pessoas que se levantam, atravessam cômodos, às vezes saem de casa, guiadas por imagens internas e não pela vista — que é exatamente como ele descreve: "não pela vista, mas a partir da fantasia interior". A observação é boa. O que a excede é a travessia de rios e fogos, que é relato herdado, não coisa vista.

Uma advertência de leitura: este trecho costuma ser citado como descrição de viagem astral, e não é. Aqui o corpo é levado junto — a alma conduz o corpo aonde imagina ir. A separação entre os dois só aparece no fim do capítulo, e é outra coisa.$c$,
60),

('Capítulo LXIV — O domínio voluntário: quem manda no próprio corpo',
$b$Lemos muitos outros exemplos que explicam maravilhosamente o poder da alma sobre o corpo, como aquele descrito por Avicena sobre um certo homem que, quando desejava, podia provocar em si mesmo uma paralisia. Relata-se que Galo Víbio caiu na loucura não por acaso, mas deliberadamente; pois, ao imitar loucos, acabou por assimilar a loucura deles e tornou-se louco de fato. Santo Agostinho também menciona homens capazes de mover as orelhas à vontade, outros que conseguiam deslocar o couro cabeludo da parte superior da cabeça para a testa e trazê-lo de volta quando quisessem, e ainda outro que conseguia suar a seu bel-prazer. É sabido que alguns conseguem chorar quando querem, derramando uma profusão de lágrimas; há também aqueles que conseguem regurgitar, aos poucos e quando desejam, o que haviam engolido, como se o trouxessem de dentro de uma bolsa. E vemos que, em nossos dias, muitos conseguem imitar e reproduzir tão bem as vozes de aves, gado, cães e até de certas pessoas, que mal se consegue distingui-las das originais. Plínio também relata, por meio de diversos exemplos, casos de mulheres que se transformaram em homens. Pontano atesta que, em sua época, uma mulher chamada Caietava e outra chamada Emília transformaram-se em homens muitos anos após terem se casado.$b$,
$c$Este é o trecho em que Agrippa está mais certo, e o que mais interessa a quem pratica.

Quase toda a lista se sustenta. Mover as orelhas à vontade é comum — os músculos auriculares existem em todo mundo, apenas raramente estão sob controle consciente. Deslocar o couro cabeludo, idem. Chorar por decisão é ofício de ator. A regurgitação voluntária "aos poucos, como de dentro de uma bolsa" é descrição exata de ruminação, documentada em medicina e explorada por artistas de palco. Suar quando se quer é raro, mas há registro de gente que aprende a fazê-lo. E a imitação de vozes de aves e cães dispensa defesa.

Agostinho, de quem Agrippa tira metade desses casos, os coletava com o mesmo espanto — e pelo mesmo motivo: são coisas que o corpo não deveria obedecer, e obedece.

É esse o ponto que atravessa o capítulo até aqui. A fronteira entre voluntário e involuntário não está onde parece. É a aposta de toda a prática respiratória e do trabalho energético: que funções tidas como automáticas admitem treino. O biofeedback moderno confirmou parte disso — frequência cardíaca, temperatura periférica e tônus muscular respondem a treinamento deliberado.

Dois casos merecem ressalva. Galo Víbio enlouquecendo por imitar loucos é anedota antiga; que representar um estado por muito tempo influencie quem representa tem alguma base, mas "tornou-se louco de fato" excede o que se pode afirmar. E as mulheres que Plínio e Pontano dizem terem virado homens: relatos assim, na Antiguidade e na Renascença, costumam corresponder a variações do desenvolvimento sexual que só se manifestam depois — o que era lido, então, como transformação.

Agrippa não distinguia essas camadas. Nós podemos.$c$,
70),

('Capítulo LXIV — A imaginação sobre a alma, e a alma fora do corpo',
$b$Ninguém ignora o quanto a imaginação pode afetar a alma, pois ela está mais próxima da substância da alma do que os sentidos e, portanto, exerce sobre ela uma influência maior. Assim, mulheres, por meio de imaginações intensas, sonhos e sugestões induzidas por certas artes mágicas, frequentemente se prendem a um forte sentimento de afeição por alguém. Diz-se, por exemplo, que Medeia foi tomada de amor por Jasão graças a um sonho. Da mesma forma, a alma pode, por vezes, mediante uma imaginação ou especulação veemente, abstrair-se completamente do corpo — tal como relata Celso a respeito de um certo presbítero que, sempre que desejava, conseguia tornar-se insensível e permanecer imóvel como um morto; quando alguém o espetava ou queimava, ele não sentia dor alguma, permanecendo sem qualquer movimento ou respiração, embora — segundo afirmava — conseguisse ouvir vozes humanas, como que vindas de longe, caso gritassem em voz alta.$b$,
$c$O capítulo fecha com a afirmação mais ousada e, curiosamente, com o caso mais verificável de todos.

Primeiro o enfeitiçamento. Repara em como Agrippa constrói a frase: as mulheres se prendem a um afeto — o verbo é reflexivo. Mesmo tratando de artes mágicas, ele localiza a operação dentro da imaginação de quem se enfeitiça, não numa força que vem de fora e captura. É uma descrição menos sobrenatural do que se esperaria, e mais próxima de como a paixão de fato se instala: por repetição de imagens.

Depois o presbítero, e aqui vale ler devagar. O homem se tornava insensível à vontade, imóvel, sem movimento nem respiração aparente; espetado ou queimado, não sentia dor. Mas — e esse detalhe é o que importa — continuava ouvindo vozes, como que de longe, se falassem alto.

Isso é a descrição precisa de um estado de absorção profunda. A analgesia por sugestão é fenômeno documentado, ao ponto de haver registro de cirurgias conduzidas sob hipnose antes de a anestesia química existir. E a preservação da escuta, com as vozes soando distantes enquanto a dor desaparece, é exatamente o que relata quem atravessa transe profundo ou absorção meditativa intensa: a consciência não se apaga, a sensação é que se desliga.

A mesma história aparece em Agostinho, com o nome do presbítero, Restituto.

A diferença entre Agrippa e nós não está no que se observa, está na explicação. Ele diz que a alma se abstrai do corpo — que ela sai. A leitura de hoje é que a atenção se retirou, não a alma. A fenomenologia é a mesma; o que a causa, não.

E é com isso que o capítulo se encerra e o praticante fica: cinco trechos atrás, o corpo respondendo a uma imagem de comida azeda; agora, o corpo inteiro em silêncio por decisão. Entre um e outro há uma escada, e Agrippa passou a vida convencido de que dava para subi-la.$c$,
80)

) as v(heading, body, commentary, sort_order)
where w.slug = 'agrippa-filosofia-oculta-i';
