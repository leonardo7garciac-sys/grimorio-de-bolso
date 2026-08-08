-- 041_tarot_copas.sql
-- O naipe de Copas: agua, vida afetiva, o que se sente antes de saber
-- nomear. Catorze cartas.
--
-- Mesma voz dos arcanos maiores: nenhum verbete preve nada, todos
-- descrevem o que a carta aponta e devolvem uma pergunta.
--
-- Cada carta escrita entra automaticamente no sorteio, porque
-- draw_tarot so considera cartas com upright preenchido. Nao ha
-- alteracao de estrutura nesta migracao.
--
-- OBS: o editor do Supabase vai avisar de "UPDATE sem WHERE". E falso
-- positivo — os catorze comandos terminam com where slug = '...', mas
-- o detector se perde nos blocos de texto entre $t$.

update public.tarot_cards set
upright = $t$Uma abertura afetiva. O Ás de Copas é a mão que oferece o cálice transbordando: alguma coisa começa no terreno do sentir, e ainda não tem forma nem nome.

Pode ser uma pessoa, mas nem sempre é. Também é o momento em que se volta a sentir depois de um período seco, ou em que uma criação pede para nascer.

O que está te sendo oferecido e você ainda não estendeu a mão para pegar?$t$,
reversed = $t$Sentimento represado ou derramado à toa. Invertido, o Ás de Copas fala tanto de quem se fecha diante do que poderia ser bom quanto de quem despeja afeto onde não há recipiente.

Também aparece quando a fonte secou por cansaço, e o que se pede é descanso, não esforço.$t$
where slug = 'as-de-copas';

update public.tarot_cards set
upright = $t$Reconhecimento mútuo. O Dois de Copas mostra duas pessoas trocando taças de frente uma para a outra — e o essencial é o de frente: aqui ninguém se dobra.

É a carta do pacto entre iguais, valendo para amor, sociedade ou amizade. Ela não promete facilidade, promete simetria.

Onde na tua vida existe troca de verdade, e onde só existe entrega de um lado?$t$,
reversed = $t$Desequilíbrio ou desencontro. Invertido, o Dois de Copas fala do vínculo em que um dá e o outro recebe, do ressentimento acumulado que ainda não virou conversa, ou do momento em que duas pessoas descobrem que queriam coisas diferentes.

Nem sempre é ruptura. Às vezes é o ajuste que estava atrasado.$t$
where slug = 'dois-de-copas';

update public.tarot_cards set
upright = $t$Alegria compartilhada. Três figuras erguem taças juntas — a carta da celebração, da amizade, do que só existe em grupo.

Ela lembra que nem tudo se resolve sozinho, e que há coisas que só se sustentam quando testemunhadas por outros.

Quem você deixou de chamar para perto?$t$,
reversed = $t$Excesso ou isolamento. Invertido, o Três de Copas tanto marca a festa que virou fuga quanto o afastamento de quem se retirou do convívio e sente falta sem admitir.

Também pode indicar o grupo em que se está presente e não pertencente.$t$
where slug = 'tres-de-copas';

update public.tarot_cards set
upright = $t$O que se oferece e não se vê. A figura senta de braços cruzados diante de três taças, enquanto uma quarta é estendida de uma nuvem — e ela não olha.

É a carta do tédio, do desinteresse, do momento em que nada parece valer o movimento. Nem sempre é depressão; às vezes é saturação legítima.

O que está sendo oferecido a você agora, enquanto você olha para outro lado?$t$,
reversed = $t$O despertar, ou o aprofundamento do torpor. Invertido, o Quatro de Copas costuma marcar o instante em que a pessoa enfim levanta a cabeça e aceita o que estava ali — ou o oposto, quando o retraimento deixa de ser pausa e vira hábito.$t$
where slug = 'quatro-de-copas';

update public.tarot_cards set
upright = $t$Luto pelo que entornou. A figura de manto negro olha para três taças caídas — e há duas ainda de pé atrás dela, que ela não vê.

Essa é a carta inteira: a perda é real e merece ser sentida, e ao mesmo tempo não é tudo o que há. As duas coisas ao mesmo tempo.

Você já se permitiu chorar isto, ou está apenas evitando olhar?$t$,
reversed = $t$O começo da volta. Invertido, o Cinco de Copas costuma indicar quem enfim se vira e enxerga o que restou — ou quem se apega ao luto porque ele já virou identidade.

Também fala de perdão, o mais difícil deles sendo o próprio.$t$
where slug = 'cinco-de-copas';

update public.tarot_cards set
upright = $t$Memória e ternura. Duas crianças trocam flores num pátio: a carta do passado que aquece, da inocência, do que foi bom e continua alimentando.

Ela é gentil, mas tem uma armadilha — lembrar não é o mesmo que voltar.

O que do que você foi ainda te serve, e o que você só está guardando por saudade?$t$,
reversed = $t$Nostalgia que prende. Invertido, o Seis de Copas fala de quem vive de olhos voltados para trás, idealizando um passado que provavelmente não foi bem assim.

Também pode marcar o desligamento saudável, quando alguém finalmente solta a infância e passa a habitar o presente.$t$
where slug = 'seis-de-copas';

update public.tarot_cards set
upright = $t$Sete taças flutuando, cada uma com um prêmio diferente, e nenhuma delas ao alcance. É a carta da fantasia, do excesso de opções, do plano elaborado que nunca sai do papel.

Não condena o sonho. Aponta o momento em que sonhar virou substituto de escolher.

