-- ═══════════════════════════════════════════════════════════════════
-- GRIMÓRIO DE BOLSO — Adendo 015: Seed das técnicas (spells) reais
-- Rode APÓS 001–014.
--
-- Todas as técnicas abaixo são de catálogo: owner_id fica null (padrão
-- da coluna), o que é o que faz uma técnica valer XP e aparecer para
-- todos os usuários — ver 005_diario_curadoria_skills.sql, constraint
-- custom_spell_rules.
--
-- spells não tinha nenhuma coluna única até este adendo, o que
-- impedia ON CONFLICT. Criamos um índice único (grimoire_id, name)
-- só para viabilizar a idempotência pedida — não afeta técnicas
-- pessoais (grimoire_id null nelas, e NULL nunca colide em índice
-- único).
-- ═══════════════════════════════════════════════════════════════════

create unique index if not exists spells_grimoire_name_key
  on public.spells (grimoire_id, name);

-- ───────────────────────────────────────────────────────────────────
-- blindagem-energetica — extraídas do PDF "Blindagem Energética"
-- (Práticas 1-6 do livro; os Seis Sons Curativos, mantidos como seis
-- técnicas separadas por pedido explícito, e não como um só ciclo)
-- ───────────────────────────────────────────────────────────────────
insert into public.spells (grimoire_id, name, description, xp_reward, sort_order)
select g.id, v.name, v.description, v.xp_reward, v.sort_order
from (values
  ('Inverta o Fôlego',
   'Inverte o padrão respiratório natural: o ventre recolhe na inspiração e expande na expiração. É o alicerce de toda a prática do livro — sem esse ritmo automatizado, nada mais funciona.',
   30, 1),
  ('Recolha e Assente',
   'Ao final de qualquer sessão de densificação, puxa de volta para o centro do corpo a sensação de superfície acumulada na pele, encerrando com um minuto de imobilidade.',
   25, 2),
  ('Descarregue no Solo',
   'Direciona a atenção e a respiração para baixo, imaginando a tensão acumulada escoando pelas solas dos pés até a terra. Serve para assentar depois de qualquer prática mais intensa.',
   25, 3),
  ('Solte o Som Xu',
   'Expiração sussurrada associada ao fígado: inspire imaginando a cor verde entrando, expire soltando o som e dissolvendo a irritação.',
   20, 4),
  ('Solte o Som He',
   'Expiração sussurrada associada ao coração: inspire com a cor vermelha, expire soltando o som e dissolvendo a ansiedade.',
   20, 5),
  ('Solte o Som Hu',
   'Expiração sussurrada associada ao baço/estômago: inspire com a cor amarela, expire soltando o som e dissolvendo a preocupação excessiva.',
   20, 6),
  ('Solte o Som Si',
   'Expiração sussurrada associada aos pulmões: inspire com a cor branca, expire soltando o som e dissolvendo a tristeza.',
   20, 7),
  ('Solte o Som Chui',
   'Expiração sussurrada associada aos rins: inspire com o azul-escuro, expire soltando o som e dissolvendo o medo.',
   20, 8),
  ('Feche com o Som Xi',
   'Último som do ciclo, sem órgão fixo: harmoniza e integra os cinco anteriores, fechando a sequência de limpeza energética.',
   20, 9),
  ('Comprima o Qi',
   'Retém o ar após uma inspiração profunda e contrai simultaneamente assoalho pélvico e parede abdominal, selando a energia contra os tecidos internos. A mais exigente do livro — o próprio texto pede repetições limitadas e atenção a sinais de alerta.',
   70, 10),
  ('Dispare o Fôlego Curto',
   'Treina o timing do Fa Jin: um movimento lento e relaxado que termina em uma expiração curta e seca, sincronizada com o fechamento do punho no último instante.',
   55, 11)
) as v(name, description, xp_reward, sort_order)
cross join (select id from public.grimoires where slug = 'blindagem-energetica') as g
on conflict (grimoire_id, name) do nothing;

