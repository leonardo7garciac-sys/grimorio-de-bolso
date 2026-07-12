import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { Card, SectionLabel, GoldButton } from '../../components/ui'

const PROPOSE_MESSAGE = {
  nickname_nao_encontrado: 'Nickname não encontrado.',
  apenas_entre_amigos: 'Só podes propor trocas com amigos.',
  voce_nao_possui_o_item: 'Já não possuis mais este item.',
  amigo_ja_possui_o_item: 'Teu amigo já possui este item.',
  amigo_nao_possui_o_item_pedido: 'Teu amigo não possui o item pedido.',
  voce_ja_possui_o_item_pedido: 'Já possuis o item que estás pedindo.',
}
const RESPOND_MESSAGE = {
  proposta_nao_encontrada: 'Proposta não encontrada.',
  proposta_invalida: 'A proposta não é mais válida — as posses mudaram desde então.',
}
const CANCEL_MESSAGE = { nao_encontrada: 'Proposta não encontrada.' }

export default function TrocasView({ targetFriendId, onConsumeTarget }) {
  const { user } = useAuth()
  const { refresh: refreshProfile } = useProfile()

  const [myItems, setMyItems] = useState(null)
  const [catalog, setCatalog] = useState(null)
  const [trades, setTrades] = useState(null)
  const [friends, setFriends] = useState(null)
  const [friendNicknameById, setFriendNicknameById] = useState({})
  const [error, setError] = useState('')

  const [toFriendId, setToFriendId] = useState('')
  const [offeredId, setOfferedId] = useState('')
  const [requestedId, setRequestedId] = useState('')
  const [proposing, setProposing] = useState(false)
  const [proposeMessage, setProposeMessage] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (targetFriendId) {
      setToFriendId(targetFriendId)
      onConsumeTarget?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetFriendId])

  async function load() {
    const [
      { data: mine, error: mineErr },
      { data: cat, error: catErr },
      { data: tr, error: trErr },
      { data: friendRows, error: friendsErr },
    ] = await Promise.all([
      supabase.from('user_items').select('item_id, shop_items(*)'),
      supabase.from('shop_items').select('id, name, kind').eq('is_active', true).order('sort_order'),
      supabase
        .from('item_trades')
        .select(
          '*, offered_item:shop_items!item_trades_offered_item_id_fkey(*), requested_item:shop_items!item_trades_requested_item_id_fkey(*)'
        )
        .order('created_at', { ascending: false }),
      supabase.rpc('my_friendships'),
    ])
    if (mineErr || catErr || trErr || friendsErr) {
      setError((mineErr ?? catErr ?? trErr ?? friendsErr).message)
      return
    }
    setError('')
    setMyItems(mine ?? [])
    setCatalog(cat ?? [])
    setTrades(tr ?? [])
    const accepted = (friendRows ?? []).filter((f) => f.status === 'aceita')
    setFriends(accepted)
    setFriendNicknameById(Object.fromEntries(accepted.map((f) => [f.friend_id, f.friend_nickname])))
  }

  useEffect(() => {
    load()
  }, [])

  function nicknameFor(id) {
    return friendNicknameById[id] ?? 'mago desconhecido'
  }

  async function propose() {
    const nick = friendNicknameById[toFriendId]
    if (!nick || !offeredId) return
    setProposing(true)
    setProposeMessage('')
    const { data, error } = await supabase.rpc('propose_trade', {
      p_to_nickname: nick,
      p_offered: offeredId,
      p_requested: requestedId || null,
    })
    setProposing(false)
    if (error) {
      setProposeMessage(error.message)
      return
    }
    if (data !== 'ok') {
      setProposeMessage(PROPOSE_MESSAGE[data] ?? data)
      return
    }
    setToFriendId('')
    setOfferedId('')
    setRequestedId('')
    setProposeMessage('Proposta enviada.')
    await load()
  }

  async function respond(trade, accept) {
    setBusyId(trade.id)
    const { data, error } = await supabase.rpc('respond_trade', { p_trade: trade.id, p_accept: accept })
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok' && data !== 'recusada') {
      alert(RESPOND_MESSAGE[data] ?? data)
      await load()
      return
    }
    await Promise.all([load(), refreshProfile()])
  }

  async function cancel(trade) {
    setBusyId(trade.id)
    const { data, error } = await supabase.rpc('cancel_trade', { p_trade: trade.id })
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok') {
      alert(CANCEL_MESSAGE[data] ?? data)
      return
    }
    await load()
  }

  if (error) return <p className="text-red text-sm text-center py-10">{error}</p>
  if (myItems === null || catalog === null || trades === null || friends === null) {
    return <p className="text-faint text-sm text-center py-10">Carregando trocas…</p>
  }

  const received = trades.filter((t) => t.recipient_id === user.id && t.status === 'pendente')
  const sent = trades.filter((t) => t.proposer_id === user.id && t.status === 'pendente')
  const history = trades.filter((t) => t.status !== 'pendente').slice(0, 10)

  return (
    <>
      <SectionLabel>Propor troca ou presente</SectionLabel>
      <Card className="p-4">
        {myItems.length === 0 ? (
          <p className="text-[13px] text-faint">Precisas possuir ao menos um item do Tesouro para propor trocas.</p>
        ) : friends.length === 0 ? (
          <p className="text-[13px] text-faint">Adiciona amigos na aba Amigos para poder propor trocas.</p>
        ) : (
          <>
            <label className="block text-[11px] text-muted mb-1">Amigo</label>
            <select
              value={toFriendId}
              onChange={(e) => setToFriendId(e.target.value)}
              className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-2 focus:outline-none focus:border-gold"
            >
              <option value="">— escolhe um amigo —</option>
              {friends.map((f) => (
                <option key={f.friend_id} value={f.friend_id}>
                  {f.friend_nickname}
                </option>
              ))}
            </select>
            <label className="block text-[11px] text-muted mb-1">Ofereço</label>
            <select
              value={offeredId}
              onChange={(e) => setOfferedId(e.target.value)}
              className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-2 focus:outline-none focus:border-gold"
            >
              <option value="">— escolhe um item teu —</option>
              {myItems.map((it) => (
                <option key={it.item_id} value={it.item_id}>
                  {it.shop_items?.name}
                </option>
              ))}
            </select>
            <label className="block text-[11px] text-muted mb-1">
              Peço em troca (opcional — deixa vazio para presentear)
            </label>
            <select
              value={requestedId}
              onChange={(e) => setRequestedId(e.target.value)}
              className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-3 focus:outline-none focus:border-gold"
            >
              <option value="">— nada, é presente —</option>
              {catalog.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
            {proposeMessage && <p className="text-xs text-faint mb-2">{proposeMessage}</p>}
            <GoldButton small disabled={proposing || !toFriendId || !offeredId} onClick={propose}>
              {proposing ? 'Enviando…' : 'Propor'}
            </GoldButton>
          </>
        )}
      </Card>

      {received.length > 0 && (
        <>
          <SectionLabel>Propostas recebidas</SectionLabel>
          {received.map((t) => (
            <Card key={t.id} className="p-3.5">
              <div className="text-sm">
                <span className="text-gold">{nicknameFor(t.proposer_id)}</span> oferece{' '}
                <strong>{t.offered_item?.name}</strong>
                {t.requested_item ? (
                  <>
                    {' '}
                    em troca de <strong>{t.requested_item.name}</strong>
                  </>
                ) : (
                  ' — de presente'
                )}
              </div>
              <div className="flex gap-2 mt-2.5">
                <GoldButton small disabled={busyId === t.id} onClick={() => respond(t, true)}>
                  Aceitar
                </GoldButton>
                <button
                  type="button"
                  disabled={busyId === t.id}
                  onClick={() => respond(t, false)}
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
          <SectionLabel>Minhas propostas pendentes</SectionLabel>
          {sent.map((t) => (
            <Card key={t.id} className="p-3.5">
              <div className="text-sm">
                Ofereces <strong>{t.offered_item?.name}</strong> a{' '}
                <span className="text-gold">{nicknameFor(t.recipient_id)}</span>
                {t.requested_item ? (
                  <>
                    {' '}
                    pedindo <strong>{t.requested_item.name}</strong>
                  </>
                ) : (
                  ' — de presente'
                )}
              </div>
              <button
                type="button"
                disabled={busyId === t.id}
                onClick={() => cancel(t)}
                className="bg-transparent border-none text-faint text-xs cursor-pointer mt-2"
              >
                cancelar
              </button>
            </Card>
          ))}
        </>
      )}

      {history.length > 0 && (
        <>
          <SectionLabel>Histórico recente</SectionLabel>
          {history.map((t) => (
            <Card key={t.id} className="p-3.5 opacity-70">
              <div className="text-xs text-muted">
                {t.proposer_id === user.id ? 'Tu' : nicknameFor(t.proposer_id)} →{' '}
                {t.recipient_id === user.id ? 'ti' : nicknameFor(t.recipient_id)}: {t.offered_item?.name}
                {t.requested_item ? ` por ${t.requested_item.name}` : ' (presente)'} —{' '}
                <span className="capitalize">{t.status}</span>
              </div>
            </Card>
          ))}
        </>
      )}

      {received.length === 0 && sent.length === 0 && history.length === 0 && (
        <p className="text-[13px] text-faint text-center py-8">Nenhuma troca ainda.</p>
      )}
    </>
  )
}
