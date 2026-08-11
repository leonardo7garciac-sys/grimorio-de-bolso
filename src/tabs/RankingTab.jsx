import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { Card, SectionLabel } from '../components/ui'

const SET_IDENTITY_MESSAGE = {
  nickname_em_uso: 'Esse nickname já está em uso.',
  nickname_invalido: 'Nickname inválido: use 3–24 letras, números, espaço ou hífen.',
}

const POSITION_GLYPH = ['Ⅰ', 'Ⅱ', 'Ⅲ']

export default function RankingTab() {
  const { profile, refresh: refreshProfile } = useProfile()

  const [ranking, setRanking] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const hasNickname = Boolean(profile?.nickname)
  const isOptedIn = Boolean(profile?.nickname && profile?.show_in_ranking)

  async function loadRanking() {
    const { data, error } = await supabase.rpc('get_ranking_da_lua')
    if (error) setError(error.message)
    else {
      setError('')
      setRanking(data ?? [])
    }
  }

  useEffect(() => {
    loadRanking()
  }, [])

  // O nickname em si é definido na aba Social (é livre, não premium) — aqui
  // só cuidamos do opt-in de aparecer no ranking, já com o nickname pronto.
  async function toggleShow(nextShow) {
    setSaveError('')
    setSaving(true)
    const { data, error } = await supabase.rpc('set_ranking_identity', {
      p_nickname: profile.nickname,
      p_show: nextShow,
    })
    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    if (data !== 'ok') {
      setSaveError(SET_IDENTITY_MESSAGE[data] ?? data)
      return
    }
    await Promise.all([refreshProfile(), loadRanking()])
  }

  const groups = useMemo(() => {
    const map = new Map()
    for (const row of ranking ?? []) {
      if (!map.has(row.title_id)) {
        map.set(row.title_id, { title_id: row.title_id, title_name: row.title_name, title_glyph: row.title_glyph, rows: [] })
      }
      map.get(row.title_id).rows.push(row)
    }
    return Array.from(map.values())
  }, [ranking])

  return (
    <>
      <SectionLabel>Ranking da Lua 🌒</SectionLabel>

      {!hasNickname ? (
        <p className="text-xs text-faint text-center py-4 leading-relaxed">
          Define teu nickname na aba Social antes de aparecer no ranking.
        </p>
      ) : (
        <Card className="p-4 mb-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm">Aparecer no ranking</div>
            <div className="text-[11px] text-muted mt-0.5">Exibido como {profile.nickname}</div>
          </div>
          <input
            type="checkbox"
            checked={Boolean(profile.show_in_ranking)}
            disabled={saving}
            onChange={(e) => toggleShow(e.target.checked)}
          />
        </Card>
      )}
      {saveError && <p className="text-xs text-red text-center mb-3">{saveError}</p>}

      {error && <p className="text-red text-sm text-center py-6">{error}</p>}

      {!error && ranking === null && <p className="text-faint text-sm text-center py-10">Carregando…</p>}

      {!error && ranking !== null && hasNickname && !isOptedIn && (
        <p className="text-xs text-faint text-center py-4 leading-relaxed">
          Ativa "aparecer no ranking" acima para entrar na disputa da tua liga.
        </p>
      )}

      {!error &&
        ranking !== null &&
        groups.map((g) => (
          <div key={g.title_id} className="mb-5">
            <div className="text-xs text-muted tracking-wide uppercase mb-2">
              {g.title_glyph} Liga {g.title_name}
            </div>
            {g.rows.map((r) => {
              const isMe = isOptedIn && r.nickname === profile.nickname
              return (
                <div
                  key={r.nickname}
                  className={`flex items-center gap-3.5 px-4 py-3 mb-2 rounded-lg border ${
                    isMe ? 'border-gold bg-gold/10' : 'border-white/10 bg-white/[.02]'
                  }`}
                >
                  <span
                    className={`w-7 text-center ${r.posicao <= 3 ? 'text-lg' : 'text-sm'}`}
                    style={{ color: r.posicao === 1 ? 'var(--color-gold-light)' : r.posicao <= 3 ? 'var(--color-gold)' : 'var(--color-faint)' }}
                  >
                    {r.posicao <= 3 ? POSITION_GLYPH[r.posicao - 1] : r.posicao}
                  </span>
                  <span className="flex-1 text-[15px]">
                    {r.nickname}
                    {isMe && ' (você)'}
                  </span>
                  <span className="text-[13px] text-muted">{r.xp_lua} XP</span>
                </div>
              )
            })}
          </div>
        ))}

      {!error && ranking !== null && ranking.length === 0 && (
        <p className="text-faint text-sm text-center py-10">
          Ninguém rankeado ainda nesta lua. Sê o primeiro a aparecer.
        </p>
      )}

      <p className="text-[11px] text-faint text-center mt-2 leading-relaxed">
        O placar renova a cada lua. Práticas pessoais e itens do Tesouro não influenciam o ranking.
      </p>
    </>
  )
}
