-- 046_seed_pantheon.sql
-- Seed das técnicas do grimório PANTHEON — O Grande Grimório da Assunção Forma-Deus
-- 31 técnicas: 1 método base + 30 formas-deus, na ordem dos cinco panteões do livro.
-- Idempotente: usa o índice único (grimoire_id, name) criado na 015.

insert into spells (grimoire_id, name, description, xp_reward, sort_order)
select g.id, v.name, v.description, v.xp_reward, v.sort_order
from grimoires g,
(values

-- ═══ MÉTODO ═══
('Vista a Forma do Deus',
 'Os sete movimentos da assunção: banimento, evocação da imagem do deus à sua frente, espelhamento dos gestos até os movimentos serem um só, aproximação até coincidir com o corpo, vestir a forma como um manto, agir e falar a partir dela, e dissolver reafirmando o próprio nome. Banimento antes e depois; registro no diário.',
 25, 1),

-- ═══ I · PANTEÃO GREGO ═══
('Assuma a Forma de Zeus',
 'Corrente jupiteriana de Chesed: expansão e autoridade interior, clareza decisória, o medo de liderar dissolvido. Calor difuso no peito irradiando para os ombros e a coroa; postura ereta, respiração lenta, voz firme. Para ritos de prosperidade, comando e restauração da ordem.',
 30, 2),

('Assuma a Forma de Apolo',
 'Corrente solar de Tiphareth: lucidez mental, senso estético apurado e harmonia interior, com o ruído mental reduzido. Luz dourada que centraliza a partir do plexo, leveza e humor elevado. Forma inicial ideal, pela estabilidade notável, e clássica na cura da psique.',
 20, 3),

('Assuma a Forma de Atena',
 'A mente da coruja: foco frio e estratégico, o problema visto de cima e sem arrebatamento emocional. Clareza contida na testa e nos olhos, postura alerta e imóvel, agitação reduzida. Energia precisa, não expansiva — para estudo, planejamento e resolução de conflitos.',
 30, 4),

('Assuma a Forma de Ártemis',
 'Corrente lunar de Yesod: independência, instinto aguçado e desapego da aprovação alheia, com firmeza para estabelecer limites. Frescor prateado, leveza nas pernas, sentidos mais atentos a sons e movimentos sutis. Para proteção, limpeza e conexão com os ciclos naturais.',
 30, 5),

('Assuma a Forma de Hécate',
 'Corrente do limiar, entre Yesod e Binah: abertura ao inconsciente profundo e à intuição oracular, conforto com a encruzilhada interior. Silêncio e presença nas costas e na nuca, arrepio leve, percepção acentuada do escuro. Avançada — pode trazer à tona material reprimido; praticar à noite, com banimento firme.',
 45, 6),

('Assuma a Forma de Dionísio',
 'Corrente do êxtase: liberação de inibições, catarse emocional e desbloqueio criativo. Calor ascendente pela coluna, ruborização, impulso à dança, tensões musculares afrouxadas. Poderosa e volátil, pois dissolve estruturas do ego — nunca com substâncias, sempre com banimento e reafirmação da identidade.',
 45, 7),

-- ═══ II · PANTEÃO EGÍPCIO ═══
('Assuma a Forma de Rá',
 'Ativação máxima de Tiphareth e do centro solar: força vital plena, otimismo e centramento, com dissolução de estados apáticos. Luz dourada irradiando do peito ao corpo inteiro, aquecimento geral e postura expansiva. Segura e restauradora — ideal ao amanhecer.',
 20, 8),

('Assuma a Forma de Ísis',
 'Corrente lunar de Binah, o grande útero cósmico: compaixão amplificada, intuição maternal e poder curador; emoções difíceis passam a caber. Envolvimento aquoso, respiração suave, por vezes lágrimas de liberação. Central nos ritos de cura e na recuperação após esgotamento.',
 20, 9),

('Assuma a Forma de Osíris',
 'A coluna Djed erguida no eixo central: estabilidade diante da perda e senso de continuidade além das crises — morrer para um velho estado e renascer. Imobilidade solene, respiração lenta, peso e enraizamento nas pernas. Mexe com estruturas profundas; não para quem ainda não tem base.',
 45, 10),

('Assuma a Forma de Hórus',
 'Corrente aguda de Geburah e Tiphareth: coragem, assertividade e foco na vitória, com a paralisia cedendo ao impulso de agir. Concentração na fronte e nos olhos, ombros energizados, postura de prontidão. Para proteção ativa, reconquista e o momento antes do confronto.',
 30, 11),

('Assuma a Forma de Bastet',
 'Corrente felina de Netzach: aconchego, alegria serena e proteção afetuosa, com graça descontraída e instinto de guarda do lar. Calor suave no ventre e no coração, movimentos leves, sentidos atentos em repouso. Acolhedora e estável — dissolve tensão e restaura o ânimo.',
 20, 12),

('Assuma a Forma de Anúbis',
 'Corrente do limiar entre Yesod e Malkuth: serenidade diante da morte e das transições, vigilância protetora, capacidade de guiar a si mesmo por passagens difíceis. Presença silenciosa ancorada nos pés e no ventre, gestos mais conscientes, frescor leve. Ctônica — exige banimento firme.',
 45, 13),

-- ═══ III · PANTEÃO NÓRDICO ═══
('Assuma a Forma de Odin',
 'Corrente odínica no eixo da coluna, a pendura em Yggdrasil: sede de conhecimento, visão panorâmica e disposição ao sacrifício por sabedoria; a mente busca conexões ocultas. Amplitude mental, respiração suspensa no insight, arrepio na espinha. Intensa — trabalhe com moderação e base sólida.',
 45, 14),

('Assuma a Forma de Thor',
 'Correntes marciais e jupiterianas no plexo: vontade direta, coragem franca e proteção inabalável, com o medo e a hesitação dissolvidos. Calor e solidez nos braços e no tronco, ombros abertos, respiração forte. Das formas mais seguras e revigorantes — dificilmente desregula o praticante.',
 20, 15),

('Assuma a Forma de Freya',
 'Corrente venusiana no coração e no ventre: magnetismo pessoal, abertura ao prazer e à beleza, desejo e poder integrados sem culpa. Calor irradiante, postura fluida e graciosa, sensibilidade estética ampliada. Base dos ritos de amor, prosperidade e seiðr — exige clareza de intenção.',
 30, 16),

('Assuma a Forma de Loki',
 'Correntes ígneas e mercuriais instáveis: flexibilidade mental, criatividade disruptiva e obstáculos contornados por ângulos inesperados. Formigamento, calor irregular, inquietação e impulso ao movimento. Arriscada — tende a vazar para além da sessão se não for contida com banimento rigoroso.',
 45, 17),

('Assuma a Forma de Hel',
 'Corrente saturnina e ctônica: aceitação profunda da finitude, desapego e quietude, com perdas e finais encarados sem fuga. Frio, peso, imobilidade e respiração muito lenta; a energia desce e se aquieta. Avançada — nunca em estado depressivo; encerre reafirmando com vigor a própria vitalidade.',
 65, 18),

('Assuma a Forma de Týr',
 'Corrente marcial disciplinada de Geburah, o aço frio da resolução justa: integridade e coragem para fazer o certo apesar do custo, com desapego do resultado pessoal. Firmeza vertical, coluna e mandíbula estáveis, respiração controlada. Para votos, compromissos e decisões de consequência.',
 30, 19),

-- ═══ IV · PANTEÃO HINDU ═══
('Assuma a Forma de Shiva',
 'Sahasrara e o eixo sutil da sushumna: desapego profundo e quietude imperturbável, com apegos e identificações rígidas dissolvidos. Silêncio vasto, imobilidade luminosa, frescor na coroa, respiração que se suspende sozinha. Pratique sentado e estável — não em estados de dispersão ou agitação.',
 45, 20),

('Assuma a Forma de Kali',
 'Correntes ígneas ascendentes por toda a coluna: confronto direto com medos e apegos, ilusões do ego desfeitas de golpe, raiva reprimida liberada. Calor intenso, ondas de força, possível tremor e impulso à vocalização. Muito avançada — só com preparo, banimento firme e reancoragem obrigatória.',
 65, 21),

('Assuma a Forma de Vishnu',
 'Anahata em sua vertente de preservação: serenidade estável, senso de ordem e equanimidade diante da mudança. Amplitude serena, sensação de estar sustentado, respiração ampla e regular. Das formas hindus mais seguras — excelente para restaurar o equilíbrio depois da turbulência.',
 20, 22),

('Assuma a Forma de Ganesha',
 'Muladhara em sua vertente de impulso: confiança para começar, bloqueios internos removidos, otimismo prático e bom humor. Enraizamento firme, calor suave no baixo-ventre, sensação de caminho aberto. Dissolve a procrastinação e o medo de iniciar — porta de entrada do panteão hindu.',
 20, 23),

('Assuma a Forma de Sarasvati',
 'Vishuddha, centro da expressão e da verdade: clareza mental, fluência de palavra e inspiração criativa serena. Leveza na garganta e na fronte, voz mais límpida, impulso a expressar-se. Segura e muito benéfica — afina a mente antes de escrever, estudar, cantar ou falar em público.',
 20, 24),

('Assuma a Forma de Hanuman',
 'Manipura, centro da vontade e do poder pessoal: coragem destemida, lealdade e limites autoimpostos rompidos. Energia ardente e expansiva no abdômen, postura ativa, disposição elevada. Estável e estimulante — força a serviço de um propósito, contra o cansaço, o medo e a inércia.',
 20, 25),

-- ═══ V · PANTEÃO MESOPOTÂMICO ═══
('Assuma a Forma de Marduk',
 'Correntes jupiterianas de comando e ordem: autoridade ordenadora e coragem para enfrentar o caos interior, com estrutura imposta ao que está desorganizado. Expansão firme no peito e nos ombros, respiração ampla, postura imponente. Para assumir o comando e reorganizar a própria vida.',
 30, 26),

('Assuma a Forma de Inanna',
 'Correntes venusianas e marciais combinadas no coração, no ventre e no plexo: magnetismo, paixão e ambição, com coragem para desejar e conquistar. Calor magnético, presença adensada, postura confiante. A jornada de descida-e-retorno — ardente e ambivalente, exige clareza de intenção.',
 45, 27),

('Assuma a Forma de Tiamat',
 'Correntes abissais abaixo de Yesod: contato com o inconsciente primordial e o caos criativo, estruturas dissolvidas para alcançar o potencial bruto. Vastidão aquosa, contornos corporais que se perdem, possível vertigem leve. Muito avançada e dissolvente — só para maduros, nunca sem banimento poderoso.',
 65, 28),

('Assuma a Forma de Enki',
 'Corrente de sabedoria fluida entre Hod e Yesod: engenho para resolver o impossível, soluções sutis e benevolência serena. Fluxo mental profundo e calmo, como águas subterrâneas; clareza sem rigidez, relaxamento com lucidez. Estável e criativa — boa para estratégia, criação e impasses.',
 30, 29),

('Assuma a Forma de Ereshkigal',
 'Correntes saturninas e ctônicas profundas: confronto com a sombra, a solidão e a finitude, sustentando o que é pesado sem fuga. Peso corporal, lentidão, resfriamento e grande quietude; a energia afunda e se aquieta no escuro. Nunca em estados frágeis; encerre reafirmando a vitalidade e o retorno à luz.',
 65, 30),

('Assuma a Forma de Pazuzu',
 'Correntes marciais defensivas e de limiar: proteção feroz, influências hostis repelidas, firmeza para erguer barreiras. Sensação de armadura ativa em torno do corpo, respiração forte, postura de guarda. Estritamente apotropaica — só com propósito protetor definido e banimento rigoroso ao fim.',
 65, 31)

) as v(name, description, xp_reward, sort_order)
where g.slug = 'pantheon'
on conflict (grimoire_id, name) do update
  set description = excluded.description,
      xp_reward   = excluded.xp_reward,
      sort_order  = excluded.sort_order;

-- Conferência
select s.sort_order, s.name, s.xp_reward, length(s.description) as tam
from spells s join grimoires g on g.id = s.grimoire_id
where g.slug = 'pantheon'
order by s.sort_order;
