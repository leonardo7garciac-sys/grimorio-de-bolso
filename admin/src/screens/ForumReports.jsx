import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../lib/supabaseAdmin'

export default function ForumReports() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [profileById, setProfileById] = useState({})
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setRows(null)
    setError('')

    const { data, error } = await supabaseAdmin
      .from('forum_reports')
      .select(
        'id, reporter_id, post_id, comment_id, reason, created_at, forum_posts(id, title, body, status, author_id), forum_comments(id, body, status, author_id, post_id)'
      )
      .eq('resolved', false)
      .order('created_at', { ascending: true })
    if (error) {
      setError(error.message)
      return
    }

    const ids = new Set()
    for (const r of data) {
      ids.add(r.reporter_id)
      if (r.forum_posts?.author_id) ids.add(r.forum_posts.author_id)
      if (r.forum_comments?.author_id) ids.add(r.forum_comments.author_id)
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
    const { error } = await supabaseAdmin.from('forum_reports').update({ resolved: true }).eq('id', id)
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  async function setContentStatus(report, status) {
    setBusyId(report.id)
    const table = report.post_id ? 'forum_posts' : 'forum_comments'
    const targetId = report.post_id ?? report.comment_id
    const { error: contentError } = await supabaseAdmin.from(table).update({ status }).eq('id', targetId)
    if (contentError) {
      setBusyId(null)
      alert(contentError.message)
      return
    }
    const { error: reportError } = await supabaseAdmin
      .from('forum_reports')
      .update({ resolved: true })
      .eq('id', report.id)
    setBusyId(null)
    if (reportError) {
      alert(reportError.message)
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
        const content = r.forum_posts ?? r.forum_comments
        const isPost = Boolean(r.forum_posts)
        return (
          <div key={r.id} className="card">
            <div className="card-head">
              <strong>{isPost ? 'Post' : 'Comentário'}</strong>
              <span className="muted small"> · denunciado por {nameFor(r.reporter_id)}</span>
            </div>
            <div className="muted small">{new Date(r.created_at).toLocaleString('pt-BR')}</div>
            <p className="small">
              <strong>Motivo:</strong> {r.reason}
            </p>

            {content ? (
              <div className="quoted">
                <div className="muted small">
                  autor: {nameFor(content.author_id)} · status atual: {content.status}
                </div>
                {isPost && (
                  <div className="small">
                    <strong>{content.title}</strong>
                  </div>
                )}
                <p className="small">{content.body}</p>
              </div>
            ) : (
              <p className="muted small">Conteúdo já removido ou indisponível.</p>
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
              {content && (
                <>
                  <button
                    type="button"
                    disabled={busyId === r.id || content.status === 'oculto'}
                    onClick={() => setContentStatus(r, 'oculto')}
                    className="btn-gold"
                  >
                    Ocultar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id || content.status === 'removido'}
                    onClick={() => setContentStatus(r, 'removido')}
                    className="btn-red"
                  >
                    Remover
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
