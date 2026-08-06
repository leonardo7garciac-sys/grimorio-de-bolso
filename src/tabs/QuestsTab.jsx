import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { periodKey } from '../lib/periodKey'
import { CIRCULO_CHECKOUT_URL } from '../lib/links'
import { Card, SectionLabel, GoldButton } from '../components/ui'

const STATE_LABEL = {
  pendente: { label: 'Aguardando o Conselho', className: 'text-gold' },
  aprovada: { label: 'Aprovada ✦', className: 'text-green' },
  rejeitada: { label: 'Rejeitada — tente no próximo ciclo', className: 'text-red' },
}

export default function QuestsTab() {
  const { user } = useAuth()
  const { paying, refresh: refreshProfile } = useProfile()

  const [quests, setQuests] = useState(null)
  const [error, setError] = useState('')
  const [reviewNotes, setReviewNotes] = useState({})
  const [proofFor, setProofFor] = useState(null)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function loadQuests() {
    const { data, error } = await supabase.rpc('my_quests_today')
    if (error) {
      setError(error.message)
      return
    }
    setError('')
    const list = data ?? []
    setQuests(list)

    const rejected = list.filter((q) => q.submission_status === 'rejeitada')
    if (rejected.length > 0) {
      const entries = await Promise.all(
        rejected.map(async (q) => {
          const { data: sub } = await supabase
            .from('quest_submissions')
            .select('review_note')
            .eq('user_id', user.id)
            .eq('quest_id', q.quest_id)
            .eq('period_key', periodKey(q.frequency))
            .maybeSingle()
          return [q.quest_id, sub?.review_note ?? null]
        })
      )
      setReviewNotes(Object.fromEntries(entries))
    }
  }

  useEffect(() => {
    loadQuests()
  }, [])

  async function submit(quest, extra) {
    setBusyId(quest.quest_id)
    const { error } = await supabase.from('quest_submissions').insert({
      user_id: user.id,
      quest_id: quest.quest_id,
      period_key: periodKey(quest.frequency),
      ...extra,
    })
    setBusyId(null)
    if (error) {
      alert(error.hint || error.message)
      return
    }
    setProofFor(null)
    setText('')
    setFile(null)
    await Promise.all([loadQuests(), refreshProfile()])
  }

  async function submitFoto(quest) {
    if (!file) return
    setBusyId(quest.quest_id)
    const path = `${user.id}/${quest.slug}-${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage.from('provas').upload(path, file)
    if (upErr) {
      setBusyId(null)
      alert(upErr.message)
      return
    }
    setBusyId(null)
    await submit(quest, { proof_path: path })
  }

  if (error) return <p className="text-red text-sm text-center py-10">{error}</p>
  if (quests === null) return <p className="text-faint text-sm text-center py-10">Carregando…</p>

  return (
    <>
      <SectionLabel>Tarefas do ciclo</SectionLabel>
      {quests.map((q) => {
        const state = STATE_LABEL[q.submission_status]
        const open = proofFor === q.quest_id
        const busy = busyId === q.quest_id
        return (
          <Card key={q.quest_id} className="p-4">
            <div className="flex gap-2 items-center mb-1">
              <span
                className={`text-[9px] tracking-wide uppercase border rounded-full px-2 py-0.5 ${
                  q.frequency === 'semanal' ? 'text-purple border-purple' : 'text-muted border-white/15'
                }`}
              >
                {q.frequency}
              </span>
              <span className="text-xs text-gold">+{q.coin_reward} ✦</span>
            </div>
            <div className="text-base">{q.title}</div>
            {q.description && <div className="text-[13px] text-muted leading-relaxed mt-1">{q.description}</div>}

            {state ? (
              <div className={`text-xs mt-2.5 tracking-wide ${state.className}`}>
                {state.label}
                {q.submission_status === 'rejeitada' && reviewNotes[q.quest_id] && (
                  <div className="text-[11px] text-faint mt-1 normal-case tracking-normal">
                    “{reviewNotes[q.quest_id]}”
                  </div>
                )}
              </div>
            ) : q.is_premium && !paying ? (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-faint">🗝 Exclusiva do Círculo</span>
                <a
                  href={CIRCULO_CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold underline"
                >
                  assinar o Círculo
                </a>
              </div>
            ) : open ? (
              <div className="mt-3">
                {q.proof_type === 'relato' && (
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Descreve tua experiência com detalhes…"
                    rows={3}
                    className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 resize-y placeholder:text-faint focus:outline-none focus:border-gold"
                  />
                )}
                {q.proof_type === 'foto' && (
                  <label className="block border border-dashed border-gold/40 rounded-lg py-5 px-3 text-center text-muted text-sm cursor-pointer">
                    {file ? file.name : '📷 Toca para enviar a foto do sigilo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                <div className="flex gap-2 mt-2.5">
                  <GoldButton
                    small
                    disabled={
                      busy ||
                      (q.proof_type === 'relato' && !text.trim()) ||
                      (q.proof_type === 'foto' && !file)
                    }
                    onClick={() =>
                      q.proof_type === 'foto' ? submitFoto(q) : submit(q, { proof_text: text.trim() })
                    }
                  >
                    {busy ? 'Enviando…' : 'Enviar ao Conselho'}
                  </GoldButton>
                  <button
                    type="button"
                    onClick={() => {
                      setProofFor(null)
                      setText('')
                      setFile(null)
                    }}
                    className="bg-transparent border-none text-faint text-xs cursor-pointer"
                  >
                    cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2.5">
                <GoldButton
                  small
                  disabled={busy}
                  onClick={() => (q.proof_type === 'nenhuma' ? submit(q) : setProofFor(q.quest_id))}
                >
                  {busy
                    ? 'Enviando…'
                    : q.proof_type === 'nenhuma'
                      ? 'Concluir'
                      : q.proof_type === 'foto'
                        ? 'Enviar foto'
                        : 'Escrever relato'}
                </GoldButton>
              </div>
            )}
          </Card>
        )
      })}
      {quests.length === 0 && (
        <p className="text-faint text-sm text-center py-10">Nenhuma quest disponível no momento.</p>
      )}
      <p className="text-[11px] text-faint text-center mt-4 leading-relaxed">
        Tarefas com prova passam pelo Conselho antes das moedas caírem.
        <br />
        Diárias renovam à meia-noite; semanais, a cada segunda.
      </p>
    </>
  )
}
