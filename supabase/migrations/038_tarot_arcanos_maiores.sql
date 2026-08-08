-- 038_tarot_arcanos_maiores.sql
-- Os vinte e dois arcanos maiores ganham significado.
--
-- Enquanto os menores nao tiverem texto, o sorteio nao pode cair numa
-- carta muda. A funcao draw_tarot passa a sortear apenas cartas com
-- verbete escrito — o baralho cresce conforme a escrita avanca, sem
-- precisar de nova migracao de estrutura.
--
-- VOZ DOS VERBETES: nenhum deles preve o futuro. Descrevem o que a
-- carta aponta e devolvem uma pergunta ao praticante. E o mesmo padrao
-- epistemico do Bestiario e do Acervo — tradicao apresentada como
-- tradicao, sem promessa de resultado.

update public.tarot_cards set
upright = $t$Começo antes de estar pronto. O Louco é a carta de quem dá o passo sem ter o mapa inteiro, e a tradição o desenha à beira do abismo de propósito: o risco é real, e ainda assim ele vai.

Não confunda com inconsequência. O que essa carta valoriza é a disposição de não saber — a única condição em que se aprende alguma coisa nova de verdade.

Onde na tua vida a exigência de certeza está te mantendo parado?$t$,
reversed = $t$O salto que não acontece, ou o que acontece sem nenhum cuidado. Invertido, o Louco costuma marcar os dois extremos: a paralisia de quem espera condições perfeitas, e a imprudência de quem confunde impulso com coragem.

Vale distinguir qual dos dois é o teu.$t$
where slug = 'o-louco';

update public.tarot_cards set
upright = $t$Tudo o que é preciso já está sobre a mesa. O Mago não recebe poder de fora: ele reúne o que tem — os quatro naipes diante dele, os quatro elementos — e concentra numa direção só.

É a carta da vontade que vira ato. Não fala de talento, fala de foco.

O que você já sabe fazer e não está fazendo?$t$,
reversed = $t$Capacidade dispersa. O Mago invertido é a energia que existe mas se espalha — muitos começos, nenhum acabamento — ou a habilidade usada para persuadir em vez de construir.

Charlatanismo, na leitura antiga. Mas o alvo mais comum do próprio engano é quem o pratica.$t$
where slug = 'o-mago';

update public.tarot_cards set
upright = $t$O que você sabe e ainda não disse em voz alta. A Sacerdotisa senta entre duas colunas com um livro meio escondido: o conhecimento existe, mas não está pronto para ser exposto.

É a carta do silêncio que serve, da intuição que precede o argumento. Ela não pede ação, pede escuta.

Que resposta você já tem e está evitando encarar?$t$,
reversed = $t$Ou o segredo virou peso, ou a voz interna está sendo abafada por barulho de fora. Invertida, a Sacerdotisa fala de desconexão com o próprio saber — a pessoa que consulta todo mundo menos a si mesma.

Também pode indicar informação retida quando já era hora de partilhar.$t$
where slug = 'a-sacerdotisa';

update public.tarot_cards set
upright = $t$Abundância que se cuida para crescer. A Imperatriz é a carta da fertilidade em qualquer sentido — projeto, corpo, casa, criação — e do prazer que vem de fazer algo prosperar.

Ela não é passiva. Cultivar dá trabalho, e é trabalho que se faz com generosidade.

O que na tua vida está pedindo cuidado em vez de esforço?$t$,
reversed = $t$Cuidado que virou sufocamento, ou criação bloqueada. Invertida, a Imperatriz aponta tanto para quem cuida de todos e de si não cuida, quanto para o período seco em que nada floresce por mais que se insista.

Terra também precisa de descanso.$t$
where slug = 'a-imperatriz';

update public.tarot_cards set
upright = $t$Estrutura, limite, forma. O Imperador é a carta de quem constrói algo que dura, e para isso precisa dizer não com frequência.

Autoridade aqui não é dominação: é a capacidade de sustentar uma decisão ao longo do tempo, mesmo quando o entusiasmo passa.

Onde te falta uma regra que você mesmo estabeleça e cumpra?$t$,
reversed = $t$Rigidez ou ausência de espinha. Invertido, o Imperador mostra a estrutura que virou prisão — controle que sufoca o que deveria proteger — ou o oposto, a vida sem nenhuma forma, em que tudo é negociável e nada se sustenta.$t$
where slug = 'o-imperador';

update public.tarot_cards set
upright = $t$O que se aprende de quem veio antes. O Hierofante é a carta da tradição, da escola, do mestre — e do valor de percorrer um caminho já trilhado antes de inventar o próprio.

