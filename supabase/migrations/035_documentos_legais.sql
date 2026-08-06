-- 035_documentos_legais.sql
-- Politica de Privacidade e Termos de Uso versionados, com registro de
-- aceite por usuario e versao.
--
-- MESMO PADRAO das diretrizes do forum (adendo 003): o texto vive no
-- banco, nao no codigo. Duas vantagens que arquivo estatico nao da —
-- atualizar sem publicar deploy, e PROVA de que a pessoa aceitou
-- aquela versao naquela data, que e o que vale se alguem questionar.
--
-- LEITURA PUBLICA, DE PROPOSITO: quem esta decidindo se cria conta
-- precisa poder ler os documentos ANTES do cadastro, e a Hotmart pode
-- pedir um endereco publico. So o ACEITE e restrito ao dono.

create type legal_kind as enum ('privacidade', 'termos');

create table public.legal_documents (
  kind         legal_kind  not null,
  version      smallint    not null,
  body         text        not null,
  published_at timestamptz not null default now(),
  primary key (kind, version)
);

create table public.legal_acceptances (
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        legal_kind not null,
  version     smallint not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, kind, version),
  foreign key (kind, version) references public.legal_documents(kind, version)
);

alter table public.legal_documents enable row level security;
create policy "documentos: leitura publica" on public.legal_documents
  for select using (true);

alter table public.legal_acceptances enable row level security;
create policy "aceites legais: dono le"   on public.legal_acceptances
  for select using (auth.uid() = user_id);
create policy "aceites legais: dono cria" on public.legal_acceptances
  for insert with check (auth.uid() = user_id);


-- Versao vigente de cada documento, para o front comparar com o que o
-- usuario ja aceitou.
create or replace function public.legal_current()
returns table (kind legal_kind, version smallint, body text)
language sql stable
security definer set search_path = public
as $$
  select distinct on (d.kind) d.kind, d.version, d.body
    from public.legal_documents d
   order by d.kind, d.version desc;
$$;

-- O que falta o usuario aceitar. Vazio = em dia.
create or replace function public.legal_pending()
returns table (kind legal_kind, version smallint)
language sql stable
security definer set search_path = public
as $$
  select c.kind, c.version
    from public.legal_current() c
   where not exists (
     select 1 from public.legal_acceptances a
      where a.user_id = auth.uid()
        and a.kind = c.kind
        and a.version = c.version
   );
$$;


