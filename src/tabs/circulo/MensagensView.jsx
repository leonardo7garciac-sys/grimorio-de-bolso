import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { Card, SectionLabel, GoldButton, GhostButton } from '../../components/ui'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Estado de elegibilidade para enviar mensagens, na ordem em que
// can_send_dm() do banco avalia as condições (amizade já é garantida
// pelo próprio fluxo de navegação — só se abre thread com amigo).
function eligibilityState(eligibility, paying) {
  if (!eligibility) return 'loading'
  if (eligibility.suspendedUntil) return 'suspended'
  if (!paying) return 'not_paying'
  if (eligibility.guideline && !eligibility.accepted) return 'guidelines'
  return 'ok'
}

export default function MensagensView() {
  const { user } = useAuth()
  const { paying } = useProfile()

  const [threads, setThreads] = useState(null)
  const [error, setError] = useState('')
  const [openThread, setOpenThread] = useState(null)
  const [messages, setMessages] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const [eligibility, setEligibility] = useState(null)
  const [accepting, setAccepting] = useState(false)

  const [pickingFriend, setPickingFriend] = useState(false)
  const [friendOptions, setFriendOptions] = useState(null)

  async function loadThreads() {
    const { data, error } = await supabase.rpc('my_dm_threads')
    if (error) {
      setError(error.message)
      return
    }
    setError('')
    setThreads(data ?? [])
  }

  useEffect(() => {
    loadThreads()
  }, [])

  async function loadEligibility() {
    setEligibility(null)
    const [{ data: suspendedUntil }, { data: guideline }] = await Promise.all([
      supabase.rpc('my_messaging_suspension'),
      supabase.from('forum_guidelines').select('*').order('version', { ascending: false }).limit(1).maybeSingle(),
    ])
    let accepted = false
    if (guideline) {
      const { data: acc } = await supabase
        .from('guideline_acceptances')
        .select('version')
        .eq('version', guideline.version)
      accepted = (acc ?? []).length > 0
    }
    setEligibility({ suspendedUntil, guideline, accepted })
  }

  async function loadMessages(friendId) {
    const { data, error } = await supabase
      .from('dm_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`
      )
      .order('created_at')
    if (error) {
      setError(error.message)
      return
    }
    setMessages(data ?? [])
  }

  async function openFriend(friendId, friendNickname) {
    setOpenThread({ friend_id: friendId, friend_nickname: friendNickname })
    setMessages(null)
    setPickingFriend(false)
    await Promise.all([loadEligibility(), loadMessages(friendId)])

    await supabase
      .from('dm_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('sender_id', friendId)
      .is('read_at', null)
    await loadThreads()
  }

  async function openPicker() {
    setPickingFriend(true)
    const { data } = await supabase.rpc('my_friendships')
    setFriendOptions((data ?? []).filter((f) => f.status === 'aceita'))
  }

  async function send() {
    const body = draft.trim()
    if (!body || !openThread) return
    setSending(true)
    const { error } = await supabase
      .from('dm_messages')
      .insert({ sender_id: user.id, recipient_id: openThread.friend_id, body })
    setSending(false)
    if (error) {
      alert(error.message)
      return
    }
    setDraft('')
    await loadMessages(openThread.friend_id)
    await loadThreads()
  }

  async function acceptGuidelines() {
    if (!eligibility?.guideline) return
    setAccepting(true)
    const { error } = await supabase
      .from('guideline_acceptances')
      .insert({ user_id: user.id, version: eligibility.guideline.version })
    setAccepting(false)
    if (error) {
      alert(error.message)
      return
    }
    setEligibility((prev) => ({ ...prev, accepted: true }))
  }

  async function blockFriend() {
    const ok = window.confirm(
      `Bloquear ${openThread.friend_nickname}? A amizade será desfeita e ele não poderá te adicionar, propor trocas ou enviar mensagens. Ele não será notificado.`
    )
    if (!ok) return
    const { data, error } = await supabase.rpc('block_user', { p_nickname: openThread.friend_nickname })
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok') {
      alert(data)
      return
    }
    setOpenThread(null)
    await loadThreads()
  }

  async function reportMessage(messageId) {
    const reason = window.prompt('Motivo da denúncia:')
    if (!reason || !reason.trim()) return
    const { error } = await supabase
      .from('dm_reports')
      .insert({ reporter_id: user.id, message_id: messageId, reason: reason.trim() })
    if (error) alert(error.message)
    else alert('Denúncia enviada ao Conselho.')
  }

  if (error) return <p className="text-red text-sm text-center py-10">{error}</p>

  // ── thread aberta ──
  if (openThread) {
    const state = eligibilityState(eligibility, paying)
    return (
      <>
        <button
          type="button"
          onClick={() => setOpenThread(null)}
          className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
        >
          ← Correspondências
        </button>
        <div className="flex items-center">
          <SectionLabel>{openThread.friend_nickname}</SectionLabel>
          <div className="flex-1" />
          <button
            type="button"
            onClick={blockFriend}
            className="bg-transparent border-none text-red text-[11px] cursor-pointer"
          >
            bloquear
          </button>
        </div>

        {messages === null ? (
          <p className="text-faint text-sm text-center py-8">Carregando…</p>
        ) : messages.length === 0 ? (
          <p className="text-faint text-xs text-center py-6">Nenhuma mensagem ainda. Escreve a primeira.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user.id
            return (
              <div key={m.id} className={`mb-2.5 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 ${
                    mine ? 'bg-gold/15 border border-gold/30' : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-faint">{formatDate(m.created_at)}</span>
                    {!mine && (
                      <button
                        type="button"
                        onClick={() => reportMessage(m.id)}
                        className="bg-transparent border-none text-faint text-[10px] cursor-pointer"
                      >
                        denunciar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {state === 'loading' && <p className="text-faint text-xs text-center py-3">Verificando permissão de envio…</p>}

        {state === 'suspended' && (
          <p className="text-xs text-red text-center py-3">
            Estás suspenso de enviar mensagens até {formatDate(eligibility.suspendedUntil)}.
          </p>
        )}

        {state === 'not_paying' && (
          <p className="text-xs text-red text-center py-3">Enviar mensagens exige um passe do Círculo ativo.</p>
        )}

        {state === 'guidelines' && (
          <Card className="p-4 mt-3">
            <div className="text-sm mb-2">Diretrizes do Círculo</div>
            <div className="text-xs text-muted leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
              {eligibility.guideline.body}
            </div>
            <div className="mt-3">
              <GoldButton small disabled={accepting} onClick={acceptGuidelines}>
                {accepting ? 'Aceitando…' : 'Aceito as diretrizes'}
              </GoldButton>
            </div>
          </Card>
        )}

        {state === 'ok' && (
          <div className="flex gap-2 mt-3 sticky bottom-0 bg-navy-deep pt-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escreve uma mensagem…"
              rows={2}
              className="flex-1 min-w-0 box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 resize-none placeholder:text-faint focus:outline-none focus:border-gold"
            />
            <GoldButton small disabled={sending || !draft.trim()} onClick={send}>
              {sending ? '…' : 'Enviar'}
            </GoldButton>
          </div>
        )}
      </>
    )
  }

  // ── escolher amigo para nova conversa ──
  if (pickingFriend) {
    return (
      <>
        <button
          type="button"
          onClick={() => setPickingFriend(false)}
          className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
        >
          ← Correspondências
        </button>
        <SectionLabel>Nova conversa</SectionLabel>
        {friendOptions === null ? (
          <p className="text-faint text-sm text-center py-8">Carregando amigos…</p>
        ) : friendOptions.length === 0 ? (
          <p className="text-[13px] text-faint text-center py-8">
            Adiciona amigos na aba Amigos para poder conversar.
          </p>
        ) : (
          friendOptions.map((f) => (
            <Card key={f.friendship_id} className="p-3.5">
              <button
                type="button"
                onClick={() => openFriend(f.friend_id, f.friend_nickname)}
                className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-3"
              >
                <span className="text-lg">{f.friend_glyph}</span>
                <span className="text-sm">{f.friend_nickname}</span>
              </button>
            </Card>
          ))
        )}
      </>
    )
  }

  // ── lista de conversas ──
  if (threads === null) return <p className="text-faint text-sm text-center py-10">Carregando conversas…</p>

  return (
    <>
      <div className="flex items-center">
        <SectionLabel>Correspondências</SectionLabel>
        <div className="flex-1" />
        <GhostButton onClick={openPicker}>+ Nova conversa</GhostButton>
      </div>
      {threads.length === 0 ? (
        <p className="text-[13px] text-faint text-center py-9 px-5 leading-relaxed">Nenhuma conversa ainda.</p>
      ) : (
        threads.map((t) => (
          <Card key={t.friend_id} className="p-3.5">
            <button
              type="button"
              onClick={() => openFriend(t.friend_id, t.friend_nickname)}
              className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm">{t.friend_nickname}</div>
                <div className="text-[12px] text-muted truncate mt-0.5">{t.last_body}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-faint">{formatDate(t.last_at)}</span>
                {t.unread_count > 0 && (
                  <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-red text-navy-deep text-[10px] leading-[16px] text-center font-bold">
                    {t.unread_count}
                  </span>
                )}
              </div>
            </button>
          </Card>
        ))
      )}
    </>
  )
}
