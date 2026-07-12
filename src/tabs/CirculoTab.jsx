import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { Card, SectionLabel, GhostButton } from '../components/ui'
import NicknameGate from './circulo/NicknameGate'
import BlockedListView from './circulo/BlockedListView'
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
  const [settingsView, setSettingsView] = useState(null) // null | 'menu' | 'nickname' | 'blocked'

  if (loading || !profile) {
    return <p className="text-faint text-sm text-center py-10">Carregando…</p>
  }

  // Sem nickname, o mago não é encontrável em amizades/trocas — trava as
  // sub-abas sociais até ele escolher um. Também acessível depois via
  // Configurações, para renomear quando quiser.
  if (!profile.nickname) {
    return (
      <>
        <SectionLabel>Círculo Social</SectionLabel>
        <NicknameGate onDone={() => {}} />
      </>
    )
  }

  if (settingsView === 'nickname') {
    return (
      <>
        <SectionLabel>Configurações do Círculo</SectionLabel>
        <NicknameGate onDone={() => setSettingsView('menu')} onCancel={() => setSettingsView('menu')} />
      </>
    )
  }

  if (settingsView === 'blocked') {
    return <BlockedListView onBack={() => setSettingsView('menu')} />
  }

  if (settingsView === 'menu') {
    return (
      <>
        <button
          type="button"
          onClick={() => setSettingsView(null)}
          className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
        >
          ← Círculo
        </button>
        <SectionLabel>Configurações do Círculo</SectionLabel>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm">Nickname</div>
            <div className="text-xs text-muted mt-0.5">{profile.nickname}</div>
          </div>
          <GhostButton onClick={() => setSettingsView('nickname')}>Renomear</GhostButton>
        </Card>

        <Card className="p-0">
          <button
            type="button"
            onClick={() => setSettingsView('blocked')}
            className="w-full flex items-center gap-3 p-4 bg-transparent border-none text-left cursor-pointer"
          >
            <span className="text-sm flex-1">Bloqueados</span>
            <span className="text-faint">›</span>
          </button>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center mb-3">
        <SectionLabel>Círculo Social</SectionLabel>
        <div className="flex-1" />
        <GhostButton onClick={() => setSettingsView('menu')}>⚙ configurações</GhostButton>
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