Nem toda regra é aprisionamento. Algumas são conhecimento condensado de gente que errou por você.

De quem você precisa aprender, e está achando que já sabe?$t$,
reversed = $t$Ruptura com a tradição, para o bem ou para o mal. Pode ser a carta de quem enfim abandona um dogma que não serve, ou a de quem descarta o acúmulo de séculos por pura impaciência.

Também fala de instituição que perdeu o sentido e ficou só com a forma.$t$
where slug = 'o-hierofante';

update public.tarot_cards set
upright = $t$Uma escolha que revela o que você valoriza. Os Amantes falam de união, mas antes disso falam de decisão: escolher uma coisa é abrir mão de outra, e é aí que os valores aparecem.

Não é a carta do romance fácil. É a do compromisso que custa algo.

Que escolha você está adiando para não perder nenhuma das opções?$t$,
reversed = $t$Desalinho entre o que se diz querer e o que se escolhe. Invertida, a carta mostra a decisão tomada por conveniência, a relação em desequilíbrio, ou o conflito interno entre desejo e valor.

Costuma aparecer quando a pessoa já sabe a resposta e busca permissão.$t$
where slug = 'os-amantes';

update public.tarot_cards set
upright = $t$Avanço por vontade dirigida. O Carro é puxado por duas esfinges que apontam para lados opostos, e não há rédeas: o condutor as mantém alinhadas pela concentração, não pela força.

É a carta do movimento que só existe enquanto a atenção sustenta.

Que forças opostas dentro de você precisam puxar junto?$t$,
reversed = $t$Direção perdida ou força gasta em atrito. Invertido, o Carro é o esforço que não sai do lugar porque as partes internas se cancelam — ou a pressa que confunde velocidade com progresso.

Vale perguntar se você está indo ou apenas fugindo.$t$
where slug = 'o-carro';

update public.tarot_cards set
upright = $t$Domínio sem violência. A Força mostra uma figura fechando a boca do leão com as mãos nuas e sem esforço aparente — não porque o leão seja fraco, mas porque não está sendo enfrentado.

É a carta da paciência que vence onde a imposição falharia. Vale para hábito, para raiva, para medo.

O que você vem tentando vencer no braço e talvez ceda ao ser acolhido?$t$,
reversed = $t$Ou a fera assumiu o comando, ou a pessoa se exauriu tentando contê-la. Invertida, a Força fala do controle que virou repressão — o que se cala cresce — e do cansaço de quem administra o próprio impulso sem nunca escutá-lo.$t$
where slug = 'a-forca';

update public.tarot_cards set
upright = $t$Afastar-se para enxergar. O Eremita sobe sozinho e leva a própria lanterna: a luz não vem do alto, vem do que ele já carregava.

É a carta do recolhimento deliberado, diferente do isolamento por ferida. Aqui a solidão é ferramenta, e tem hora de acabar.

Do que você precisa se afastar para conseguir pensar?$t$,
reversed = $t$Solidão que deixou de servir. Invertido, o Eremita marca o recolhimento que virou fuga, a porta que se fechou e não se reabre — ou o extremo oposto, a agenda tão cheia que não sobra silêncio nenhum.$t$
where slug = 'o-eremita';

update public.tarot_cards set
upright = $t$O que gira independentemente de você. A Roda é a carta do ciclo: fases sobem, fases descem, e boa parte disso não responde a mérito nem a esforço.

Não é fatalismo. É o reconhecimento de que há uma parcela fora do teu controle, e que insistir em controlá-la consome a energia que serviria para o resto.

O que você está tentando segurar que simplesmente está passando?$t$,
reversed = $t$Resistência ao ciclo. Invertida, a Roda costuma aparecer quando alguém repete o mesmo movimento esperando resultado diferente, ou quando culpa a si mesmo por uma virada que não dependia dele.

Também pode marcar o momento parado antes de a roda voltar a andar.$t$
where slug = 'a-roda-da-fortuna';

update public.tarot_cards set
upright = $t$Causa e consequência, pesadas sem indulgência. A Justiça segura a balança e a espada: primeiro se avalia, depois se corta.

Ela não promete que você vá ganhar. Promete que a conta é a que é — e pede que você a faça com honestidade, inclusive quando o resultado não te favorece.

Que verdade sobre esta situação você vem arredondando a teu favor?$t$,
reversed = $t$Desequilíbrio, viés, ou a recusa de assumir a própria parte. Invertida, a Justiça aponta para o julgamento contaminado — pelo interesse, pela mágoa, pela pressa.

Também fala do que ficou pendente e continua cobrando juros.$t$
where slug = 'a-justica';

