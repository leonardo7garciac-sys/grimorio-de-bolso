-- 020_seed_bestiario.sql
-- Semeia as dez criaturas do Bestiario Astral.
-- As imagens ja estao no bucket publico `bestiario` com o mesmo slug.

insert into public.bestiary_entries
  (slug, name, kind, summary, lore, image_path, epistemics, sort_order, is_published)
values

('silfide', 'Sílfide', 'espirito',
$s$As Sílfides são espíritos do ar, nascidas das brisas e dos ventos puros. Habitam montanhas, vales e campos abertos, dançando invisíveis entre as correntes de ar. Aparecem como belas jovens de luz tênue, quase transparentes.$s$,
$l$Fília do Ar
Classe: Elemental · Afinidade: Ar
Temperamento: leve, brincalhão, curioso e caprichoso, mas também gentil e protetor.

ANATOMIA
Possuem forma feminina delicada e esguia, com pele pálida e quase translúcida. Seus cabelos e vestes parecem feitos do próprio vento, mudando constantemente de forma. Seus pés não tocam o chão, pois são feitos da essência do ar.

COMPORTAMENTO
Sílfides são brincalhonas e curiosas, adoram cantar, dançar e explorar o mundo dos mortais sem serem vistas. Podem inspirar poetas e músicos, sussurrar segredos ao ouvido dos sonhadores e proteger aqueles que respeitam a natureza e os ventos. No entanto, podem ser volúveis e difíceis de prender ou compreender.

INVOCAÇÃO
Invocada através de cânticos suaves, versos poéticos e oferendas de penas, flores brancas e sinos de vento. Rituais devem ser realizados em locais elevados e arejados, com intenção pura e coração leve.

SÍMBOLOS DE PODER
Plumas, espirais, círculos e linhas ondulantes representam o ar, a liberdade, o movimento e a invisibilidade. O espiral é seu principal símbolo.

OBSERVAÇÕES
Sílfides raramente se mostram aos olhos dos mortais. Quando o fazem, é como um lampejo de luz ou um sussurro no vento. Aqueles que tentam capturá-las ou possuí-las acabam perdendo seu favor e podem atrair tempestades ou longos períodos de ar parado.$l$,
'silfide.webp', 'lenda', 10, true),

('ondina', 'Ondina', 'espirito',
$s$As Ondinas são espíritos das águas doces: rios, lagos, nascentes e fontes. Protegem a pureza das águas e todos os seres que delas dependem. Podem ser vistas por aqueles que possuem coração sincero e espírito em comunhão com a natureza.$s$,
$l$Fília das Águas
Classe: Elemental · Afinidade: Água
Temperamento: melancólica, serena e misteriosa, mas capaz de grande compaixão ou fúria.

ANATOMIA
A parte superior possui forma feminina e etérea, com pele pálida e úmida como a superfície da água. Seus cabelos longos e escorridos parecem feitos de água líquida. A partir da cintura, seu corpo se dissolve em ondas, espuma e correntezas.

COMPORTAMENTO
Costumam habitar locais de águas límpidas e em movimento. São protetoras de banhistas e viajantes, mas vingativas contra aqueles que poluem ou desrespeitam os domínios aquáticos. Podem conceder dons de cura, inspiração ou visão através dos sonhos.

INVOCAÇÃO
Invocada através de cânticos suaves, oferendas de flores brancas, conchas e água pura. Responde apenas àqueles que se aproximam com respeito e coração livre de malícia.

SÍMBOLOS DE PODER
A gota e a onda são seus símbolos sagrados, representando o fluxo da vida, a renovação e o mistério das profundezas.

OBSERVAÇÕES
Evite banhar-se em suas águas sagradas sem permissão. Não polua, não fira os seres aquáticos, não quebre o silêncio dos lugares encantados. Quem honra as águas, encontra nas Ondinas aliadas e guardiãs.$l$,
'ondina.webp', 'lenda', 20, true),

