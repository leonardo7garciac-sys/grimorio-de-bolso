-- 028_seed_acervo_agrippa.sql
-- Primeira obra do Acervo: o Livro I da Filosofia Oculta de Agrippa.
--
-- Fonte: edicao norte-americana de 1913 (de Laurence, Scott & Co.,
-- Chicago), que revisa a traducao inglesa de 1651. Dominio publico.
-- Traducao para o portugues feita pelo autor do app.
--
-- O arquivo e re-executavel: a obra usa on conflict pelo slug e os
-- trechos sao apagados e reinseridos, ja que library_excerpts nao tem
-- chave unica propria.

insert into public.library_works
  (slug, title, author, era, tradition, intro, is_published, sort_order)
values (
  'agrippa-filosofia-oculta-i',
  'Filosofia Oculta, Livro I: Magia Natural',
  'Heinrich Cornelius Agrippa von Nettesheim',
  '1533 (edição inglesa de 1913)',
  'hermetismo',
$i$Agrippa tinha pouco mais de vinte anos quando escreveu esta obra, por volta de 1510. Guardou-a por mais de duas décadas antes de publicá-la, ampliada, em 1533 — dois anos antes de morrer.

São três livros, correspondentes aos três mundos: o elementar, o celeste e o intelectual. Este volume traz o primeiro, a Magia Natural — o andar mais próximo da matéria, onde ele trata dos elementos, das virtudes ocultas das coisas, das paixões da alma e da força da imaginação.

É de Agrippa que vem quase tudo o que veio depois. A nomenclatura elemental que usamos até hoje, o vocabulário das virtudes ocultas, a ideia de que a imaginação treinada opera sobre a matéria. Os autores dos séculos seguintes discutiram Agrippa, copiaram Agrippa, ou fingiram não tê-lo lido.

Sobre a fonte: estes trechos vêm da edição publicada em Chicago em 1913, que revisa e moderniza a única tradução inglesa existente, feita em Londres em 1651. Os próprios editores admitem ter suprido partes ausentes e abrandado o inglês do século XVII. Não é, portanto, o texto de 1651 em estado puro — é uma versão de leitura. A tradução para o português é minha, feita a partir dela.

Onde aquela edição mistura ao texto de Agrippa material de outras mãos — a biografia escrita por Henry Morley, as tabelas e capítulos acrescentados pelo editor — nada foi aproveitado. O que se lê aqui é Agrippa.$i$,
  true,
  10
)
on conflict (slug) do update set
  title        = excluded.title,
  author       = excluded.author,
  era          = excluded.era,
  tradition    = excluded.tradition,
  intro        = excluded.intro,
  is_published = excluded.is_published,
  sort_order   = excluded.sort_order;


-- Apaga so a faixa deste capitulo (sort_order < 40). Sem esse limite,
-- rodar esta migracao de novo apagaria os trechos semeados pelas
-- migracoes seguintes, que usam faixas mais altas.
delete from public.library_excerpts
 where work_id = (select id from public.library_works
                   where slug = 'agrippa-filosofia-oculta-i')
   and sort_order < 40;

