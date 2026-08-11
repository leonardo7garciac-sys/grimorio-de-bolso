import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { Card, GoldButton } from '../../components/ui'

const SET_IDENTITY_MESSAGE = {
  nickname_em_uso: 'Esse nickname já está em uso.',
  nickname_invalido: 'Nickname inválido: use 3–24 letras, números, espaço ou hífen.',
}

// set_ranking_identity() grava nickname + show_in_ranking juntos — por isso
// preservamos o show_in_ranking atual do perfil em vez de sobrescrevê-lo,
// já que esta tela só existe para definir/renomear o nickname em si.
export default function NicknameGate({ onDone, onCancel }) {
  const { profile, refresh: refreshProfile } = useProfile()
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const { data, error } = await supabase.rpc('set_ranking_identity', {
      p_nickname: nickname.trim(),
      p_show: profile?.show_in_ranking ?? false,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data !== 'ok') {
      setError(SET_IDENTITY_MESSAGE[data] ?? data)
      return
    }
    await refreshProfile()
    onDone?.()
  }

  return (
    <Card className="p-4">
      <div className="text-base mb-1.5">Escolhe teu nome de mago</div>
      <p className="text-[13px] text-muted leading-relaxed mb-3">
        Este nickname é a tua identidade pública no Social — é assim que amigos, trocas, correspondências e o
        ranking te reconhecem. Teu e-mail e nome real nunca são exibidos a outros usuários.
      </p>
      <form onSubmit={save}>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="ex.: Corvo de Saturno"
          className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-3 placeholder:text-faint focus:outline-none focus:border-gold"
        />
        {error && <p className="text-xs text-red mb-2">{error}</p>}
        <div className="flex items-center gap-3">
          <GoldButton small type="submit" disabled={saving || nickname.trim().length < 3}>
            {saving ? 'Salvando…' : 'Confirmar'}
          </GoldButton>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-faint bg-transparent border-none cursor-pointer"
            >
              cancelar
            </button>
          )}
        </div>
      </form>
    </Card>
  )
}