Entre tudo o que você imagina fazer, o que você faria se pudesse fazer uma coisa só?$t$,
reversed = $t$O nevoeiro se dissipando. Invertido, o Sete de Copas costuma marcar a hora em que a pessoa desce ao concreto e escolhe — ou, na leitura menos generosa, quando prefere continuar entre possibilidades a arriscar uma.$t$
where slug = 'sete-de-copas';

update public.tarot_cards set
upright = $t$A partida silenciosa. A figura se afasta de oito taças bem arrumadas, sem que nada de errado tenha acontecido com elas — e é isso que faz esta carta doer.

Ela fala de sair do que ainda funciona porque deixou de bastar. Não há culpado, e por isso costuma ser difícil de explicar aos outros.

O que na tua vida está de pé, íntegro, e mesmo assim já não te alimenta?$t$,
reversed = $t$A ida adiada, ou o retorno. Invertido, o Oito de Copas mostra quem já sabe que precisa ir e continua arrumando as taças — e também quem partiu e considera voltar, o que às vezes é sabedoria e às vezes é medo.$t$
where slug = 'oito-de-copas';

update public.tarot_cards set
upright = $t$Contentamento. A figura senta de braços cruzados diante das nove taças alinhadas: conseguiu o que queria, e está satisfeita.

A tradição chama esta de carta do desejo realizado. Vale acrescentar o que a imagem também mostra — a satisfação aqui é bastante individual, e as taças estão atrás, não compartilhadas.

O que você conquistou e ainda não parou para reconhecer?$t$,
reversed = $t$O gosto que não veio junto. Invertido, o Nove de Copas fala de quem conseguiu exatamente o que pedia e descobriu que não era aquilo — ou de quem confunde acúmulo com plenitude.

Também aparece na expectativa alta demais, que estraga o que seria suficiente.$t$
where slug = 'nove-de-copas';

update public.tarot_cards set
upright = $t$Harmonia que se estende aos outros. Um casal de braços abertos, crianças dançando, o arco-íris de taças acima: a carta da satisfação afetiva compartilhada.

Diferente do Nove, aqui o bom não é só seu. É a imagem do lar, no sentido amplo — o lugar onde se pode baixar a guarda.

Onde você tem isso, e o que você tem feito para sustentar?$t$,
reversed = $t$A fachada, ou a fratura. Invertido, o Dez de Copas mostra a família que parece inteira nas fotos, o vínculo que se mantém por aparência, ou a distância que se instalou sem que ninguém tenha nomeado.

Também pode marcar a expectativa idealizada que nenhuma convivência real alcança.$t$
where slug = 'dez-de-copas';

update public.tarot_cards set
upright = $t$Um recado do lado sensível. O Valete de Copas é o jovem que olha para o peixe surgindo dentro da taça — imagem antiga da ideia que aparece de onde não se esperava.

É a carta do impulso criativo ainda sem técnica, da sensibilidade que não se envergonha, do começo de um aprendizado afetivo.

Que intuição você teve recentemente e descartou por parecer boba?$t$,
reversed = $t$Sensibilidade que emperra. Invertido, o Valete de Copas fala do talento que não se exercita, do afeto expresso de forma imatura, ou da pessoa que confunde intensidade com profundidade.

Também aparece quando alguém se magoa com facilidade e chama isso de sinceridade.$t$
where slug = 'valete-de-copas';

update public.tarot_cards set
upright = $t$O portador da proposta. O Cavaleiro de Copas avança devagar, taça na mão, sem armadura à mostra — a carta do convite, do gesto romântico, da iniciativa vinda do coração.

Ele é o mais gentil dos cavaleiros e o menos prático. O movimento existe, mas o passo é lento.

Que convite você quer fazer e ainda não fez?$t$,
reversed = $t$Promessa sem lastro. Invertido, o Cavaleiro de Copas é o encanto que não sustenta, o gesto bonito que não vira compromisso, a idealização que se desfaz no primeiro atrito.

Vale conferir se o encantado é o outro ou você.$t$
where slug = 'cavaleiro-de-copas';

update public.tarot_cards set
upright = $t$Profundidade que acolhe. A Rainha de Copas segura uma taça fechada e olha para ela — é a única figura da corte que contempla o próprio símbolo.

É a carta de quem sente muito e não se afoga: empatia com contorno, cuidado que não invade, escuta que não julga.

De quem você precisa cuidar assim, e você mesmo está na lista?$t$,
reversed = $t$Afeto sem borda. Invertida, a Rainha de Copas fala de quem absorve a emoção alheia até perder a própria — ou de quem usa o cuidado como forma de controle.

Também marca o momento em que se está emocionalmente esgotado e ainda assim disponível para todos.$t$
where slug = 'rainha-de-copas';

update public.tarot_cards set
upright = $t$Serenidade em meio à corrente. O Rei de Copas senta num trono cercado de mar agitado, e o trono não balança — ele sente tudo e não é levado por nada.

É a maturidade afetiva: a capacidade de acompanhar a emoção de alguém sem se dissolver nela, e de conduzir a própria sem reprimi-la.

Onde você reage, quando poderia responder?$t$,
reversed = $t$Ou a onda tomou o trono, ou o mar foi congelado. Invertido, o Rei de Copas mostra a emoção manipulada — a calma usada como arma, a frieza vendida como equilíbrio — e também quem perdeu o controle depois de anos contendo.$t$
where slug = 'rei-de-copas';