('gnomo', 'Gnomo', 'espirito',
$s$Os Gnomos são espíritos elementais da terra, guardiões de minerais, metais e conhecimentos antigos escondidos sob as montanhas. São antigos quanto as próprias rochas, e raros são aqueles que conseguem ganhar sua confiança.$s$,
$l$Gnomus Terrigenus
Classe: Elemental · Afinidade: Terra
Temperamento: reservado, trabalhador e leal. Raramente se mostram aos de superfície.

ANATOMIA
Possuem corpo pequeno e forte, membros curtos e musculosos, pele marcada pelo contato com minerais e terra. Seus rostos são rugosos, com narizes largos, orelhas pontiagudas e olhos vivos e atentos. Suas barbas, sempre longas, variam entre tons de cinza, marrom e negro, e são sinal de sabedoria e longevidade.

COMPORTAMENTO
Gnomos preferem a solidão ou a companhia de seus semelhantes. Habitam cavernas profundas, minas abandonadas e fendas nas montanhas. São mestres em lapidação, metalurgia e alquimia da terra. Podem auxiliar aqueles que demonstram respeito à natureza e ao trabalho árduo, mas punem com dureza os que saqueiam ou destroem as entranhas da terra.

INVOCAÇÃO
Invocado através de oferendas de pedras preciosas, metais brutos, ervas da terra e trabalho honesto. Rituais devem ser realizados em locais de força telúrica, como cavernas, pedras ancestrais ou minas profundas. A intenção deve ser pura e respeitosa.

SÍMBOLOS DE PODER
O triângulo representa a estabilidade, a terra e os três reinos subterrâneos. O cristal central simboliza o coração da montanha e o conhecimento escondido.

OBSERVAÇÕES
Relatos afirmam que Gnomos podem viver por muitos séculos e conhecem segredos da terra esquecidos pelos homens. São artesãos inigualáveis e protetores dos recursos naturais. A ganância é o único caminho para sua ira.$l$,
'gnomo.webp', 'lenda', 30, true),

('salamandra', 'Salamandra', 'espirito',
$s$As Salamandras são espíritos elementais do fogo, nascidos das chamas primordiais do mundo. Habitam vulcões, fornalhas naturais, desertos escaldantes e regiões onde o calor é intenso e constante. São imunes ao fogo e podem mover-se livremente através dele.$s$,
$l$Salamandra Ignis
Classe: Elemental · Afinidade: Fogo
Temperamento: independente, gentil, mas reservado. Raramente agressiva, a menos que provocada ou ameaçada.

ANATOMIA
Possuem corpo alongado e esguio, coberto por escamas finas e brilhantes, que variam entre o negro obsidiana e o vermelho incandescente. Seus olhos brilham como brasas vivas. Podem atingir até dois metros de comprimento, embora a maioria meça entre cinquenta e cento e cinquenta centímetros.

COMPORTAMENTO
Salamandras são criaturas solitárias e contemplativas. Observam silenciosamente o mundo humano, raramente interferindo. Valorizam a pureza das chamas e detestam a destruição gratuita ou o uso desrespeitoso do fogo. Podem formar laços com magos ou artesãos do fogo, a quem ensinam segredos antigos em troca de respeito e oferendas sinceras.

INVOCAÇÃO
Invocada através de rituais de fogo puro, oferendas de enxofre, ferro incandescente, rubis ou essências vulcânicas. O círculo de invocação deve ser desenhado com precisão e intenção nobre. A Salamandra só atende àqueles que demonstram respeito pelo fogo em sua forma mais sagrada.

SÍMBOLOS DE PODER
O fogo, a transformação e a purificação. Representa a alma que não se consome, mas se refina nas provações. É símbolo de resistência, renascimento e essência vital.

OBSERVAÇÕES
Dizem que as Salamandras são guardiãs de portais entre o plano material e o elemental do fogo. Aqueles que as veem são poucos, e os que vivem para contar jamais esquecem o brilho de seus olhos nem o calor de sua presença.$l$,
'salamandra.webp', 'lenda', 40, true),

