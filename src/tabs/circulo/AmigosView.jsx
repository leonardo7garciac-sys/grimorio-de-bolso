import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionLabel, GoldButton } from '../../components/ui'
import FriendProfileView from './FriendProfileView'

const REQUEST_MESSAGE = {
  nickname_nao_encontrado: 'Nickname não encontrado.',
  nao_pode_adicionar_a_si: 'Não podes adicionar a ti mesmo.',
  ja_existe_relacao: 'Já existe um pedido ou amizade com este mago.',
}

export default function AmigosView({ onProposeTrade }) {
  const [friendships, setFriendships] = useState(null)
  const [error, setError] = useState('')
  const [nickname, setNickname] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMessage, setSendMessage] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [viewingFriend, setViewingFriend] = useState(null)

  async function load() {
    const { data, error } = await supabase.rpc('my_friendships')
    if (error) {
      setError(error.message)
      return
    }
    setError('')
    setFriendships(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function sendRequest() {
    const nick = nickname.trim()
    if (!nick) return
    setSending(true)
    setSendMessage('')
    const { data, error } = await supabase.rpc('send_friend_request', { p_nickname: nick })
    setSending(false)
    if (error) {
      setSendMessage(error.message)
      return
    }
    if (data !== 'ok') {
      setSendMessage(REQUEST_MESSAGE[data] ?? data)
      return
    }
    setNickname('')
    setSendMessage('Pedido enviado.')
    await load()
  }

  async function respond(friendshipId, accept) {
    setBusyId(friendshipId)
    const { data, error } = await supabase.rpc('respond_friend_request', {
      p_request: friendshipId,
      p_accept: accept,
    })
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok') {
      alert(data)
      return
    }
    await load()
  }

  async function remove(friendship) {
    const ok = window.confirm(`Desfazer amizade com ${friendship.friend_nickname}?`)
    if (!ok) return
    setBusyId(friendship.friendship_id)
    const { data, error } = await supabase.rpc('remove_friendship', { p_friendship: friendship.friendship_id })
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok') {
      alert(data)
      return
    }
    await load()
  }

  if (viewingFriend) {
    return (
      <FriendProfileView
        friendId={viewingFriend.friend_id}
        friendNickname={viewingFriend.friend_nickname}
        onBack={() => setViewingFriend(null)}
        onProposeTrade={onProposeTrade}
        onBlocked={async () => {
          setViewingFriend(null)
          await load()
        }}
      />
    )
  }

  if (error) return <p className="text-red text-sm text-center py-10">{error}</p>
  if (friendships === null) return <p className="text-faint text-sm text-center py-10">Carregando amizades…</p>

  const received = friendships.filter((f) => f.status === 'pendente' && !f.i_am_requester)
  const sent = friendships.filter((f) => f.status === 'pendente' && f.i_am_requester)
  const accepted = friendships.filter((f) => f.status === 'aceita')

  return (
    <>
      <SectionLabel>Adicionar por nickname</SectionLabel>
      <Card className="p-4">
        <div className="flex gap-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="nickname do mago"
            className="flex-1 min-w-0 box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 placeholder:text-faint focus:outline-none focus:border-gold"
          />
          <GoldButton small disabled={!nickname.trim() || sending} onClick={sendRequest}>
            {sending ? 'Enviando…' : 'Adicionar'}
          </GoldButton>
        </div>
        {sendMessage && <p className="text-xs text-faint mt-2">{sendMessage}</p>}
      </Card>

      {received.length > 0 && (
        <>
          <SectionLabel>Pedidos recebidos</SectionLabel>
          {received.map((f) => (
            <Card key={f.friendship_id} className="p-3.5 flex items-center gap-3">
              <span className="text-lg">{f.friend_glyph}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{f.friend_nickname}</div>
                <div className="text-[11px] text-muted">{f.friend_title}</div>
              </div>
              <div className="flex gap-1.5">
                <GoldButton small disabled={busyId === f.friendship_id} onClick={() => respond(f.friendship_id, true)}>
                  Aceitar
                </GoldButton>
                <button
                  type="button"
                  disabled={busyId === f.friendship_id}
                  onClick={() => respond(f.friendship_id, false)}
                  className="bg-transparent border-none text-faint text-xs cursor-pointer"
                >
                  recusar
                </button>
              </div>
            </Card>
          ))}
        </>
      )}

      {sent.length > 0 && (
        <>
          <SectionLabel>Pedidos enviados</SectionLabel>
          {sent.map((f) => (
            <Card key={f.friendship_id} className="p-3.5 flex items-center gap-3">
              <span className="text-lg">{f.friend_glyph}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{f.friend_nickname}</div>
                <div className="text-[11px] text-faint">aguardando resposta</div>
              </div>
              <button
                type="button"
                disabled={busyId === f.friendship_id}
                onClick={() => remove(f)}
                className="bg-transparent border-none text-faint text-xs cursor-pointer"
              >
                cancelar
              </button>
            </Card>
          ))}
        </>
      )}

      <SectionLabel>Teus amigos</SectionLabel>
      {accepted.length === 0 ? (
        <p className="text-[13px] text-faint text-center py-8">Ainda não tens amigos no Círculo.</p>
      ) : (
        accepted.map((f) => (
          <Card key={f.friendship_id} className="p-3.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewingFriend({ friend_id: f.friend_id, friend_nickname: f.friend_nickname })}
              className="flex-1 min-w-0 flex items-center gap-3 bg-transparent border-none text-left cursor-pointer p-0"
            >
              <span className="text-lg">{f.friend_glyph}</span>
              <div className="min-w-0">
                <div className="text-sm">{f.friend_nickname}</div>
                <div className="text-[11px] text-muted">{f.friend_title}</div>
              </div>
            </button>
            <button
              type="button"
              disabled={busyId === f.friendship_id}
              onClick={() => remove(f)}
              className="bg-transparent border-none text-faint text-[11px] cursor-pointer"
            >
              desfazer
            </button>
          </Card>
        ))
      )}
    </>
  )
}
