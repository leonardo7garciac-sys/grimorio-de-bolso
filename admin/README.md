# Painel Admin — Grimório de Bolso

Mini-app Vite separado, para rodar **só localmente** com a `service_role`
key do Supabase.

## NUNCA DEPLOYAR ESTE APP

A `service_role` key ignora toda RLS. Se este app for publicado (Cloudflare
Pages, Vercel, um servidor qualquer, etc.), qualquer pessoa que acessar a
URL tem acesso irrestrito de leitura/escrita ao banco inteiro. Ele existe
apenas para rodar na tua máquina via `npm run dev`. Não crie workflow de
deploy para esta pasta, não aponte domínio nenhum para ela.

## Setup

```
cd admin
npm install
```

Copie a Supabase URL e a **service_role key** (Project Settings → API —
não é a `anon` key) para `admin/.env.local`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=...
```

Esse arquivo já está coberto pelo `.gitignore` da raiz do projeto (padrão
`.env.local`) — nunca commitá-lo.

```
npm run dev
```

## Telas

- **Fila de Quests** — submissões `pendente` (foto ou relato; submissões
  sem prova já se auto-aprovam no banco). Mostra a foto via signed URL do
  bucket `provas` ou o texto do relato. Aprovar credita moedas
  automaticamente (trigger `on_submission_approved`); rejeitar exige uma
  nota, que fica registrada em `review_note` e é o que o usuário vê no
  app como motivo da rejeição.
- **Denúncias do Fórum** — `forum_reports` com `resolved = false`, junto
  do conteúdo denunciado (post ou comentário) e do autor/denunciante por
  nome. "Ocultar"/"Remover" alteram o `status` do post ou comentário
  (`oculto`/`removido`) e marcam a denúncia como resolvida. "Ignorar"
  resolve a denúncia sem alterar o conteúdo (falso positivo).