('djinn', 'Djinn', 'espirito',
$s$Os Djinn do fogo são seres antigos, nascidos das chamas primordiais no alvorecer do mundo. Habitam planos de calor intenso e deserto sem fim, sendo raramente vistos pelos mortais, a não ser por invocação ou acaso.$s$,
$l$Aêlif Ibn n-Nâr
Classe: Elemental · Afinidade: Fogo
Temperamento: orgulhoso, volúvel, curioso, propenso a acordos e desafios.

ANATOMIA
Corpo composto inteiramente de fogo vivo, sem fumaça. Forma masculina humanoide, com feições árabes idealizadas. Da cintura para baixo, dissolve-se em espiral ígnea, permitindo-lhe levitar e atravessar qualquer obstáculo físico.

COMPORTAMENTO
Valorizam liberdade, poder e conhecimento. Podem conceder desejos ou ensinar artes proibidas, mas sempre buscam vantagem na troca. Desprezam fraqueza e mentira. Respeitam aqueles que demonstram coragem e inteligência.

INVOCAÇÃO
Evocado através de círculos de proteção, nomes sagrados e oferendas de fogo: incenso, metais preciosos, especiarias e promessas de serviço. Risco elevado de possessão ou retaliação.

SÍMBOLOS DE PODER
Cada Djinn possui um símbolo único gravado em chamas. Este pertence a Aêlif Ibn n-Nâr.

OBSERVAÇÕES
Extremamente antigos e sábios. Conhecem línguas, magias e segredos esquecidos pelos homens. Não são capturados: apenas convocados e persuadidos. A quebra de um pacto pode atrair sua fúria eterna.$l$,
'djinn.webp', 'lenda', 50, true),

('kitsune', 'Kitsune', 'espirito',
$s$Kitsunes são espíritos raposas originários das antigas florestas e montanhas sagradas. Mestres da ilusão e da transformação, possuem sabedoria ancestral e magia refinada. Quanto mais velhas, mais caudas possuem e maior seu poder.$s$,
$l$Konohagakure no Yōko
Classe: Espiritual · Afinidade: Fogo, Ilusão
Temperamento: astuto, elegante e enigmático; pode ser benevolente ou travesso, conforme o trato e a intenção.

ANATOMIA
Corpo esguio e ágil, com traços elegantes e pelagem macia. Suas orelhas são afiadas e sensíveis a energia e intenção. Possuem entre cinco e nove caudas, que representam sabedoria, idade e poder espiritual. Podem assumir forma humana ou híbrida.

COMPORTAMENTO
Observadoras e pacientes, Kitsunes testam os mortais com enigmas, ilusões e seduções. Podem proteger, guiar ou punir. Valorizam respeito, oferendas e honestidade. Guardam conhecimentos antigos e evitam vínculos profanos ou forçados.

INVOCAÇÃO
Invocada através de oferendas de arroz, saquê ou frutas. Rituais com fogo, respeito e intenção clara são essenciais. Pode surgir em sonhos, nas brumas ou entre as chamas dançantes.

SÍMBOLOS DE PODER
As caudas representam sabedoria, magia e longevidade espiritual. Quanto mais caudas, maior o domínio sobre a ilusão e o mundo espiritual.

OBSERVAÇÕES
Kitsunes não são inerentemente maus nem bons. Refletem o coração de quem os invoca ou encontra. Aqueles que conquistam sua confiança podem receber bênçãos, proteção e saberes que transcendem eras. Mas os que mentem ou desrespeitam podem se perder em ilusões sem fim.$l$,
'kitsune.webp', 'lenda', 60, true),