insert into public.library_excerpts (work_id, heading, body, commentary, sort_order)
select w.id, v.heading, v.body, v.commentary, v.sort_order
from public.library_works w,
(values

('Capítulo I — Os três mundos e a descida das virtudes',
$b$Tendo em vista que o mundo é tríplice — Elementar, Celestial e Intelectual — e que todo inferior é regido pelo seu superior e recebe a influência de suas virtudes, de modo que o próprio Artífice Original e Principal de todas as coisas nos transmite, a partir de Si mesmo, as virtudes de Sua Onipotência por meio dos anjos, dos céus, das estrelas, dos elementos, dos animais, das plantas, dos metais e das pedras — a nós, para cujo serviço Ele fez e criou todas essas coisas: os sábios não consideram de modo algum irracional que nos seja possível ascender, pelos mesmos graus e através de cada mundo, até o próprio Mundo original, o Criador de todas as coisas e a Causa Primeira, de quem tudo provém e deriva; e também desfrutar não apenas das virtudes já presentes nas ordens de seres mais elevados, mas ainda extrair novas virtudes do alto.$b$,
$c$Está tudo aqui, no primeiro parágrafo: a ideia que sustenta a magia ocidental inteira. Não é "existem espíritos que obedecem". É que os mundos são encaixados, e o que acontece num alcança o outro por parentesco.

Repara na direção dupla. As virtudes descem — do Princípio para os anjos, dos anjos para os céus, dos céus para as pedras. Mas Agrippa diz que se pode subir "pelos mesmos graus". É essa segunda frase que transforma cosmologia em prática: se a escada desce, ela sobe.

Quando ele diz que todo inferior é regido pelo superior, o par não é matéria e espírito no sentido moderno — é densidade e sutileza, grau e grau. Cada andar governa o de baixo por estar mais próximo da fonte, não por ser de outra substância.

O Mundo Elementar que ele nomeia primeiro é o mesmo que povoa o Bestiário: sílfides no ar, ondinas na água, gnomos na terra, salamandras no fogo. A nomenclatura que usamos até hoje nasce dessa arquitetura.

Quanto ao estatuto: isto é tradição, não constatação. Não há como testar a existência de três mundos encaixados. O que se pode observar é o que essa ideia produziu em quem a praticou — e isso é assunto de outra ordem.$c$,
10),

('Capítulo I — As três vias e o plano da obra',
$b$É por isso que buscam as virtudes do Mundo Elementar com o auxílio da medicina e da filosofia natural, nas diversas misturas das coisas naturais; depois, as do Mundo Celestial, em seus raios e influências, segundo as regras dos astrólogos e as doutrinas dos matemáticos, unindo as virtudes celestiais às anteriores. Além disso, ratificam e confirmam tudo isso com os poderes de diversas Inteligências, por meio das sagradas cerimônias das religiões. Procurarei expor a ordem e o processo de tudo isso nestes três livros: o primeiro trata da Magia Natural; o segundo, da Celestial; e o terceiro, da Cerimonial.$b$,
$c$Aqui Agrippa entrega o método, e a primeira etapa costuma surpreender quem espera incenso e círculo. Ele começa pela medicina e pela filosofia natural — o nome que a ciência tinha antes de ter esse nome. O primeiro andar da magia dele é o estudo das misturas: ervas, minerais, o que uma substância faz no corpo. Farmacologia, essencialmente.

Só no segundo andar entram os astros, e junto com eles "as doutrinas dos matemáticos". Cerimônia é o terceiro e último, não o primeiro.

O que aconteceu com esse programa é a parte honesta da história. O primeiro andar virou química e farmacologia e ficou. O segundo se partiu ao meio: a matemática seguiu, a astrologia não. O terceiro continuou sendo religião. O sistema de Agrippa foi desmontado justamente pelo sucesso de uma de suas partes — e é por isso que o praticante moderno herda pedaços que não conversam mais entre si.

Quem lê hoje ganha algo que Agrippa não tinha: a possibilidade de saber qual andar é qual.$c$,
20),

('Capítulo I — A ressalva do autor',
$b$Não sei, porém, se é presunção imperdoável da minha parte — homem de tão pouco discernimento e saber — empreender, ainda na juventude e com tamanha confiança, uma tarefa tão difícil, árdua e intrincada como esta. Por isso, não desejo que ninguém dê assentimento ao que aqui já foi dito ou ao que eu vier a dizer, nem eu mesmo o farei, exceto na medida em que tais coisas forem aprovadas pela Igreja universal e pela congregação dos fiéis.$b$,
$c$Acabou de propor um sistema completo de magia e, no parágrafo seguinte, pede que ninguém acredite nele sem a aprovação da Igreja. Inclusive ele próprio.

Não é modéstia. É o preço da licença. Agrippa escreveu esta obra por volta dos vinte e quatro anos, segurou-a mais de vinte, e só publicou a versão final em 1533 — dois anos antes de morrer, sob o escrutínio da Inquisição de Colônia. A ressalva é o que permitia ao livro circular.

Vale conhecer a fórmula porque ela molda tudo o que veio depois. Séculos de literatura oculta se escrevem assim: alusiva, com escapatória embutida, dizendo e desdizendo. Quem lê sem perceber a convenção acha o gênero evasivo por natureza — quando muitas vezes é apenas alguém escrevendo com a Inquisição na sala.

E há uma ambiguidade que não se resolve. Anos depois Agrippa publicou um tratado atacando a vaidade de todas as ciências, magia inclusive. Recuo sincero? Segunda camada de proteção? Ninguém sabe. O que sobra é o hábito de nunca se deixar apanhar afirmando nada por inteiro — herança que a tradição carrega até hoje.$c$,
30)

) as v(heading, body, commentary, sort_order)
where w.slug = 'agrippa-filosofia-oculta-i';
