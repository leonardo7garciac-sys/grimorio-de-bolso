import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { SectionLabel, GoldButton } from '../components/ui'

const SET_IDENTITY_MESSAGE = {
  nickname_em_uso: 'Esse nickname já está em uso.',
  nickname_invalido: 'Nickname inválido: use 3–24 letras, números, espaço ou hífen.',
}

const POSITION_GLYPH = ['Ⅰ', 'Ⅱ', 'Ⅲ']

export default function RankingTab() {
  const { profile, refresh: refreshProfile } = useProfile()

  const [ranking, setRanking] = useState(null)
  const [error, setError] = useState('')

  const isOptedIn = Boolean(profile?.nickname && profile?.show_in_ranking)
  const [editing, setEditing] = useState(!isOptedIn)
  const [nickDraft, setNickDraft] = useState(profile?.nickname ?? '')
  const [showDraft, setShowDraft] = useState(profile?.show_in_ranking ?? false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

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

  async function saveIdentity(e) {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    const { data, error } = await supabase.rpc('set_ranking_identity', {
      p_nickname: nickDraft.trim(),
      p_show: showDraft,
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
    setEditing(false)
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
      <div className="flex items-center">
        <SectionLabel>Ranking da Lua 🌒</SectionLabel>
        <div className="flex-1" />
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setNickDraft(profile?.nickname ?? '')
              setShowDraft(profile?.show_in_ranking ?? false)
              setEditing(true)
            }}
            className="text-xs text-faint underline bg-transparent border-none cursor-pointer"
          >
            editar identidade
          </button>
        )}
      </div>

      {editing && (
        <form
          onSubmit={saveIdentity}
          className="border border-gold/20 rounded-xl bg-white/[.02] p-4 mb-4"
        >
          <label className="block text-[11px] tracking-wide uppercase text-muted mb-1.5">
            Nickname exibido no ranking
          </label>
          <input
            value={nickDraft}
            onChange={(e) => setNickDraft(e.target.value)}
            placeholder="ex.: Corvo de Saturno"
            className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-3 placeholder:text-faint focus:outline-none focus:border-gold"
          />
          <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showDraft}
              onChange={(e) => setShowDraft(e.target.checked)}
            />
            Aparecer no ranking
          </label>
          {saveError && <p className="text-xs text-red mb-2">{saveError}</p>}
          <div className="flex items-center gap-3">
            <GoldButton small type="submit" disabled={saving || nickDraft.trim().length < 3}>
              {saving ? 'Salvando…' : 'Salvar'}
            </GoldButton>
            {isOptedIn && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs text-faint bg-transparent border-none cursor-pointer"
              >
                cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {error && <p className="text-red text-sm text-center py-6">{error}</p>}

      {!error && ranking === null && <p className="text-faint text-sm text-center py-10">Carregando…</p>}

      {!error && ranking !== null && !isOptedIn && (
        <p className="text-xs text-faint text-center py-4 leading-relaxed">
          Defina um nickname e ative "aparecer no ranking" para entrar na disputa da tua liga.
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