('tengu', 'Tengu', 'criatura',
$s$Tengus são seres espirituais das montanhas, associados ao vento, às tempestades e às artes marciais. Podem assumir formas variadas, mas geralmente possuem aparência humana com traços de ave, especialmente asas de corvo e um nariz longo característico.$s$,
$l$Daitengu
Classe: Yokai · Afinidade: Ar, Montanha
Temperamento: orgulhoso, disciplinado e imprevisível; pode ser protetor ou travesso conforme o tratamento recebido.

ANATOMIA
Possuem corpo humanoide, pele avermelhada ou pálida, nariz longo e pontiagudo. Seus olhos são afiados e penetrantes, refletindo sabedoria antiga. Asas grandes e negras permitem que voem pelos céus com grande agilidade. Suas garras são fortes e curvas, adaptadas tanto para agarrar quanto para lutar.

COMPORTAMENTO
Tengus valorizam o treinamento, a meditação e o domínio das artes marciais. Vivem em montanhas isoladas, em templos ou cavernas. Podem ensinar humanos dedicados, mas castigam duramente aqueles que agem com arrogância ou desrespeito. Gostam de desafios intelectuais e físicos. Seu humor varia entre o sábio conselheiro e o brincalhão irritadiço.

INVOCAÇÃO
Invocado através de respeito, oferendas de saquê, incenso de cedro e desafio honesto. Rituais devem ser realizados em locais elevados, com pureza de intenção e mente focada. Pode conceder ensino, proteção ou provocar desafios para testar o invocador.

SÍMBOLOS DE PODER
O leque (gunbai) afasta maus espíritos e controla o vento. A espada representa disciplina e justiça. As asas simbolizam liberdade, domínio dos céus e visão além dos enganos.

OBSERVAÇÕES
Tengus podem ser tanto aliados quanto adversários. Aqueles que buscam poder sem honra são frequentemente enganados ou punidos. Já os que demonstram humildade, coragem e perseverança podem receber ensinamentos capazes de transformar suas vidas.$l$,
'tengu.webp', 'lenda', 70, true),

('banshee', 'Banshee', 'espirito',
$s$As Banshees são espíritos femininos ligados a linhagens e famílias. Seu lamento anuncia morte, mudança ou grande infortúnio. Não causam a morte, mas são presságios inevitáveis do que está por vir.$s$,
$l$Bean Sidhe
Classe: Espiritual · Afinidade: Morte, Lamento
Temperamento: melancólico, apegado e vingativo; manifesta-se através do lamento e do presságio.

ANATOMIA
A forma das Banshees é esguia e etérea. Possuem aparência feminina, com pele pálida como névoa e olhos fundos, muitas vezes ocultos por longos cabelos desgrenhados. Suas bocas se abrem em lamentos que arrepiam a alma.

COMPORTAMENTO
Banshees aparecem sozinhas, geralmente à noite, próximas a casas antigas, cemitérios ou locais ligados à linhagem que protegem. Seu lamento pode ser ouvido como um grito distante, um choro ou uma melodia triste e interminável. Não podem ser vistas por todos, apenas por aqueles que estão destinados a ouvir.

INVOCAÇÃO
Invocada através de lamentos rituais, invocações fúnebres ou evocações realizadas em locais de grande tristeza. Perguntas sobre morte, destino ou presságios podem atrair sua presença, mas sempre com grande risco emocional.

SÍMBOLOS DE PODER
Seus símbolos representam o lamento, a passagem entre mundos e o presságio. Usados em rituais de proteção ou para ouvir verdades ocultas.

OBSERVAÇÕES
Oferecer respeito aos ancestrais e honrar os mortos pode manter uma Banshee apaziguada. Desrespeito, negação ou tentativas de controle podem despertar seu lamento. Não há como silenciar uma Banshee: apenas ouvi-la e aceitar o que ela anuncia.$l$,
'banshee.webp', 'lenda', 80, true),

