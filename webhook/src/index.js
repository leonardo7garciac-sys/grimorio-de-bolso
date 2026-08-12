// Webhook Hotmart — recebe o postback de compra/assinatura e concede
// ou revoga acesso no Supabase via service_role.
//
// Mapa de eventos (definido em supabase/migrations/007_modelo_hibrido.sql,
// seção "LÓGICA DO WEBHOOK HOTMART" — este arquivo só implementa aquilo):
//   PURCHASE_APPROVED  → concede (grimório = entitlement + 30 dias de
//                         Círculo; Círculo = só estende 30 dias)
//   PURCHASE_REFUNDED,
//   PURCHASE_CHARGEBACK → revoga exatamente o que aquela transação
//                         concedeu
//   qualquer outro evento (ex.: cancelamento de assinatura) → ignorado
//                         de propósito; o passe expira sozinho.
//
// Campos do payload que este código assume (formato padrão dos
// postbacks Hotmart v2 na época em que foi escrito): body.event,
// body.data.product.id, body.data.buyer.email,
// body.data.purchase.transaction. Confira contra um envio real (ou de
// teste) no painel da Hotmart antes de considerar isto validado — não
// tive acesso a um payload real para conferir.
//
// hottok: aceito em dois lugares (formatos diferentes de integração
// da própria Hotmart) — cabeçalho X-HOTMART-HOTTOK ou campo hottok no
// corpo. Basta um dos dois bater com o secret.

const EVENT_APPROVED = 'PURCHASE_APPROVED'
const EVENT_REFUNDED = 'PURCHASE_REFUNDED'
const EVENT_CHARGEBACK = 'PURCHASE_CHARGEBACK'

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return new Response('Bad Request', { status: 400 })
    }

    const headerToken = request.headers.get('X-HOTMART-HOTTOK')
    const bodyToken = body?.hottok
    let hottokFoundIn = null
    if (env.HOTMART_HOTTOK) {
      if (headerToken === env.HOTMART_HOTTOK) hottokFoundIn = 'header'
      else if (bodyToken === env.HOTMART_HOTTOK) hottokFoundIn = 'body'
    }

    // Debug de integração: nomes/valores dos cabeçalhos (com o próprio
    // hottok mascarado) e só as CHAVES do corpo — nunca o valor do
    // hottok recebido nem do secret, nos dois casos.
    console.log('hotmart webhook: postback recebido', {
      headers: maskedHeaders(request.headers),
      bodyKeys: Object.keys(body ?? {}),
      hottokEncontradoEm: hottokFoundIn ?? 'nenhum',
    })

    if (!hottokFoundIn) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Diário de bordo (026_webhook_events.sql): grava o payload cru ANTES
    // de processar, pra falha de processamento deixar de ser invisível —
    // hoje ela só existe no console.error do Cloudflare. Se a própria
    // gravação falhar, só loga: erro aqui não pode virar 4xx/5xx (ver
    // motivo do 200 sempre, logo abaixo).
    let eventId = null
    try {
      eventId = await insertWebhookEvent(
        {
          payload: body,
          event: body?.event,
          transaction: body?.data?.purchase?.transaction,
          email: body?.data?.buyer?.email,
        },
        env
      )
    } catch (err) {
      console.error('hotmart webhook: falha ao gravar webhook_events (payload cru)', {
        message: err?.message,
      })
    }

    // Daqui pra frente sempre 200: erro interno não pode virar retry
    // infinito da Hotmart — pior, falhas repetidas fazem a Hotmart
    // desativar a configuração do webhook inteira. Falhas ficam no log do
    // Worker (mensagem completa) e agora também em webhook_events.error,
    // com processed_at nulo — visível numa consulta, não só no console.
    try {
      await handleEvent(body, env)
      if (eventId) {
        await markWebhookEventProcessed(eventId, env).catch((err) => {
          console.error('hotmart webhook: falha ao marcar webhook_events como processado', {
            message: err?.message,
            eventId,
          })
        })
      }
    } catch (err) {
      console.error('hotmart webhook: falha ao processar', {
        message: err?.message,
        code: err?.code,
        stack: err?.stack,
      })
      if (eventId) {
        await markWebhookEventFailed(eventId, err?.message ?? String(err), env).catch((markErr) => {
          console.error('hotmart webhook: falha ao marcar webhook_events como falho', {
            message: markErr?.message,
            eventId,
          })
        })
      }
    }
    return new Response('OK', { status: 200 })
  },
}

function maskedHeaders(headers) {
  const out = {}
  for (const [key, value] of headers.entries()) {
    out[key] = /hottok/i.test(key) ? '[redacted]' : value
  }
  return out
}