-- ───────────────────────────────────────────────────────────────────
-- bestiario-astral — as 4 evocações simbólicas do capítulo "Bestiário
-- Autoral" (únicas práticas com passo a passo explícito no livro) +
-- 4 meditações elementais construídas a partir das qualidades e
-- habitats descritos no capítulo 2 e do tema já sugerido na tabela de
-- correspondências final (aprovado com o usuário antes de escrever)
-- ───────────────────────────────────────────────────────────────────
insert into public.spells (grimoire_id, name, description, xp_reward, sort_order)
select g.id, v.name, v.description, v.xp_reward, v.sort_order
from (values
  ('Vire a Ampulheta de Vesperael',
   'No instante em que a procrastinação se instala, visualize Vesperael virando a ampulheta em seu rosto — um gesto simbólico para devolver a si mesmo a urgência que você dissolveu.',
   30, 1),
  ('Entregue o Rascunho a Cindrul',
   'Antes de começar um trabalho criativo que você teme não terminar, visualize entregando as versões imperfeitas a Cindrul, aceitando que o rascunho existe para ser consumido, não guardado.',
   25, 2),
  ('Corte o Fio com Ofritha',
   'Em rituais de encerramento — fim de relação, mudança de fase, luto — visualize Ofritha cortando apenas o fio específico que liga você ao que precisa ser deixado para trás.',
   30, 3),
  ('Chame Nucthys Antes de Projetar',
   'Antes de dormir com intenção de projeção consciente ou sonho lúcido, visualize Nucthys sentada junto ao seu corpo adormecido, guardando o caminho de volta.',
   30, 4),
  ('Enraíze-se com o Gnomo',
   'Em pé, pés na largura dos quadris, joelhos destravados, peso repousando nas solas. Inspire em 4 tempos sem levar o ar para cima, e expire em 6 imaginando o peso do corpo afundando na terra, como o Gnomo que atravessa rocha e solo com a mesma facilidade com que um humano atravessa o ar. 9 respirações, encerrando com um minuto de imobilidade antes de voltar à superfície.',
   30, 5),
  ('Renove-se com a Salamandra',
   'Sentado, coluna ereta, mãos sobre o ventre. Inspire em 3 tempos, curto, imaginando uma chama fina percorrendo o corpo, e expire também em 3, breve e ativa, visualizando a chama alimentando-se exatamente onde algo em você já está se consumindo — sem ferir, só renovando, como a pele da Salamandra nas próprias chamas. 6 ciclos. Use quando precisar de vontade para atravessar uma transformação, não para evitá-la.',
   30, 6),
  ('Clareie a Mente com a Sílfide',
   'Sentado ou em pé, olhos fechados, ombros soltos. Respire pelo nariz em fluxo contínuo, sem pausa entre inspiração e expiração, como uma corrente de vento que nunca para, deixando a cada ciclo um pensamento fixo se dissolver nessa corrente. 10 minutos. Quando a mente sentir mais leve, abra os olhos devagar.',
   30, 7),
  ('Flua com a Ondina',
   'Sentado, mãos relaxadas sobre o colo. Inspire em 5 tempos sentindo o corpo como uma superfície de água se enchendo, e expire em 5 deixando uma emoção represada seguir esse mesmo movimento, escoando como onda que se retira. 7 respirações. É a Ondina quem marca o ritmo, não você.',
   30, 8)
) as v(name, description, xp_reward, sort_order)
cross join (select id from public.grimoires where slug = 'bestiario-astral') as g
on conflict (grimoire_id, name) do nothing;