('lobisomem-atavico', 'Lobisomem Atávico', 'criatura',
$s$Lobisomens Atávicos são as formas mais antigas e puras da maldição lupina, anteriores aos pactos e linhagens modernas. Carregam em si a memória selvagem dos primeiros homens que caminharam com os lobos sob a luz da lua.$s$,
$l$Canis Lupus Atavicus
Classe: Metamórfico · Afinidade: Lua Cheia
Temperamento: indomável, instintivo, feroz e ancestral.

ANATOMIA
Possuem corpo lupino colossal, coberto por pelagem densa e áspera. Seus olhos refletem a luz lunar com intensidade sobrenatural. Seus membros superiores são longos e poderosos, terminando em garras capazes de dilacerar pedra e carne. A parte inferior de seu corpo se desfaz em névoa etérea, especialmente durante o uivo, como se sua forma não pudesse ser totalmente contida no plano material.

COMPORTAMENTO
Lobisomens Atávicos não seguem líderes e não se submetem a leis. Vivem isolados em regiões ermas, selvas, montanhas e territórios esquecidos. Uivam para a lua não por comunicação, mas por reverência ancestral. São guiados por instinto puro, caçando aquilo que ameaça o equilíbrio natural. São temidos até mesmo por outros lobisomens.

INVOCAÇÃO
Invocado durante a lua cheia através de rituais de sangue, ossos de lobo antigo e cânticos em línguas perdidas. É uma invocação perigosa e instável, pois atrai uma entidade que não reconhece domínio, apenas o chamado da selva ancestral.

SÍMBOLOS DE PODER
A lua cheia representa a natureza selvagem e a verdade oculta. A garra simboliza o instinto e a força bruta. A silhueta humana no peito é a memória do homem que um dia fez o pacto — ou foi reclamado.

OBSERVAÇÕES
Relatos afirmam que sua presença causa o silêncio dos animais e o comportamento errático do clima. Aqueles que o veem afirmam sentir medo reverencial, como se diante de algo que não pertence mais a este mundo, mas que ainda se lembra dele. Enfrentá-lo é desafiar o próprio instinto de sobrevivência.$l$,
'lobisomem-atavico.webp', 'lenda', 90, true),

('vampiro-astral', 'Vampiro Astral', 'criatura',
$s$O Vampiro Astral não é uma criatura comum. Seu corpo físico é apenas um invólucro, preservado através da drenagem contínua de energia vital. Diferente dos vampiros das lendas populares, ele não busca o sangue por fome, mas por necessidade espiritual. Sua essência se projeta além do corpo, assumindo forma etérea para caçar.$s$,
$l$Consummator Vitae
Classe: Entidade Parasítica · Afinidade: Sombra, Noite, Sangue
Temperamento: calculista, insaciável, paciente. Raramente é visto em sua forma verdadeira.

ANATOMIA
Seu corpo físico é pálido e frio, com traços alongados e olhos fundos que brilham fracamente quando em repouso. Sua verdadeira natureza se revela na forma astral: uma silhueta feita de névoa e sombras, com garras longas e uma boca sem fundo. Seu cordão astral se estende como um chicote de névoa, usado para extrair a força vital à distância.

COMPORTAMENTO
Vampiros Astrais evitam confrontos diretos. Observam, esperam e escolhem suas presas com cuidado, geralmente animais fortes e saudáveis que possam fornecer energia vital suficiente para longos períodos. São mais ativos durante a noite ou em locais de forte concentração de energia vital, como florestas, campos e fontes sagradas. Podem desenvolver laços obsessivos com certas presas, retornando repetidamente até que a fonte se esgote.

INVOCAÇÃO
Invocado através de rituais de sangue, jejum e oferendas de força vital. O círculo de invocação deve ser traçado com cinzas de ossos e sal negro. O invocador deve estar em estado de fraqueza controlada para atrair sua atenção. O Vampiro Astral responde apenas àqueles que desejam poder, longevidade ou conhecimento além dos limites da carne.

SÍMBOLOS DE PODER
A lua crescente representa sua sede infinita. O triângulo invertido simboliza a drenagem da força vital. O olho fechado indica sua visão para além do plano físico. O sangue é seu portal e sua chave.

OBSERVAÇÕES
Proteger rebanhos e animais com símbolos de sal, ferro e arruda. Oferecer gratidão e respeito às fontes de vida enfraquece seu interesse. Evite locais onde animais aparecem exaustos sem causa aparente. Vampiros Astrais não podem entrar em círculos de luz e não suportam a força do sol. Sua existência depende do segredo e da escuridão.$l$,
'vampiro-astral.webp', 'lenda', 100, true)

on conflict (slug) do update set
  name         = excluded.name,
  kind         = excluded.kind,
  summary      = excluded.summary,
  lore         = excluded.lore,
  image_path   = excluded.image_path,
  epistemics   = excluded.epistemics,
  sort_order   = excluded.sort_order,
  is_published = excluded.is_published;