-- ═══════════════════════════════════════════════════════════════════
-- POLITICA DE PRIVACIDADE — versao 1
-- ═══════════════════════════════════════════════════════════════════
insert into public.legal_documents (kind, version, body) values
('privacidade', 1, $doc$
# Política de Privacidade — Grimório de Bolso

**Última atualização:** 6 de agosto de 2026

Esta política explica quais dados o Grimório de Bolso coleta, por que
os coleta, com quem os compartilha e o que você pode fazer a respeito.
Foi escrita para ser lida, não para ser tolerada.

---

## Quem é o responsável

O Grimório de Bolso é operado pela **Daily Arcane**, sediada em
Sorocaba, São Paulo.

Para qualquer assunto relativo aos seus dados, escreva para
**baltazar.dailyarcane@gmail.com**.

---

## Que dados coletamos

**Ao criar a conta:** seu e-mail e o apelido que você escolher.

**Enquanto você usa o aplicativo:**

- o registro das técnicas que você pratica e domina;
- o que você escreve no diário de prática;
- os servidores astrais que você cria — nome, descrição, imagem do
  sigilo e ciclo de recarga;
- os sigilos que você forja;
- suas amizades, mensagens privadas e trocas de itens;
- seu progresso: grau, experiência, moedas e itens.

**Se você assinar o Círculo:** o registro da compra, recebido da
Hotmart, contendo o e-mail informado no pagamento e o identificador da
transação. **Não recebemos nem armazenamos dados de cartão.**

---

## O que deliberadamente não coletamos

Algumas ausências aqui são escolhas de projeto, não esquecimentos:

- **O intento dos sigilos não é guardado.** A ferramenta gera o
  símbolo no seu navegador; apenas o desenho é salvo. O texto do
  desejo nunca chega ao servidor.
- **A descrição dos seus servidores astrais nunca é mostrada a
  ninguém**, nem mesmo a amigos que possam ver que o servidor existe.
- **Seu e-mail nunca é exposto a outros usuários.** Dentro do
  aplicativo, sua identidade pública é apenas o apelido.
- Não usamos rastreadores de terceiros, não exibimos publicidade e não
  vendemos dados a ninguém.

---

## Por que tratamos cada dado

| Dado | Finalidade | Base legal |
|---|---|---|
| E-mail e senha | Identificar você e dar acesso à conta | Execução de contrato |
| Apelido | Identidade pública no ranking e no convívio | Execução de contrato |
| Diário, servidores, sigilos, progresso | Prestar o serviço que você contratou | Execução de contrato |
| Mensagens e amizades | Permitir o convívio entre praticantes | Execução de contrato |
| Registro de compra | Conceder acesso, emitir documento fiscal e comprovar a relação de consumo | Obrigação legal |
| Denúncias no fórum | Moderar a comunidade | Legítimo interesse |

---

## Com quem compartilhamos

Não vendemos nem cedemos seus dados. Eles passam apenas por empresas
que nos prestam serviço de infraestrutura:

- **Supabase** — banco de dados e autenticação;
- **Cloudflare** — hospedagem e entrega do aplicativo;
- **Hotmart** — processamento dos pagamentos da assinatura.

**Transferência internacional:** os servidores dessas empresas podem
estar fora do Brasil. Ao usar o aplicativo, você concorda com essa
transferência, que ocorre sob as salvaguardas contratuais dos
respectivos fornecedores.

---

## Por quanto tempo guardamos

Seus dados permanecem enquanto a conta existir. Quando você apaga a
conta, tudo é removido de imediato: diário, servidores, sigilos,
mensagens, amizades, itens e progresso.

**Uma exceção:** os registros das compras são mantidos mesmo após a
exclusão da conta, pelo prazo exigido pela legislação fiscal e civil.
Isso existe para que tanto você quanto nós possamos comprovar uma
transação em caso de disputa.

---

## Seus direitos

A Lei Geral de Proteção de Dados garante que você possa, a qualquer
momento:

- **saber** quais dados temos sobre você;
- **corrigir** dados incompletos ou desatualizados;
- **obter uma cópia** dos seus dados;
- **apagar** sua conta e tudo que ela contém;
- **revogar** o consentimento dado;
- **saber** com quem compartilhamos seus dados.

A exclusão da conta você faz sozinho, na tela de perfil, sem precisar
pedir a ninguém. Para os demais direitos, escreva para
**baltazar.dailyarcane@gmail.com** — respondemos em até 15 dias.

---

## Idade mínima

O Grimório de Bolso é destinado a **maiores de 18 anos**. Não coletamos
intencionalmente dados de crianças ou adolescentes. Se soubermos que
uma conta pertence a menor de idade, ela será encerrada e os dados
apagados.

---

## Segurança

O acesso aos dados é controlado no próprio banco de dados, e não apenas
na interface: mesmo quem contornasse o aplicativo não alcançaria dados
de outro usuário. As senhas são armazenadas de forma cifrada pelo
provedor de autenticação, e nem nós temos acesso a elas. Imagens
privadas, como os sigilos dos seus servidores, são servidas por links
temporários e assinados.

Nenhum sistema é perfeitamente seguro. Caso ocorra um incidente que
possa acarretar risco relevante aos seus dados, comunicaremos você e a
Autoridade Nacional de Proteção de Dados, como manda a lei.

---

## Armazenamento no seu aparelho

O aplicativo guarda no seu navegador os dados necessários para manter
você conectado e para funcionar sem internet. Não usamos cookies de
rastreamento nem de publicidade.

---

## Mudanças nesta política

Se esta política mudar de forma relevante, você será avisado dentro do
aplicativo e precisará ler a nova versão antes de continuar. As versões
anteriores ficam registradas.

---

**Dúvidas:** baltazar.dailyarcane@gmail.com
$doc$),


