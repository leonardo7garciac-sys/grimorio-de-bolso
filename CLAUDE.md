# Grimório de Bolso — convenções do projeto

PWA de prática oculta da marca Baltazar. React + Supabase, publicado no
Cloudflare Pages. Todo o conteúdo, nomes de coluna e mensagens são em
português do Brasil — mantenha o idioma em código novo e em migrações.

---

## Migrações

- Ficam em `supabase/migrations/`, numeradas em sequência.
- **O autor escreve e executa as migrações à mão**, no SQL Editor do
  Supabase. Nunca execute uma migração; só versione.
- Arquivo salvo na pasta **não entra em commit sozinho**. Antes de
  commitar, confira `git status` por arquivos não rastreados ali — já
  aconteceu de várias migrações rodarem em produção sem estarem
  versionadas.
- Migração de conteúdo (seed) é separada da migração de estrutura, e
  deve ser re-executável: `on conflict do update` quando houver chave
  única, ou `delete` com faixa antes do `insert` quando não houver.
  Ao usar `delete` num seed, **limite o escopo** — um `delete` por
  `work_id` sem filtro de faixa apaga o que as migrações seguintes
  semearam.

## Armadilhas do Postgres já encontradas neste projeto

Cada uma destas custou tempo. Confira antes de escrever.

- **View com `select *` congela as colunas na criação.** Coluna nova na
  tabela não aparece na view até ela ser recriada.
- **`create or replace view` só aceita coluna nova NO FIM.** Inserir no
  meio é lido como renomeação e falha com *cannot change name of view
  column*.
- **`create or replace function` não muda a forma do retorno.** Se o
  `returns table` ganhar ou perder coluna, é preciso
  `drop function` antes, senão dá erro 42P13.
- **`create or replace function` também não renomeia parâmetro.** Se a
  assinatura real diferir, o Postgres cria uma função nova em vez de
  substituir — e ficam duas, com chamadas ambíguas.
- **Constraint `check` com lista de valores exige drop e recriação**
  para aceitar um valor novo.
- **Valor de enum recém-criado não pode ser usado na mesma transação.**
  Se precisar inserir usando o valor novo, prefira uma coluna de texto
  a um valor de enum.
- **`null = any(array)` resulta em NULL, e `check` só rejeita FALSE** —
  por isso nulos passam por listas de valores sem serem mencionados.
- **Funções que leem `auth.uid()` não podem ser testadas no SQL
  Editor**: ali o `auth.uid()` é nulo e a função devolve vazio. Teste
  pelo app, ou consulte as tabelas subjacentes direto.
- **Fan-out**: juntar duas tabelas um-para-muitos multiplica as linhas
  e infla qualquer `sum()`. Use subconsultas.
- **Datas e períodos usam o fuso `America/Sao_Paulo`**, não o da sessão
  (que no Supabase é UTC). Sem isso, o "hoje" do banco vira o dia
  seguinte às 21h de Brasília.

## Funções reescritas por inteiro

`friend_profile` e outras funções longas são **substituídas por
completo** a cada alteração. Antes de mexer em qualquer uma delas,
leia a versão que está em produção:

```sql
select prosrc from pg_proc where proname = 'nome_da_funcao';
```

Partir de um adendo antigo já apagou em silêncio um filtro de
privacidade que estava no ar.

## Segurança

- **A RLS é o portão de verdade.** Bloqueio só no front é contornável:
  basta chamar a API do Supabase direto.
- Áreas do Círculo usam `public.is_paying(user)`. Se um recurso ficar
  visível para não-assinante, confirme que existe trava no banco, não
  só na tela.
- A checagem de quests verificadas fica no gatilho
  `on_submission_insert`, nunca no front.

## Cloudflare

- São **duas aplicações separadas**. `grimorio-de-bolso` é o site,
  ligado ao GitHub. `grimorio-webhook-hotmart` é o Worker que atende
  `webhook.daily-arcane.com`.