-- ───────────────────────────────────────────────────────────────────
-- workbook-sigilos — 2 sigilos por categoria (das 6 do livro), os 30
-- templates seguem o mesmo protocolo (intenção → compressão em letras
-- → símbolo → carga em gnose → lançar e destruir); as 2 últimas são as
-- mais avançadas (hipersigilos), como o próprio livro as trata
-- ───────────────────────────────────────────────────────────────────
insert into public.spells (grimoire_id, name, description, xp_reward, sort_order)
select g.id, v.name, v.description, v.xp_reward, v.sort_order
from (values
  ('Concentre-se com um Sigilo',
   'Comprima a intenção de manter foco absoluto em um símbolo próprio, carregue-o antes de um bloco de trabalho profundo e destrua o registro logo depois de lançá-lo. Ideal para sessões de até 90 minutos.',
   30, 1),
  ('Rompa a Procrastinação com um Sigilo',
   'Transforme em símbolo a intenção de começar e terminar a tarefa que você mais adia, definindo antes a primeira ação concreta que vai tomar. Lance, destrua o registro e não monitore o resultado.',
   30, 2),
  ('Atraia Renda com um Sigilo',
   'Condense em símbolo a intenção de abrir novos canais de renda. Lance de preferência em lua crescente, associando o gesto a uma ação real de prospecção ou proposta.',
   30, 3),
  ('Quite Dívidas com um Sigilo',
   'Comprima em símbolo a intenção de administrar o dinheiro com sabedoria e quitar uma dívida específica. Combine com um plano real de controle financeiro — o sigilo amplifica, não substitui o comportamento.',
   35, 4),
  ('Desperte Vitalidade com um Sigilo',
   'Condense em símbolo a intenção de manter energia constante ao longo do dia. Carregue-o no pico físico de um treino e repita o ciclo a cada 30 dias.',
   30, 5),
  ('Aprofunde o Sono com um Sigilo',
   'Transforme em símbolo a intenção de adormecer com facilidade e acordar descansado. Carregue-o no limiar do sono e lance-o antes de deitar.',
   25, 6),
  ('Fortaleça a Comunicação com um Sigilo',
   'Comprima em símbolo a intenção de se expressar com clareza e impacto. Carregue-o antes de uma apresentação, conversa difícil ou momento de liderança.',
   30, 7),
  ('Cultive Amor-Próprio com um Sigilo',
   'Condense em símbolo a crença limitante que quer substituir por autoestima. Carregue-o e use as próprias letras extraídas também como mantra vocalizado.',
   30, 8),
  ('Desbloqueie a Criatividade com um Sigilo',
   'Identifique primeiro o tipo específico de bloqueio que enfrenta — página em branco, medo de julgamento — e transforme em símbolo a intenção de acessar seu potencial criativo com fluidez, mirando o sigilo nesse bloqueio.',
   30, 9),
  ('Vença o Medo de Errar com um Sigilo',
   'Defina a primeira ação imperfeita que pode tomar hoje mesmo e comprima em símbolo a intenção de experimentar com coragem, usando o lançamento do sigilo para destravar essa ação.',
   30, 10),
  ('Reconstrua sua Identidade com um Hipersigilo',
   'Diferente de um sigilo comum, condensa em símbolo não uma tarefa isolada, mas a identidade que você está construindo — sustentada por um diário de acompanhamento contínuo, não por um lançamento único.',
   60, 11),
  ('Integre Tudo com o Hipersigilo de Vida',
   'O sigilo mais denso do workbook: condensa uma visão de vida inteira em um único símbolo, e só deve ser lançado depois de já ter praticado pelo menos dez outros sigilos.',
   70, 12)
) as v(name, description, xp_reward, sort_order)
cross join (select id from public.grimoires where slug = 'workbook-sigilos') as g
on conflict (grimoire_id, name) do nothing;

-- ───────────────────────────────────────────────────────────────────
-- fundamentos — sem PDF-fonte; 8 práticas básicas de respiração e
-- aterramento, escritas para quem está começando
-- ───────────────────────────────────────────────────────────────────
insert into public.spells (grimoire_id, name, description, xp_reward, sort_order)
select g.id, v.name, v.description, v.xp_reward, v.sort_order
from (values
  ('Observe o Fôlego Natural',
   'Sentado, sem alterar nada, apenas acompanhe por 3 minutos o ar entrando e saindo pelo nariz. É o primeiro passo antes de qualquer técnica de respiração: conhecer o padrão antes de tentar mudá-lo.',
   20, 1),
  ('Respire em Quadrado',
   'Inspire em 4 tempos, segure em 4, expire em 4, segure vazio em 4, repetindo por 8 ciclos. Uma respiração com todas as fases iguais acalma rapidamente um estado de agitação.',
   25, 2),
  ('Expanda o Ventre',
   'Sentado ou deitado, uma mão sobre o abdômen, inspire deixando a barriga subir e expire deixando-a descer, sem mexer os ombros, por 10 respirações. É a base de toda respiração diafragmática.',
   25, 3),
  ('Alongue a Saída do Ar',
   'Inspire em 4 tempos e expire em 8, dobrando a duração da saída, por 6 ciclos. A expiração mais longa que a inspiração é o gesto mais simples para sinalizar ao corpo que o perigo passou.',
   25, 4),
  ('Plante os Pés no Chão',
   'Em pé, descalço se possível, sinta o peso distribuído nas solas por um minuto antes de qualquer outra prática. É o aterramento mais básico: sentir o contato real com o chão antes de buscar qualquer coisa mais sutil.',
   20, 5),
  ('Percorra o Corpo com Atenção',
   'Deitado, leve a atenção lentamente dos pés até o topo da cabeça por cerca de 5 minutos, notando tensão sem tentar corrigi-la.',
   30, 6),
  ('Ancore-se pelos Cinco Sentidos',
   'Nomeie mentalmente 5 coisas que vê, 4 que ouve, 3 que sente no corpo, 2 que cheira e 1 que saboreia. Serve para trazer a atenção de volta ao presente em qualquer momento de dispersão.',
   25, 7),
  ('Encerre com um Minuto de Imobilidade',
   'Ao final de qualquer prática, fique completamente parado por um minuto, sem ajustar a postura nem checar o tempo. Nenhuma sessão deveria terminar de forma abrupta.',
   20, 8)
) as v(name, description, xp_reward, sort_order)
cross join (select id from public.grimoires where slug = 'fundamentos') as g
on conflict (grimoire_id, name) do nothing;
