# GRIMÓRIO DE BOLSO — HANDOFF v3 (documento para o Claude Code)

Guarde este arquivo na raiz do repositório como `HANDOFF.md`.
Substitui o HANDOFF v2. O Claude Code deve lê-lo antes de qualquer tarefa.

## Visão geral do produto

PWA mobile-first (React + Vite + Tailwind) no Cloudflare Pages, backend
100% Supabase (auth magic link, Postgres com RLS, Storage). Estética:
navy profundo (#0a1024), dourado (#c9962e), serifada, registro grimório.
O protótipo `prototype/grimorio-de-bolso-v5.jsx` é a referência visual e
funcional OBRIGATÓRIA — portar, não redesenhar.

Áreas (navegação inferior):
1. **Grimórios** (gratuito) — coleção CURADA: o usuário rastreia técnicas
   do catálogo e forja práticas pessoais (seção "Práticas Pessoais",
   0 XP). Cada técnica tem painel com status explícito (não iniciado /
   em prática / dominado) + Diário de Práticas (escrever/listar/apagar).
   Dominar técnica do catálogo dá XP; XP define grau (Neófito→Ipsissimus).
2. **Quests** (gratuito) — tarefas diárias/semanais com prova
   (nenhuma/relato/foto); aprovadas rendem moedas ✦.
3. **Tesouro** (gratuito) — loja de cosméticos por moedas: armas mágicas,
   itens encantados, títulos cerimoniais, cosméticos de perfil.
   Nada afeta XP/ranking.
4. **Bestiário** (premium) — verbetes ilustrados com selo epistêmico.
5. **Acervo** (premium) — obras históricas com trechos e notas de estudo.
6. **Fórum** (premium) — 3 categorias, gate de aceite de diretrizes,
   autores exibidos só por nickname.
7. **Ranking** (premium) — liga por grau, janela mensal, nicknames.

Premium = existe linha em `entitlements` (compra Hotmart via webhook).
Regra de ouro: **o front nunca calcula XP, saldo ou permissão — o banco
(triggers/RPCs/RLS) é a única fonte de verdade.**

## Migrações (ordem OBRIGATÓRIA no SQL Editor do Supabase)

1. `001_base.sql` — titles, profiles, grimoires, spells, user_spells,
   entitlements, triggers XP/grau, RLS, view my_grimoires.
2. `002_ranking.sql` — nickname+opt-in, is_paying(), ranking_da_lua,
   get_ranking_da_lua, set_ranking_identity.
3. `003_bestiario_acervo_forum.sql` — bestiário, acervo, fórum completo
   (diretrizes versionadas, posts, comments, reports), bucket bestiario.
4. `004_quests_tesouro.sql` (versão v2/Tesouro) — quests, submissões com
   fila de revisão, coin_ledger, shop_items, user_items, buy_item,
   equip_item, set_cosmetic_title, buckets provas/loja, my_balance,
   my_quests_today.
5. `005_diario_curadoria_skills.sql` (versão v2) — spell_journal;
   spells.owner_id (skills próprias, xp_reward=0 forçado por constraint);
   recalc_progression atualizado (só catálogo dá XP); my_collection();
   create_custom_spell().
6. `006_extras.sql` — CRIADA PELO CLAUDE CODE no P1: rpc am_i_paying()
   e view de posts do fórum expondo autor só por nickname.
7. `007_modelo_hibrido.sql` — RODADA PELO USUÁRIO antes do P3: redefine
   is_paying() para "passe do Círculo com validade" (circle_passes,
   my_circle_expiry, grant_circle_pass); my_grimoires ganha a terceira
   porta de acesso (subscriber_included).
8. `008_forum_fix_view.sql` — CRIADA PELO CLAUDE CODE no P5: corrige bug
   da view da 006 (security_invoker esbarrava na RLS de profiles e só
   mostrava os posts do próprio usuário). Substitui por forum_feed()
   e forum_post_comments(), no padrão de get_ranking_da_lua.

---

## PARTE 1 — Mapa de queries (supabase-js)

Cliente único (src/lib/supabase.js):

```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Sessão e gates

```js
await supabase.auth.signInWithOtp({ email })
const { data: { user } } = await supabase.auth.getUser()
supabase.auth.onAuthStateChange((event, session) => { ... })
const { data: paying } = await supabase.rpc('am_i_paying')  // da 006
```

### Cabeçalho (todas as telas)

```js
const { data: profile } = await supabase.from('profiles')
  .select('display_name, xp_total, title_id, nickname, show_in_ranking, cosmetic_title_id')
  .single()
const { data: titles } = await supabase.from('titles').select('*').order('min_xp')
const { data: balance } = await supabase.rpc('my_balance')
```

Progresso: `(xp_total - atual.min_xp) / (proximo.min_xp - atual.min_xp)`.
`cosmetic_title_id` preenchido → exibir nome do item junto ao grau.

### Aba Grimórios (coleção curada — protótipo v5)

```js
// coleção inteira numa chamada (rastreadas + práticas pessoais,
// com grimório, status e contagem de diário)
const { data: col } = await supabase.rpc('my_collection')

// catálogo para a tela "Adicionar técnica" (filtrar as já rastreadas
// no front comparando com a coleção)
const { data: catalog } = await supabase.from('spells')
  .select('id, name, description, xp_reward, grimoire_id')
  .is('owner_id', null)
const { data: grimoires } = await supabase.from('my_grimoires').select('*')
// grimório premium sem acesso: exibir técnicas como "seladas"

// rastrear / mudar status / deixar de rastrear
await supabase.from('user_spells').upsert({
  user_id: user.id, spell_id, status })         // triggers recalculam XP
await supabase.from('user_spells').delete()
  .eq('user_id', user.id).eq('spell_id', spellId) // diário fica salvo

// forjar prática pessoal (já entra rastreada; 0 XP garantido pelo banco)
const { data: newId } = await supabase.rpc('create_custom_spell', {
  p_name: nome, p_description: desc })
// editar/apagar prática pessoal
await supabase.from('spells').update({ name, description }).eq('id', id)
await supabase.from('spells').delete().eq('id', id)  // diário some (cascade)

// diário de práticas
const { data: entries } = await supabase.from('spell_journal')
  .select('id, body, created_at').eq('spell_id', spellId)
  .order('created_at', { ascending: false })
await supabase.from('spell_journal').insert({
  user_id: user.id, spell_id, body })
await supabase.from('spell_journal').delete().eq('id', entryId)
```

UX obrigatória: ao deixar de rastrear, avisar que progresso e diário
ficam guardados; ao apagar prática pessoal, avisar que o diário se
perde junto.

### Aba Quests

```js
const { data: quests } = await supabase.rpc('my_quests_today')
// period_key no front IGUAL ao SQL:
// diária 'D'+YYYY-MM-DD | semanal 'W'+anoISO+'-'+semanaISO

await supabase.from('quest_submissions').insert({           // sem prova
  user_id: user.id, quest_id, period_key })
await supabase.from('quest_submissions').insert({           // relato
  user_id: user.id, quest_id, period_key, proof_text })
const path = `${user.id}/${slug}-${Date.now()}.jpg`         // foto
await supabase.storage.from('provas').upload(path, file)
await supabase.from('quest_submissions').insert({
  user_id: user.id, quest_id, period_key, proof_path: path })
```

Estados: disponível → "Aguardando o Conselho" → aprovada (+✦) |
rejeitada (mostrar review_note; unique impede reenvio no período).

### Aba Tesouro

```js
const { data: items } = await supabase.from('shop_items')
  .select('*').eq('is_active', true).order('sort_order')
const { data: inventory } = await supabase.from('user_items')
  .select('item_id, equipped, acquired_at')
const { data: r } = await supabase.rpc('buy_item', { p_item: id })
// 'ok'|'saldo_insuficiente'|'ja_possui'|'item_indisponivel'
await supabase.rpc('equip_item', { p_item: id, p_equip: true })
await supabase.rpc('set_cosmetic_title', { p_item: id })  // null limpa
const { data: img } = await supabase.storage.from('loja')
  .createSignedUrl(item.image_path, 3600)
```

### Aba Bestiário (premium)

```js
const { data: entries } = await supabase.from('bestiary_entries')
  .select('id, slug, name, kind, pantheon, summary, epistemics, image_path')
  .eq('is_published', true).order('sort_order')
const { data: entry } = await supabase.from('bestiary_entries')
  .select('*').eq('slug', slug).single()
const { data: img } = await supabase.storage.from('bestiario')
  .createSignedUrl(entry.image_path, 3600)
```

### Aba Acervo (premium)

```js
const { data: works } = await supabase.from('library_works')
  .select('*').eq('is_published', true).order('sort_order')
const { data: excerpts } = await supabase.from('library_excerpts')
  .select('*').eq('work_id', workId).order('sort_order')
```

### Aba Fórum (premium)

```js
const { data: g } = await supabase.from('forum_guidelines')
  .select('*').order('version', { ascending: false }).limit(1).single()
const { data: ok } = await supabase.from('guideline_acceptances')
  .select('version').eq('version', g.version)
await supabase.from('guideline_acceptances')
  .insert({ user_id: user.id, version: g.version })

// listagem e thread: usar as RPCs da 008 (não a tabela/view direto —
// elas já aplicam is_paying(), filtro de categoria e nickname do autor)
const { data: posts } = await supabase.rpc('forum_feed', { p_category: cat })
const { data: comments } = await supabase.rpc('forum_post_comments', { p_post: postId })

await supabase.from('forum_posts').insert({
  author_id: user.id, category, title, body })
await supabase.from('forum_comments').insert({
  post_id, author_id: user.id, body })
await supabase.from('forum_reports').insert({
  reporter_id: user.id, post_id, reason })
```

Autores APENAS por nickname — nunca e-mail (view da 006).

### Aba Ranking (premium)

```js
const { data: ranking } = await supabase.rpc('get_ranking_da_lua')
const { data: r } = await supabase.rpc('set_ranking_identity', {
  p_nickname: nick, p_show: true })
// 'ok' | 'nickname_em_uso' | 'nickname_invalido'
```

### Painel admin (NUNCA deployado)

Mini-app separado em admin/ com a service_role key em admin/.env.local
(fora do git). Telas: fila de quest_submissions pendentes (foto assinada
do bucket provas + relato; aprovar/rejeitar com nota) e denúncias do
fórum (resolver; ocultar/remover posts).

---

## PARTE 2 — Passo a passo (do ponto atual ao app no ar)

### ✅ Já feito
- Conta GitHub
- Conta + projeto Supabase criados
- Conta Cloudflare

### Etapa 0 — Ferramentas locais (fazer agora)

1. **Node.js LTS**: nodejs.org → botão LTS → instalar com padrões.
   Verificar no terminal: `node -v` (deve mostrar a versão).
2. **Claude Code**: seguir a instalação atual em
   https://docs.claude.com/en/docs/claude-code
   Verificar: `claude --version`.

### Etapa 1 — Configurar o projeto Supabase (~10 min)

1. No painel do projeto → **SQL Editor** → colar e rodar (Run) UM
   arquivo por vez, nesta ordem, conferindo "Success" em cada:
   001 → 002 → 003 → 004(v2) → 005(v2).
   (A 006 será gerada pelo Claude Code e rodada aqui depois do P1.)
2. **Settings → API**: copiar `Project URL` e `anon public key` num
   bloco de notas — vão pro .env.local na Etapa 3.
   A `service_role key` fica guardada em local seguro (painel admin).
3. **Authentication → Sign In / Providers**: confirmar **Email**
   habilitado (magic link/OTP).

### Etapa 2 — Montar a pasta do projeto (~5 min)

```
grimorio-de-bolso/
├── HANDOFF.md                       ← este arquivo (renomeado)
├── prototype/
│   └── grimorio-de-bolso-v5.jsx
└── supabase/migrations/
    ├── 001_base.sql
    ├── 002_ranking.sql
    ├── 003_bestiario_acervo_forum.sql
    ├── 004_quests_tesouro.sql       ← versão v2 (Tesouro)
    └── 005_diario_curadoria_skills.sql  ← versão v2
```

### Etapa 3 — Sessões no Claude Code

Terminal na pasta do projeto → `claude` → um prompt por vez,
revisando e testando entre eles:

**P1 — Fundação**
> Leia o HANDOFF.md e o protótipo em prototype/. Crie um app Vite +
> React (JavaScript) com Tailwind neste diretório. Estrutura: src/lib,
> src/components, src/tabs, src/hooks. Configure .env.local com
> VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vou colar os valores),
> cliente em src/lib/supabase.js, .env.local no .gitignore. Crie a
> migração supabase/migrations/006_extras.sql com a rpc am_i_paying()
> e a view de posts do fórum que expõe autor só por nickname (Parte 1
> do HANDOFF). Inicialize git, crie o repositório privado no GitHub e
> faça o primeiro push.

→ Rodar a 006 no SQL Editor do Supabase antes de continuar.

**P2 — Auth**
> Implemente auth por magic link: tela de login na estética do
> protótipo (navy/dourado, serifada), sessão global via hook, logout,
> guarda de rotas. Sem senha.

**P3 — Casca + Grimórios + abas de leitura**
> Porte o protótipo v5 para o app real: cabeçalho fixo (grau, título
> cosmético, barra de XP, saldo ✦), navegação inferior com 7 áreas,
> gate premium via rpc am_i_paying() (tela "Câmara selada"). Aba
> Grimórios completa conforme o protótipo: coleção via rpc
> my_collection(), tela "Adicionar técnica" (catálogo + forjar prática
> pessoal via create_custom_spell), seção "Práticas Pessoais", painel
> por técnica com status explícito, Diário de Práticas
> (spell_journal), deixar de rastrear e apagar prática com os avisos
> de UX do HANDOFF. Bestiário e Acervo com queries reais e signed URLs.

**P4 — Quests + Tesouro**
> Aba Quests: rpc my_quests_today(), helper de period_key idêntico ao
> SQL, envio sem prova / relato / foto (bucket provas), estados
> visuais (disponível, aguardando o Conselho, aprovada, rejeitada com
> nota). Tesouro: loja e inventário, my_balance(), buy_item() tratando
> retornos, equip_item(), set_cosmetic_title(); título cosmético no
> cabeçalho.

**P5 — Fórum + Ranking**
> Fórum: gate de aceite das diretrizes versionadas, listagem com
> filtro por categoria, criar post, comentar, denunciar; autores só
> por nickname (view da 006). Ranking: get_ranking_da_lua agrupado por
> liga, destaque do usuário, fluxo de nickname + opt-in via
> set_ranking_identity tratando erros.

**P6 — PWA + polimento**
> PWA instalável (manifest "Grimório de Bolso", tema #0a1024, ícones,
> service worker de cache básico). Responsividade mobile, estados de
> loading/vazio/erro em toda aba, foco visível e contraste.

**P7 — Painel admin local**
> Crie em admin/ um mini-app Vite separado que roda SÓ localmente com
> a service_role key em admin/.env.local (no .gitignore). Telas: fila
> de quest_submissions pendentes (foto assinada + relato,
> aprovar/rejeitar com nota) e denúncias do fórum (resolver,
> ocultar/remover). README do admin deixando claro: jamais deployar.

**P8 — Teste guiado**
> Rode o dev server e gere um checklist de teste manual: login,
> rastrear/forjar técnica, diário, status subindo grau (e prática
> pessoal NÃO subindo), quests das 3 modalidades, compra e equip no
> Tesouro, gates premium, fórum com aceite, ranking.

Truques de teste:
- Virar "pagante": inserir linha em `entitlements` com teu user_id
  pelo Table Editor.
- Aprovar quest: painel admin do P7.

### Etapa 4 — Deploy no Cloudflare Pages (~10 min)

1. Garantir push atualizado no GitHub (o Claude Code faz).
2. dash.cloudflare.com → **Workers & Pages → Create → Pages →
   Connect to Git** → autorizar GitHub → escolher o repositório.
3. Build: framework **Vite**, comando `npm run build`, output `dist`.
   Excluir a pasta admin/ do build.
4. **Environment variables**: VITE_SUPABASE_URL e
   VITE_SUPABASE_ANON_KEY (mesmos valores do .env.local).
5. Deploy → cada push na main publica sozinho.
6. **Supabase → Authentication → URL Configuration**: adicionar
   https://seuapp.pages.dev como Site URL e Redirect URL — sem isso o
   magic link não volta pro app.

### Etapa 5 — Conteúdo e Hotmart (pós-MVP)

1. Popular pelo Table Editor ou script de seed (pedir ao Claude Code a
   partir dos teus materiais): grimórios/técnicas reais, bestiário
   (Bestiário Astral + PANTHEON), acervo (domínio público ou texto
   próprio), Tesouro (Arsenal Astral → armas mágicas).
2. Ilustrações nos buckets bestiario e loja.
3. Webhook Hotmart → Cloudflare Worker: postback de compra aprovada →
   valida token → localiza usuário por e-mail → insere em entitlements
   com a service_role key. Pedir ao Claude Code quando chegar aqui.

### Ordem de lançamento

MVP: auth + grimórios (com diário/curadoria) + quests + tesouro +
ranking (loop diário completo no dia 1) → bestiário + acervo →
fórum por último, com ~50 pagantes ativos.
