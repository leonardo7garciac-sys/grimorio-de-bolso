import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionLabel } from '../../components/ui'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function BlockedListView({ onBack }) {
  const [blocks, setBlocks] = useState(null)
  const [error, setError] = useState('')
  const [busyNickname, setBusyNickname] = useState(null)

  async function load() {
    const { data, error } = await supabase.rpc('my_blocks')
    if (error) {
      setError(error.message)
      return
    }
    setError('')
    setBlocks(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function unblock(nickname) {
    setBusyNickname(nickname)
    const { data, error } = await supabase.rpc('unblock_user', { p_nickname: nickname })
    setBusyNickname(null)
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

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
      >
        ← Configurações
      </button>
      <SectionLabel>Bloqueados</SectionLabel>

      {error ? (
        <p className="text-red text-sm text-center py-10">{error}</p>
      ) : blocks === null ? (
        <p className="text-faint text-sm text-center py-10">Carregando…</p>
      ) : blocks.length === 0 ? (
        <p className="text-[13px] text-faint text-center py-8">Nenhum mago bloqueado.</p>
      ) : (
        blocks.map((b) => (
          <Card key={b.blocked_nickname} className="p-3.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm">{b.blocked_nickname}</div>
              <div className="text-[11px] text-faint">bloqueado em {formatDate(b.blocked_at)}</div>
            </div>
            <button
              type="button"
              disabled={busyNickname === b.blocked_nickname}
              onClick={() => unblock(b.blocked_nickname)}
              className="bg-transparent border-none text-gold text-xs cursor-pointer disabled:opacity-50"
            >
              desbloquear
            </button>
          </Card>
        ))
      )}
    </>
  )
}