update public.tarot_cards set
upright = $t$Suspensão voluntária. O Enforcado está de cabeça para baixo por escolha, e o rosto é sereno: ele não está sendo punido, está vendo de outro ângulo.

É a carta do tempo que não se apressa e da entrega que precede a compreensão. Nada avança aqui, e é isso que ela pede.

O que você ganharia se parasse de tentar resolver por uns dias?$t$,
reversed = $t$Espera que virou estagnação. Invertido, o Enforcado é o sacrifício sem propósito — quem se põe de cabeça para baixo e não olha nada de novo — ou a impaciência que interrompe o processo antes de ele render.

Distinguir pausa de paralisia é o trabalho desta carta.$t$
where slug = 'o-enforcado';

update public.tarot_cards set
upright = $t$Um ciclo terminou, e não volta. A Morte é a carta menos literal do baralho e a mais mal lida: ela raramente fala de morte física, e quase sempre de encerramento que já aconteceu e ainda não foi aceito.

O que ela oferece não é consolo, é limpeza. Não se planta no lugar ocupado.

O que na tua vida já acabou e você continua mantendo com aparelhos?$t$,
reversed = $t$A transformação recusada. Invertida, a Morte mostra quem segura o que já se foi — a relação encerrada, o cargo, a identidade — pagando um preço alto para adiar o inevitável.

Também pode marcar a mudança lenta demais, que se arrasta em vez de cortar.$t$
where slug = 'a-morte';

update public.tarot_cards set
upright = $t$Mistura na medida certa. A Temperança verte líquido de um cálice a outro sem derramar — imagem de paciência, de dosagem, de coisas que só dão certo devagar.

É a carta do meio-termo que não é morno: exige atenção contínua para manter o equilíbrio.

Onde você vem exagerando na dose, para mais ou para menos?$t$,
reversed = $t$Excesso ou desperdício. Invertida, a Temperança fala do que transbordou por pressa, da mistura malfeita, do esforço de conciliar o que não se concilia.

Às vezes a resposta não é dosar melhor, é parar de misturar.$t$
where slug = 'a-temperanca';

update public.tarot_cards set
upright = $t$A corrente que você mesmo segura. As figuras acorrentadas do Diabo têm o laço frouxo o bastante para sair — e não saem. É essa a carta: o apego que se justifica, o hábito que se explica, a situação que se diz insuportável e se mantém.

Ela não condena o desejo. Aponta para o ponto em que o desejo passou a mandar.

Do que você diz não conseguir se livrar, e nunca tentou de verdade?$t$,
reversed = $t$O começo da soltura, ou o aprofundamento da amarra. Invertido, o Diabo costuma marcar o momento em que a pessoa enxerga a corrente pela primeira vez — o que é desconfortável e é bom sinal.

Na leitura menos generosa, é a negação de que exista corrente alguma.$t$
where slug = 'o-diabo';

update public.tarot_cards set
upright = $t$Alguma coisa construída sobre fundação errada está sendo derrubada, e não por acidente. A Torre não fala de azar: fala do momento em que uma estrutura que já estava trincada finalmente cede — o emprego que você sabia insustentável, a relação mantida por hábito, a versão de si mesmo que não cabia mais.

O raio vem de fora, mas a rachadura era antiga.

O que essa carta pede não é resignação nem consolo. É que você olhe para o que caiu e reconheça se realmente queria aquilo de pé. Costuma haver alívio embaixo do susto.$t$,
reversed = $t$A queda que se adia. A Torre invertida costuma aparecer quando a pessoa está segurando com as mãos uma coisa que já ruiu por dentro — remendando, justificando, negociando prazo.

Pode ser também a catástrofe evitada por pouco, e o susto que ainda não virou lição.

A pergunta útil aqui é: o que você está sustentando que ficaria mais leve se caísse?$t$
where slug = 'a-torre';

update public.tarot_cards set
upright = $t$Orientação depois do desabamento. A Estrela vem logo após a Torre, e não por acaso: é o que sobra quando o excesso caiu e resta o essencial.

Não é euforia, é serenidade. A figura despeja água na terra e no lago, sem pressa, sob o céu aberto — a carta da confiança que se reconstrói devagar.

O que continuou de pé quando o resto caiu?$t$,
reversed = $t$Desânimo, ou fé depositada no lugar errado. Invertida, a Estrela marca a perda de norte — quem não enxerga mais motivo para continuar — e também o otimismo que se recusa a olhar o que precisa ser encarado.$t$
where slug = 'a-estrela';