-- ═══════════════════════════════════════════════════════════════════
-- TERMOS DE USO — versao 1
-- ═══════════════════════════════════════════════════════════════════
('termos', 1, $doc$
# Termos de Uso — Grimório de Bolso

**Última atualização:** 6 de agosto de 2026

Ao criar uma conta no Grimório de Bolso, você concorda com o que está
escrito aqui. Leia — é curto.

---

## 1. O que é o Grimório de Bolso

Um aplicativo de registro e acompanhamento de prática oculta, operado
pela **Daily Arcane**, sediada em Sorocaba, São Paulo.

Ele oferece técnicas para praticar, um diário de prática, ferramentas
ritualísticas, um catálogo de conteúdo e um espaço de convívio entre
praticantes.

---

## 2. Quem pode usar

O uso é restrito a **maiores de 18 anos**. Ao criar a conta, você
declara ter essa idade.

A conta é pessoal e intransferível. Você é responsável por manter sua
senha em segurança e por tudo que acontecer sob a sua conta.

---

## 3. Sobre a prática — leia com atenção

Esta é a parte mais importante destes termos.

**O Grimório de Bolso não é serviço de saúde.** As técnicas aqui
descritas pertencem a tradições esotéricas e são oferecidas como
prática pessoal e objeto de estudo. Elas **não são tratamento médico
nem psicológico**, não diagnosticam nada e não substituem
acompanhamento profissional.

Se você tem uma condição de saúde física ou mental, procure um
profissional. Não interrompa tratamento, medicação ou terapia por causa
de qualquer coisa lida ou praticada aqui.

**Pratique dentro de limites seguros.** Nenhuma técnica deste
aplicativo exige jejum prolongado, privação de sono, uso de
substâncias, dor ou risco físico. Se alguma prática lhe causar
sofrimento, interrompa.

Você pratica por sua conta e risco, e é o único responsável pelo que
faz com o que aprende aqui.

---

## 4. O Círculo

O Círculo é uma assinatura mensal que dá acesso a conteúdo e a
ferramentas adicionais.

- A cobrança é processada pela **Hotmart**, não por nós. Pagamento,
  reembolso e cancelamento seguem as regras da plataforma.
- **Não há fidelidade.** Você cancela quando quiser, e o acesso
  permanece até o fim do período já pago.
- O que está incluído pode mudar com o tempo. Se algo for retirado,
  você será avisado com antecedência.
- Recursos sociais — amizades, mensagens, trocas e o Servidor Astral —
  **não dependem da assinatura** e continuam disponíveis se você
  cancelar.

---

## 5. Convívio

O espaço de convívio existe para pesquisa séria. Ao publicar no fórum
ou trocar correspondências, valem as diretrizes de cada área, que você
aceita antes de usá-las pela primeira vez. Em resumo:

- nada que incentive prática perigosa à saúde física ou mental;
- nada voltado a prejudicar, coagir ou vigiar pessoas específicas;
- respeito entre tradições — debata ideias, não pessoas;
- sem dados pessoais expostos, seus ou de terceiros;
- sem comércio.

Publicações e mensagens que violem essas regras podem ser removidas, e
o acesso ao convívio pode ser suspenso em caso de reincidência.

---

## 6. O que é seu e o que é nosso

**Seu:** tudo que você escreve e cria — diário, servidores astrais,
sigilos forjados, publicações no fórum. A propriedade continua sua. Ao
publicar no fórum, você nos autoriza apenas a exibir aquele conteúdo
dentro do aplicativo, para que outros usuários possam lê-lo.

**Nosso:** os textos das técnicas, as ilustrações, os grimórios, o
Bestiário, as traduções e comentários do Acervo, a identidade visual e
o próprio aplicativo. Nada disso pode ser copiado, redistribuído ou
revendido.

As obras históricas reproduzidas no Acervo estão em domínio público; as
traduções e os comentários são de nossa autoria.

---

## 7. Encerramento

Você pode apagar sua conta a qualquer momento, na tela de perfil. A
exclusão é imediata e irreversível.

Podemos encerrar uma conta que viole gravemente estes termos, e nesse
caso não há devolução do período em curso.

---

## 8. Limites

O aplicativo é oferecido como está. Fazemos o possível para mantê-lo
disponível e íntegro, mas não garantimos funcionamento ininterrupto nem
respondemos por perdas decorrentes de indisponibilidade, falha técnica
ou perda de dados fora do nosso controle.

---

## 9. Mudanças

Estes termos podem mudar. Alterações relevantes serão comunicadas
dentro do aplicativo, e o uso continuado significa concordância com a
nova versão.

---

## 10. Lei aplicável

Aplica-se a lei brasileira. Fica eleito o foro da comarca de Sorocaba,
São Paulo, para dirimir qualquer controvérsia.

---

**Contato:** baltazar.dailyarcane@gmail.com
$doc$);