async function handleEvent(body, env) {
  const event = body.event
  const data = body.data ?? {}
  const productId = data.product?.id != null ? String(data.product.id) : null
  const email = data.buyer?.email
  const transaction = data.purchase?.transaction

  console.log('hotmart webhook: evento recebido', { event, productId, email, transaction })

  if (!productId || !email || !transaction) {
    console.error('hotmart webhook: payload incompleto — nenhuma ação', {
      event, productId, email, transaction,
    })
    return
  }

  if (event === EVENT_APPROVED) {
    await handleApproved({ productId, email, transaction, env })
  } else if (event === EVENT_REFUNDED || event === EVENT_CHARGEBACK) {
    await handleRevoke({ productId, email, transaction, env })
  } else {
    console.log('hotmart webhook: evento sem ação prevista (ignorado de propósito)', { event })
  }
}

async function handleApproved({ productId, email, transaction, env }) {
  const isCirculo = productId === env.CIRCULO_PRODUCT_ID
  const grimoire = isCirculo ? null : await findGrimoireByPid(productId, env)

  // Produto que não é o Círculo nem bate com um grimório (ex.: ebook sem
  // técnicas no app) não fica mais sem ação: toda compra aprovada concede
  // ao menos o mês de Círculo — só o entitlement de grimório é condicional.
  console.log('hotmart webhook: produto identificado', {
    productId,
    produto: isCirculo ? 'circulo' : grimoire ? `grimorio:${grimoire.slug}` : 'produto_nao_catalogado',
  })

  const source = isCirculo ? 'assinatura' : 'compra_ebook'
  const userId = await findUserByEmail(email, env)

  if (userId) {
    if (grimoire) {
      await grantEntitlement(userId, grimoire.id, env)
    }
    await grantCirclePass(userId, source, transaction, env)
    console.log('hotmart webhook: ação executada — concedido direto (usuário já existe)', {
      email, userId, transaction,
      acao: grimoire ? 'entitlement + circle_pass' : 'circle_pass',
    })
    return
  }

  // E-mail ainda não tem conta: enfileira para aplicar no cadastro
  // (ver apply_pending_grants / trigger on_auth_user_created).
  if (grimoire) {
    await queuePendingGrant(
      { email, grant_kind: 'entitlement', grimoire_id: grimoire.id, source, ref_id: transaction, days: null },
      env
    )
  }
  await queuePendingGrant(
    { email, grant_kind: 'circle_pass', grimoire_id: null, source, ref_id: transaction, days: 30 },
    env
  )
  console.log('hotmart webhook: ação executada — enfileirado em pending_grants (e-mail sem conta)', {
    email, transaction,
    acao: grimoire ? 'entitlement + circle_pass (pendente)' : 'circle_pass (pendente)',
  })
}

async function handleRevoke({ productId, email, transaction, env }) {
  const isCirculo = productId === env.CIRCULO_PRODUCT_ID
  const grimoire = isCirculo ? null : await findGrimoireByPid(productId, env)
  const userId = await findUserByEmail(email, env)

  console.log('hotmart webhook: produto identificado para revogação', {
    productId,
    produto: isCirculo ? 'circulo' : grimoire ? `grimorio:${grimoire.slug}` : 'desconhecido',
    userEncontrado: Boolean(userId),
  })

  // Cobre o caso "nunca chegou a se cadastrar": cancela a concessão
  // enfileirada antes que ela seja aplicada.
  await deletePendingGrantsByRef(transaction, env)

  if (!userId) {
    console.log('hotmart webhook: ação executada — só limpou pending_grants (usuário não existe)', {
      email, transaction,
    })
    return
  }

  if (grimoire) {
    await deleteEntitlement(userId, grimoire.id, env)
  }
  await deleteCirclePassByRef(userId, transaction, env)
  console.log('hotmart webhook: ação executada — revogado', {
    email, userId, transaction,
    acao: grimoire ? 'entitlement + circle_pass removidos' : 'circle_pass removido',
  })
}

// ── Supabase REST (service_role) ────────────────────────────────────

function restHeaders(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

async function rpc(env, fn, args) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: restHeaders(env),
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    const text = await res.text()
    let code
    try {
      code = JSON.parse(text).code
    } catch {
      // corpo do erro não era JSON — segue sem code
    }
    const err = new Error(`rpc ${fn} falhou: ${res.status} ${text}`)
    err.code = code
    throw err
  }
  return res.status === 204 ? null : res.json()
}

async function insertWebhookEvent({ payload, event, transaction, email }, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/webhook_events`, {
    method: 'POST',
    headers: restHeaders(env, { Prefer: 'return=representation' }),
    body: JSON.stringify({
      event: event ?? null,
      transaction_ref: transaction ?? null,
      buyer_email: email ?? null,
      payload,
    }),
  })
  if (!res.ok) {
    throw new Error(`webhook_events insert falhou: ${res.status} ${await res.text()}`)
  }
  const rows = await res.json()
  return rows[0]?.id ?? null
}

async function markWebhookEventProcessed(id, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/webhook_events?id=eq.${id}`, {
    method: 'PATCH',
    headers: restHeaders(env, { Prefer: 'return=minimal' }),
    body: JSON.stringify({ processed_at: new Date().toISOString() }),
  })
  if (!res.ok) {
    throw new Error(`webhook_events update (processado) falhou: ${res.status} ${await res.text()}`)
  }
}

