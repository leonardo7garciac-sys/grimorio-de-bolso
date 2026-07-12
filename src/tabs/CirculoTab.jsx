import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { SectionLabel, GhostButton } from '../components/ui'
import NicknameGate from './circulo/NicknameGate'
import AmigosView from './circulo/AmigosView'
import TrocasView from './circulo/TrocasView'
import MensagensView from './circulo/MensagensView'

const SUBVIEWS = [
  { id: 'amigos', label: 'Amigos' },
  { id: 'trocas', label: 'Trocas' },
  { id: 'mensagens', label: 'Correspondências' },
]

export default function CirculoTab() {
  const { profile, loading } = useProfile()
  const [sub, setSub] = useState('amigos')
  const [tradeTarget, setTradeTarget] = useState(null)
  const [editingNickname, setEditingNickname] = useState(false)

  if (loading || !profile) {
    return <p className="text-faint text-sm text-center py-10">Carregando…</p>
  }

  // Sem nickname, o mago não é encontrável em amizades/trocas — trava as
  // sub-abas sociais até ele escolher um. Também acessível depois via o
  // atalho de configurações abaixo, para renomear quando quiser.
  if (!profile.nickname || editingNickname) {
    return (
      <>
        <SectionLabel>Círculo Social</SectionLabel>
        <NicknameGate
          onDone={() => setEditingNickname(false)}
          onCancel={profile.nickname ? () => setEditingNickname(false) : undefined}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center mb-3">
        <SectionLabel>Círculo Social</SectionLabel>
        <div className="flex-1" />
        <GhostButton onClick={() => setEditingNickname(true)}>⚙ {profile.nickname}</GhostButton>
      </div>

      <div className="flex gap-1.5 mb-4">
        {SUBVIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSub(v.id)}
            className={`flex-1 text-[11px] px-2 py-1.5 rounded-full border cursor-pointer tracking-wide ${
              sub === v.id ? 'border-gold text-gold' : 'border-white/15 text-muted'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {sub === 'amigos' && (
        <AmigosView
          onProposeTrade={(friendId) => {
            setTradeTarget(friendId)
            setSub('trocas')
          }}
        />
      )}
      {sub === 'trocas' && <TrocasView targetFriendId={tradeTarget} onConsumeTarget={() => setTradeTarget(null)} />}
      {sub === 'mensagens' && <MensagensView />}
    </>
  )
}