- **O Worker tem deploy próprio**: `npx wrangler deploy` dentro de
  `webhook/`. Commit e push **não** publicam o Worker — o código vai
  para o GitHub e o Worker continua rodando a versão antiga.

## PWA e cache

O service worker guarda o bundle. Depois de um deploy, o app instalado
no celular pode continuar servindo a versão antiga por bastante tempo.
Antes de concluir que uma alteração "não funcionou", teste no
`localhost` ou numa janela anônima.

## Webhook da Hotmart

- **Responda sempre 200**, mesmo em falha. A Hotmart desativa a
  configuração do webhook se a URL devolver erro — derrubaria todas as
  vendas, não só a que falhou.
- O payload cru é gravado em `webhook_events` **antes** de processar.
  Falha de processamento vira linha com `processed_at` nulo, que é a
  fila de reprocessamento.
- **Renovação de assinatura chega como `PURCHASE_APPROVED`**, o mesmo
  evento da primeira compra. Não existe evento próprio de renovação.
- Reprocessar é seguro: a idempotência é garantida por índices únicos
  em `circle_passes.ref_id` e `pending_grants`.

## Avatar (`AvatarEtereo.jsx`)

Toda a configuração de posicionamento vive em `SLOT_ANCHORS` e
`ITEM_OVERRIDE`, **num lugar só**. O componente serve tanto ao avatar
do próprio usuário quanto ao do amigo — nunca duplique a lógica.

- `ITEM_OVERRIDE` é indexado por **slug**. Se o slug não chegar, todos
  os ajustes por item somem e a peça volta ao padrão do slot.
- **`grip` é medido do TOPO do sprite** (0 = topo, 100 = base) e serve
  ao mesmo tempo de `transform-origin` e de ponto que se apoia no
  âncora. Quanto **menor** o número, mais baixo o item aparece.
- A fórmula é
  `translate(-50%, -grip%) rotate(Xdeg) scaleX(±1)` com
  `transform-origin: 50% grip%`. Grip negativo funciona.
- **`offsetX` é somado ao `left`, fora da string de transform**, de
  propósito: dentro dela acompanharia o eixo girado e o espelhamento.
- Espelhar a mão esquerda **inverte o sentido da rotação e o sinal do
  `offsetX`**.
- O recorte da cintura corta o sprite e gira junto com ele; o das
  costas fica **fixo ao palco**, num wrapper sem transform.
- Slots: `mao`, `peito`, `cintura`, `costas`, `atras_cabeca`. A mão
  comporta dois itens; a mão específica vem de `user_items.hand`, com
  valores `mao_direita` e `mao_esquerda`.

## Imagens

- **Ícone da loja**: webp com alfa, canvas quadrado de 512×512, peça
  centralizada ocupando cerca de 96% do lado maior.
- Sprites do avatar são recortados **colados na arte**, sem moldura
  transparente — margem no canvas faz o número de tamanho mentir.
- `image_path_equipped` cai em `image_path` **silenciosamente**. Um
  arquivo faltando no bucket parece um fallback funcionando: se a arte
  errada aparecer, confira o nome do arquivo no Storage antes de
  suspeitar do código.

## Quests

- A coluna `auto_check` em `quests` indica que o banco confere sozinho.
  Nula = quest comum, com revisão manual.
- O `period_key` é calculado nos **dois lados** — em
  `src/lib/periodKey.js` e no banco — e precisam concordar, senão o
  índice único `(user_id, quest_id, period_key)` rejeita a
  reivindicação.
- Para aposentar uma quest, use `is_active = false` em vez de apagar:
  preserva o histórico de quem cumpriu e permite trazê-la de volta.

## Hábito de trabalho

- **Liste o que encontrou antes de alterar** quando o pedido envolver
  código que você ainda não leu.
- Quando um comportamento não muda depois de uma alteração, verifique
  nesta ordem: cache do PWA, deploy do Worker, e só então o código.
- Ao baixar arquivos no Windows, o navegador acrescenta ` (1)` a nomes
  repetidos. Antes de subir ao Storage, confirme o nome exato.