async function markWebhookEventFailed(id, message, env) {
  // attempts começa em 0 (default da tabela) e esta é a primeira tentativa
  // desta linha nesta mesma invocação -- por isso 1 direto, sem precisar
  // ler o valor atual de volta.
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/webhook_events?id=eq.${id}`, {
    method: 'PATCH',
    headers: restHeaders(env, { Prefer: 'return=minimal' }),
    body: JSON.stringify({ error: message, attempts: 1 }),
  })
  if (!res.ok) {
    throw new Error(`webhook_events update (falha) falhou: ${res.status} ${await res.text()}`)
  }
}

async function findUserByEmail(email, env) {
  const result = await rpc(env, 'find_user_by_email', { p_email: email })
  return result || null
}

async function findGrimoireByPid(pid, env) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/grimoires?hotmart_pid=eq.${encodeURIComponent(pid)}&select=id,slug`,
    { headers: restHeaders(env) }
  )
  if (!res.ok) {
    throw new Error(`grimoires lookup falhou: ${res.status} ${await res.text()}`)
  }
  const rows = await res.json()
  return rows[0] ?? null
}

async function grantEntitlement(userId, grimoireId, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/entitlements`, {
    method: 'POST',
    headers: restHeaders(env, { Prefer: 'resolution=ignore-duplicates,return=minimal' }),
    body: JSON.stringify({ user_id: userId, grimoire_id: grimoireId, source: 'hotmart' }),
  })
  if (!res.ok) {
    throw new Error(`entitlement insert falhou: ${res.status} ${await res.text()}`)
  }
}

async function deleteEntitlement(userId, grimoireId, env) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/entitlements?user_id=eq.${userId}&grimoire_id=eq.${grimoireId}`,
    { method: 'DELETE', headers: restHeaders(env, { Prefer: 'return=minimal' }) }
  )
  if (!res.ok) {
    throw new Error(`entitlement delete falhou: ${res.status} ${await res.text()}`)
  }
}

async function circlePassExists(ref, env) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/circle_passes?ref_id=eq.${encodeURIComponent(ref)}&select=id&limit=1`,
    { headers: restHeaders(env) }
  )
  if (!res.ok) {
    throw new Error(`circle_passes lookup falhou: ${res.status} ${await res.text()}`)
  }
  const rows = await res.json()
  return rows.length > 0
}

async function grantCirclePass(userId, source, ref, env) {
  // Checagem prévia evita a maioria das reentregas sem nem chamar a
  // função. Quem garante idempotência de verdade contra uma corrida é
  // o índice único em circle_passes.ref_id (018) — por isso, se ainda
  // assim a chamada colidir (23505 = unique_violation), tratamos como
  // sucesso: a transação já foi concedida, é exatamente o resultado
  // que queríamos.
  if (await circlePassExists(ref, env)) return
  try {
    await rpc(env, 'grant_circle_pass', { p_user: userId, p_source: source, p_ref: ref, p_days: 30 })
  } catch (err) {
    if (err.code === '23505') return
    throw err
  }
}

async function deleteCirclePassByRef(userId, ref, env) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/circle_passes?user_id=eq.${userId}&ref_id=eq.${encodeURIComponent(ref)}`,
    { method: 'DELETE', headers: restHeaders(env, { Prefer: 'return=minimal' }) }
  )
  if (!res.ok) {
    throw new Error(`circle_passes delete falhou: ${res.status} ${await res.text()}`)
  }
}

async function pendingGrantExists({ ref_id, grant_kind, grimoire_id }, env) {
  const params = new URLSearchParams({
    ref_id: `eq.${ref_id}`,
    grant_kind: `eq.${grant_kind}`,
    select: 'id',
    limit: '1',
  })
  params.set('grimoire_id', grimoire_id ? `eq.${grimoire_id}` : 'is.null')
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/pending_grants?${params}`, {
    headers: restHeaders(env),
  })
  if (!res.ok) {
    throw new Error(`pending_grants lookup falhou: ${res.status} ${await res.text()}`)
  }
  const rows = await res.json()
  return rows.length > 0
}

async function queuePendingGrant(row, env) {
  if (await pendingGrantExists(row, env)) return
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/pending_grants`, {
    method: 'POST',
    headers: restHeaders(env, { Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
  })
  if (!res.ok) {
    throw new Error(`pending_grants insert falhou: ${res.status} ${await res.text()}`)
  }
}

async function deletePendingGrantsByRef(ref, env) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/pending_grants?ref_id=eq.${encodeURIComponent(ref)}&applied_at=is.null`,
    { method: 'DELETE', headers: restHeaders(env, { Prefer: 'return=minimal' }) }
  )
  if (!res.ok) {
    throw new Error(`pending_grants delete falhou: ${res.status} ${await res.text()}`)
  }
}
