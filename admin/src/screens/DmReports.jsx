import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../lib/supabaseAdmin'

const SUSPENSION_HOURS = 24

export default function DmReports() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [profileById, setProfileById] = useState({})
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setRows(null)
    setError('')

    const { data, error } = await supabaseAdmin
      .from('dm_reports')
      .select('id, reporter_id, message_id, reason, created_at, dm_messages(id, sender_id, recipient_id, body, created_at)')
      .eq('resolved', false)
      .order('created_at', { ascending: true })
    if (error) {
      setError(error.message)
      return
    }

    const ids = new Set()
    for (const r of data) {
      ids.add(r.reporter_id)
      if (r.dm_messages?.sender_id) ids.add(r.dm_messages.sender_id)
      if (r.dm_messages?.recipient_id) ids.add(r.dm_messages.recipient_id)
    }
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, nickname')
      .in('id', ids.size ? [...ids] : ['00000000-0000-0000-0000-000000000000'])

    setProfileById(Object.fromEntries((profiles ?? []).map((p) => [p.id, p])))
    setRows(data)
  }

  useEffect(() => {
    load()
  }, [])

  function nameFor(id) {
    const p = profileById[id]
    return p?.nickname || p?.display_name || id
  }

  async function resolveOnly(id) {
    setBusyId(id)
    const { error } = await supabaseAdmin.from('dm_reports').update({ resolved: true }).eq('id', id)
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  async function suspend(report) {
    const senderId = report.dm_messages?.sender_id
    if (!senderId) {
      alert('A mensagem já foi removida — nada para suspender.')
      return
    }
    setBusyId(report.id)
    const until = new Date(Date.now() + SUSPENSION_HOURS * 60 * 60 * 1000).toISOString()
    const { error: susErr } = await supabaseAdmin.from('messaging_suspensions').insert({
      user_id: senderId,
      until,
      reason: report.reason,
    })
    if (susErr) {
      setBusyId(null)
      alert(susErr.message)
      return
    }
    const { error: reportErr } = await supabaseAdmin.from('dm_reports').update({ resolved: true }).eq('id', report.id)
    setBusyId(null)
    if (reportErr) {
      alert(reportErr.message)
      return
    }
    await load()
  }

  if (error) return <p className="error">{error}</p>
  if (rows === null) return <p className="muted">Carregando denúncias…</p>
  if (rows.length === 0) return <p className="muted">Nenhuma denúncia pendente.</p>

  return (
    <div className="stack">
      {rows.map((r) => {
        const msg = r.dm_messages
        return (
          <div key={r.id} className="card">
            <div className="card-head">
              <strong>Mensagem privada</strong>
              <span className="muted small"> · denunciada por {nameFor(r.reporter_id)}</span>
            </div>
            <div className="muted small">{new Date(r.created_at).toLocaleString('pt-BR')}</div>
            <p className="small">
              <strong>Motivo:</strong> {r.reason}
            </p>

            {msg ? (
              <div className="quoted">
                <div className="muted small">
                  de {nameFor(msg.sender_id)} para {nameFor(msg.recipient_id)} ·{' '}
                  {new Date(msg.created_at).toLocaleString('pt-BR')}
                </div>
                <p className="small">{msg.body}</p>
              </div>
            ) : (
              <p className="muted small">Mensagem já removida ou indisponível.</p>
            )}

            <div className="row">
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => resolveOnly(r.id)}
                className="btn-ghost"
              >
                Ignorar (resolver)
              </button>
              {msg && (
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => suspend(r)}
                  className="btn-red"
                >
                  Suspender remetente ({SUSPENSION_HOURS}h)
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