update public.tarot_cards set
upright = $t$O caminho que só se vê pela metade. A Lua é a carta da paisagem noturna: as formas existem, mas o contorno engana, e o medo preenche o que falta de informação.

Ela não avisa perigo. Avisa que você ainda não tem clareza suficiente para decidir, e que boa parte do que teme pode ser projeção.

O que você está tomando como fato e é só suposição?$t$,
reversed = $t$A névoa começando a levantar, ou o autoengano se aprofundando. Invertida, a Lua tanto marca o momento em que a confusão cede quanto aquele em que a pessoa passa a preferir a ilusão à verdade desconfortável.$t$
where slug = 'a-lua';

update public.tarot_cards set
upright = $t$Clareza sem sombra. O Sol é a carta mais direta do baralho: as coisas aparecem como são, o que estava escondido se mostra, e há alegria nisso.

Ela também expõe. Luz plena não escolhe o que ilumina.

O que ficaria mais simples se você parasse de esconder?$t$,
reversed = $t$Alegria adiada ou brilho fingido. Invertido, o Sol fala do contentamento que se performa sem se sentir, ou do bom momento que a pessoa não consegue habitar porque já está preocupada com o próximo.

Raramente é carta ruim. É a boa carta com atraso.$t$
where slug = 'o-sol';

update public.tarot_cards set
upright = $t$Um chamado que exige resposta. O Julgamento mostra figuras se erguendo ao som da trombeta — a carta do momento em que o acúmulo de anos pede uma decisão consciente.

É hora de olhar para trás sem indulgência e sem crueldade, e decidir o que se leva adiante.

Que balanço você vem evitando fazer?$t$,
reversed = $t$O chamado ignorado, ou o julgamento severo demais. Invertido, marca quem ouve o convite e finge não ter ouvido — e também quem transforma a revisão da própria vida em tribunal, onde só cabe condenação.$t$
where slug = 'o-julgamento';

update public.tarot_cards set
upright = $t$Fechamento inteiro. O Mundo é a última carta e a única em que as quatro figuras dos cantos aparecem juntas: o ciclo se completou e as partes finalmente conversam entre si.

É a carta da integração, não da perfeição. Não significa que acabou tudo; significa que esta volta acabou bem.

O que em você já está pronto e ainda não foi reconhecido?$t$,
reversed = $t$Conclusão que não vem. Invertido, o Mundo fala do projeto a poucos passos do fim que não se termina, da etapa vivida sem se encerrar, do reconhecimento que não chega — de dentro ou de fora.

Quase sempre falta pouco, e o pouco é o mais difícil.$t$
where slug = 'o-mundo';


-- ───────────────────────────────────────────────────────────────────
-- O sorteio passa a ignorar cartas sem verbete escrito. Assim as
-- tiragens funcionam desde ja com os arcanos maiores, e os menores
-- entram no baralho automaticamente conforme forem escritos.
-- ───────────────────────────────────────────────────────────────────
create or replace function public.draw_tarot(
  p_spread tarot_spread,
  p_question text default null
)
returns table (
  reading_id uuid,
  slug text,
  name text,
  reversed boolean,
  posicao smallint,
  image_path text
)
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_qtd    smallint;
  v_disp   smallint;
  v_period text;
  v_cards  jsonb;
  v_id     uuid;
begin
  if v_uid is null then
    raise exception 'nao_autenticado';
  end if;

  v_qtd := case p_spread
    when 'uma' then 1 when 'tres' then 3 else 10 end;

  select count(*) into v_disp
    from public.tarot_cards where upright is not null;

  if v_disp < v_qtd then
    raise exception 'baralho_incompleto'
      using hint = 'Ainda não há cartas escritas o bastante para esta tiragem.';
  end if;

  v_period := case when p_spread = 'uma'
    then 'D' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')
    else null end;

  select jsonb_agg(jsonb_build_object(
           'slug', c.slug,
           'reversed', random() < 0.4,
           'position', c.pos))
    into v_cards
    from (
      select t.slug, row_number() over ()::smallint as pos
        from public.tarot_cards t
       where t.upright is not null
       order by random()
       limit v_qtd
    ) c;

  insert into public.tarot_readings (user_id, spread, question, cards, period_key)
  values (v_uid, p_spread, nullif(btrim(coalesce(p_question, '')), ''), v_cards, v_period)
  returning id into v_id;

  return query
    select v_id,
           t.slug, t.name,
           (e->>'reversed')::boolean,
           (e->>'position')::smallint,
           t.image_path
      from jsonb_array_elements(v_cards) e
      join public.tarot_cards t on t.slug = e->>'slug'
     order by (e->>'position')::smallint;
end;
$fn$;
