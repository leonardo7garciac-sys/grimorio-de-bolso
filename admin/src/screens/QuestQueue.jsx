import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../lib/supabaseAdmin'

export default function QuestQueue() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [signedUrls, setSignedUrls] = useState({})
  const [notes, setNotes] = useState({})
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setRows(null)
    setError('')

    const { data, error } = await supabaseAdmin
      .from('quest_submissions')
      .select(
        'id, user_id, quest_id, period_key, proof_text, proof_path, created_at, quests(title, proof_type, coin_reward)'
      )
      .eq('status', 'pendente')
      .order('created_at', { ascending: true })
    if (error) {
      setError(error.message)
      return
    }

    const userIds = [...new Set(data.map((r) => r.user_id))]
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, nickname')
      .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])
    const profileById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

    setRows(data.map((r) => ({ ...r, profile: profileById[r.user_id] })))

    const photoRows = data.filter((r) => r.proof_path)
    const entries = await Promise.all(
      photoRows.map(async (r) => {
        const { data: signed } = await supabaseAdmin.storage
          .from('provas')
          .createSignedUrl(r.proof_path, 3600)
        return [r.id, signed?.signedUrl ?? null]
      })
    )
    setSignedUrls(Object.fromEntries(entries))
  }

  useEffect(() => {
    load()
  }, [])

  async function review(id, status) {
    setBusyId(id)
    const { error } = await supabaseAdmin
      .from('quest_submissions')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        review_note: notes[id]?.trim() || null,
      })
      .eq('id', id)
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  if (error) return <p className="error">{error}</p>
  if (rows === null) return <p className="muted">Carregando fila…</p>
  if (rows.length === 0) return <p className="muted">Nenhuma submissão pendente.</p>

  return (
    <div className="stack">
      {rows.map((r) => (
        <div key={r.id} className="card">
          <div className="card-head">
            <strong>{r.quests?.title ?? '(quest removida)'}</strong>
            <span className="muted small">
              {' '}
              · {r.profile?.nickname || r.profile?.display_name || r.user_id} · {r.quests?.coin_reward ?? '?'} moedas
            </span>
          </div>
          <div className="muted small">
            {r.period_key} · enviado em {new Date(r.created_at).toLocaleString('pt-BR')}
          </div>

          {r.proof_text && <p className="proof-text">{r.proof_text}</p>}
          {r.proof_path &&
            (signedUrls[r.id] ? (
              <img src={signedUrls[r.id]} alt="prova enviada" className="proof-img" />
            ) : (
              <p className="muted small">Carregando imagem…</p>
            ))}

          <textarea
            placeholder="Nota (obrigatória ao rejeitar — o usuário verá este texto)"
            value={notes[r.id] ?? ''}
            onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
            rows={2}
          />

          <div className="row">
            <button
              type="button"
              disabled={busyId === r.id}
              onClick={() => review(r.id, 'aprovada')}
              className="btn-gold"
            >
              Aprovar
            </button>
            <button
              type="button"
              disabled={busyId === r.id || !notes[r.id]?.trim()}
              onClick={() => review(r.id, 'rejeitada')}
              className="btn-red"
            >
              Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
