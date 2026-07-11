# P8 — Checklist de teste manual

Rodar com o app principal em http://localhost:5173 (e, quando indicado,
o painel admin em http://localhost:5175 lado a lado). Marque cada item
ao testar; qualquer falha, anote o comportamento observado.

## 1. Login (magic link)
- [ ] Acessar o app deslogado → aparece a tela de login (sem campo de senha).
- [ ] Enviar e-mail válido → estado "link enviado" aparece, sem erro.
- [ ] Abrir o link do e-mail → volta autenticado, cabeçalho e navegação aparecem.
- [ ] Fechar a aba e reabrir o app → continua logado (sessão persistida).
- [ ] Logout → volta para a tela de login; recarregar a página confirma que não reloga sozinho.

## 2. Grimórios — rastrear e forjar técnica
- [ ] "Adicionar técnica" lista o catálogo agrupado por grimório.
- [ ] Rastrear uma técnica do catálogo → aparece na coleção com status "não iniciado".
- [ ] Forjar uma prática pessoal (nome + descrição) → aparece agrupada em "Práticas Pessoais", separada do catálogo.
- [ ] Tentar forjar com nome muito curto → botão fica desabilitado / não envia.

## 3. Diário de práticas
- [ ] Abrir uma técnica rastreada → painel expande com seletor de status e diário.
- [ ] Adicionar uma entrada no diário → aparece na lista, mais recente primeiro.
- [ ] Apagar uma entrada do diário → some da lista.
- [ ] Deixar de rastrear a técnica → aviso de confirmação aparece antes de confirmar.

## 4. Status subindo grau (XP só do catálogo)
- [ ] Anotar o XP/grau atual no cabeçalho.
- [ ] Marcar uma técnica **do catálogo** como "dominado" → XP total sobe no cabeçalho (e grau, se cruzar o limiar).
- [ ] Marcar uma **prática pessoal** como "dominado" → XP total do cabeçalho **não muda** (práticas pessoais não concedem XP).
- [ ] Voltar a técnica do catálogo para "praticando"/"não iniciado" → XP recalcula para baixo de novo.

## 5. Quests — as 3 modalidades
- [ ] Quest **sem prova**: concluir → aprova automaticamente na hora, sem passar por "aguardando o Conselho".
- [ ] Quest **relato**: enviar texto → estado vira "aguardando o Conselho" (pendente).
- [ ] Quest **foto**: enviar imagem → upload ok, estado vira "aguardando o Conselho".
- [ ] No admin (5175, aba Fila de Quests): aprovar a submissão de relato → saldo de moedas do usuário sobe no app principal (recarregar Tesouro/cabeçalho).
- [ ] No admin: rejeitar a submissão de foto com uma nota → no app principal aparece como "rejeitada" mostrando a nota.
- [ ] Tentar reenviar a mesma quest diária no mesmo dia → já aparece como enviada/pendente, não deixa duplicar.

## 6. Tesouro — compra e equipar
- [ ] Saldo mostrado bate com o que as quests aprovadas renderam.
- [ ] Comprar um item com saldo suficiente → desconta o saldo, item passa a aparecer no inventário.
- [ ] Tentar comprar de novo o mesmo item → mensagem de "já possui", não desconta de novo.
- [ ] Tentar comprar item mais caro que o saldo → mensagem de saldo insuficiente, nada é debitado.
- [ ] Equipar um item cosmético → reflete visualmente (perfil/inventário) que está equipado; desequipar reverte.
- [ ] Definir um título especial comprado como título cosmético → aparece no cabeçalho junto ao grau.
- [ ] Limpar o título cosmético → cabeçalho volta a não mostrar título extra.

## 7. Gates premium
- [ ] Usuário sem Círculo ativo/entitlement: abrir Bestiário/Acervo/Fórum/Ranking (ou grimório premium) → tela "Câmara selada", sem conteúdo vazando.
- [ ] Conceder um passe do Círculo (ou entitlement) a esse usuário → as mesmas áreas liberam conteúdo real.
- [ ] Cabeçalho mostra "Círculo até DD/MM" enquanto o passe estiver ativo.
- [ ] Deixar o passe expirar (ou testar com um sem passe) → volta a mostrar "Câmara selada".

## 8. Fórum com aceite de diretrizes
- [ ] Primeiro acesso ao Fórum sem ter aceitado as diretrizes → tela de aceite aparece antes de qualquer post.
- [ ] Aceitar → passa a ver a listagem, filtrável por categoria.
- [ ] Criar um post → aparece na listagem com o nickname (nunca e-mail/nome real).
- [ ] Comentar em um post → aparece na thread.
- [ ] Denunciar um post/comentário → some do fluxo do usuário; aparece na fila do admin (5175, aba Denúncias).
- [ ] No admin: ocultar o post denunciado → some da listagem do fórum no app principal.

## 9. Ranking
- [ ] Sem nickname/opt-in definido: tela pede para configurar identidade antes de mostrar o ranking.
- [ ] Definir nickname válido + opt-in → passa a aparecer na lista, agrupado por liga (grau), destacado como "você".
- [ ] Tentar usar um nickname já em uso por outra conta → mensagem de nickname em uso, não salva.
- [ ] Desativar o opt-in → some da lista de ranking dos outros usuários.

---
Ao concluir, reporte quais itens falharam (ou nenhum) para eu corrigir antes de seguirmos para as migrações 009/010 e os prompts P9/P10.
