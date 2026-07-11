import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, SectionLabel, GoldButton, GhostButton } from '../components/ui'

const CAT_LABEL = { experimento: 'Experimento', discussao: 'Discussão', parceria: 'Parceria' }
const CAT_HUE = {
  experimento: 'var(--color-gold)',
  discussao: 'var(--color-purple)',
  parceria: 'var(--color-green)',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ForumTab() {
  const { user } = useAuth()

  const [guideline, setGuideline] = useState(null)
  const [accepted, setAccepted] = useState(null) // null = ainda não sabemos
  const [gateError, setGateError] = useState('')

  const [filter, setFilter] = useState(null)
  const [posts, setPosts] = useState(null)
  const [feedError, setFeedError] = useState('')

  const [creating, setCreating] = useState(false)
  const [newCategory, setNewCategory] = useState('experimento')
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [creatingBusy, setCreatingBusy] = useState(false)
  const [createError, setCreateError] = useState('')

  const [selectedPost, setSelectedPost] = useState(null)
  const [comments, setComments] = useState(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)

  useEffect(() => {
    loadGate()
  }, [])

  async function loadGate() {
    const { data: g, error } = await supabase
      .from('forum_guidelines')
      .select('*')
      .order('version', { ascending: false })
      .limit(1)
      .single()
    if (error) {
      setGateError(error.message)
      return
    }
    setGuideline(g)
    const { data: acc, error: accErr } = await supabase
      .from('guideline_acceptances')
      .select('version')
      .eq('version', g.version)
    if (accErr) {
      setGateError(accErr.message)
      return
    }
    setAccepted((acc ?? []).length > 0)
  }

  async function acceptGuidelines() {
    const { error } = await supabase
      .from('guideline_acceptances')
      .insert({ user_id: user.id, version: guideline.version })
    if (error) {
      setGateError(error.message)
      return
    }
    setAccepted(true)
  }

  async function loadFeed() {
    const { data, error } = await supabase.rpc('forum_feed', { p_category: filter })
    if (error) setFeedError(error.message)
    else {
      setFeedError('')
      setPosts(data ?? [])
    }
  }

  useEffect(() => {
    if (accepted) loadFeed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accepted, filter])

  async function createPost() {
    setCreateError('')
    if (newTitle.trim().length < 8) {
      setCreateError('O título precisa de pelo menos 8 caracteres.')
      return
    }
    if (newBody.trim().length < 20) {
      setCreateError('O relato precisa de pelo menos 20 caracteres.')
      return
    }
    setCreatingBusy(true)
    const { error } = await supabase
      .from('forum_posts')
      .insert({ author_id: user.id, category: newCategory, title: newTitle.trim(), body: newBody.trim() })
    setCreatingBusy(false)
    if (error) {
      setCreateError(error.message)
      return
    }
    setNewTitle('')
    setNewBody('')
    setCreating(false)
    await loadFeed()
  }

  async function openPost(post) {
    setSelectedPost(post)
    setComments(null)
    const { data, error } = await supabase.rpc('forum_post_comments', { p_post: post.id })
    if (!error) setComments(data ?? [])
  }

  async function addComment() {
    const body = commentDraft.trim()
    if (body.length < 2) return
    setCommentBusy(true)
    const { error } = await supabase
      .from('forum_comments')
      .insert({ post_id: selectedPost.id, author_id: user.id, body })
    setCommentBusy(false)
    if (error) {
      alert(error.message)
      return
    }
    setCommentDraft('')
    const { data } = await supabase.rpc('forum_post_comments', { p_post: selectedPost.id })
    setComments(data ?? [])
    setPosts((prev) =>
      (prev ?? []).map((p) => (p.id === selectedPost.id ? { ...p, comment_count: p.comment_count + 1 } : p))
    )
  }

  async function reportPost(postId) {
    const reason = window.prompt('Motivo da denúncia:')
    if (!reason || !reason.trim()) return
    const { error } = await supabase.from('forum_reports').insert({ reporter_id: user.id, post_id: postId, reason: reason.trim() })
    if (error) alert(error.message)
    else alert('Denúncia enviada ao Conselho.')
  }

  async function reportComment(commentId) {
    const reason = window.prompt('Motivo da denúncia:')
    if (!reason || !reason.trim()) return
    const { error } = await supabase
      .from('forum_reports')
      .insert({ reporter_id: user.id, comment_id: commentId, reason: reason.trim() })
    if (error) alert(error.message)
    else alert('Denúncia enviada ao Conselho.')
  }

  if (gateError) return <p className="text-red text-sm text-center py-10">{gateError}</p>
  if (accepted === null || !guideline) {
    return <p className="text-faint text-sm text-center py-10">Carregando…</p>
  }

  if (!accepted) {
    return (
      <>
        <SectionLabel>Fórum dos Magos</SectionLabel>
        <Card className="p-4">
          <div className="text-base mb-2.5">Diretrizes do Círculo</div>
          <div className="text-[13px] text-muted leading-loose whitespace-pre-wrap">{guideline.body}</div>
          <div className="mt-4">
            <GoldButton onClick={acceptGuidelines}>Aceito as diretrizes</GoldButton>
          </div>
        </Card>
      </>
    )
  }

  // ── thread de um post ──
  if (selectedPost) {
    const hue = CAT_HUE[selectedPost.category] ?? 'var(--color-gold)'
    return (
      <>
        <button
          type="button"
          onClick={() => setSelectedPost(null)}
          className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
        >
          ← Fórum
        </button>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[9px] tracking-wide uppercase border rounded-full px-2.5 py-0.5"
              style={{ borderColor: hue, color: hue }}
            >
              {CAT_LABEL[selectedPost.category] ?? selectedPost.category}
            </span>
            <span className="text-xs text-faint">{selectedPost.author_nickname}</span>
          </div>
          <div className="text-[17px] mb-2">{selectedPost.title}</div>
          <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{selectedPost.body}</div>
          <button
            type="button"
            onClick={() => reportPost(selectedPost.id)}
            className="bg-transparent border-none text-faint text-[11px] cursor-pointer mt-3"
          >
            denunciar
          </button>
        </Card>

        <SectionLabel>Respostas</SectionLabel>
        {comments === null ? (
          <p className="text-faint text-sm text-center py-6">Carregando…</p>
        ) : comments.length === 0 ? (
          <p className="text-faint text-xs text-center py-4">Nenhuma resposta ainda. Sê o primeiro.</p>
        ) : (
          comments.map((c) => (
            <Card key={c.id} className="p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-gold">{c.author_nickname}</span>
                <span className="text-[10px] text-faint">{formatDate(c.created_at)}</span>
              </div>
              <div className="text-sm leading-relaxed">{c.body}</div>
              <button
                type="button"
                onClick={() => reportComment(c.id)}
                className="bg-transparent border-none text-faint text-[10px] cursor-pointer mt-2"
              >
                denunciar
              </button>
            </Card>
          ))
        )}

        <Card className="p-4">
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Escreve uma resposta…"
            rows={3}
            className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-sm p-2.5 resize-y placeholder:text-faint focus:outline-none focus:border-gold"
          />
          <div className="mt-2.5">
            <GoldButton small disabled={commentBusy || commentDraft.trim().length < 2} onClick={addComment}>
              {commentBusy ? 'Enviando…' : 'Responder'}
            </GoldButton>
          </div>
        </Card>
      </>
    )
  }

  // ── tela de criar post ──
  if (creating) {
    return (
      <>
        <button
          type="button"
          onClick={() => setCreating(false)}
          className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
        >
          ← Fórum
        </button>
        <SectionLabel>Novo post</SectionLabel>
        <Card className="p-4">
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {Object.keys(CAT_LABEL).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewCategory(c)}
                style={{
                  borderColor: newCategory === c ? CAT_HUE[c] : 'rgba(255,255,255,.15)',
                  color: newCategory === c ? CAT_HUE[c] : undefined,
                }}
                className={`text-[11px] px-3 py-1.5 rounded-full border cursor-pointer ${
                  newCategory === c ? 'bg-white/5' : 'bg-transparent text-muted'
                }`}
              >
                {CAT_LABEL[c]}
              </button>
            ))}
          </div>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título (8–140 caracteres)"
            className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-sm p-2.5 mb-2 placeholder:text-faint focus:outline-none focus:border-gold"
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Corpo do post (20–8000 caracteres)"
            rows={6}
            className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-sm p-2.5 resize-y placeholder:text-faint focus:outline-none focus:border-gold"
          />
          {createError && <p className="text-xs text-red mt-2">{createError}</p>}
          <div className="mt-3">
            <GoldButton disabled={creatingBusy} onClick={createPost}>
              {creatingBusy ? 'Publicando…' : 'Publicar'}
            </GoldButton>
          </div>
        </Card>
      </>
    )
  }

  // ── listagem ──
  return (
    <>
      <div className="flex items-center">
        <SectionLabel>Fórum dos Magos</SectionLabel>
        <div className="flex-1" />
        <GhostButton onClick={() => setCreating(true)}>+ Novo post</GhostButton>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {Object.keys(CAT_LABEL).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(filter === c ? null : c)}
            style={{
              borderColor: filter === c ? CAT_HUE[c] : 'rgba(255,255,255,.15)',
              color: filter === c ? CAT_HUE[c] : undefined,
            }}
            className="text-[11px] px-3 py-1.5 rounded-full border bg-transparent text-muted cursor-pointer"
          >
            {CAT_LABEL[c]}
          </button>
        ))}
      </div>

      {feedError && <p className="text-red text-sm text-center py-6">{feedError}</p>}
      {posts === null && !feedError ? (
        <p className="text-faint text-sm text-center py-10">Carregando…</p>
      ) : posts && posts.length === 0 ? (
        <p className="text-faint text-sm text-center py-10">Nenhum post por aqui ainda.</p>
      ) : (
        (posts ?? []).map((p) => {
          const hue = CAT_HUE[p.category] ?? 'var(--color-gold)'
          return (
            <Card key={p.id} className="p-4">
              <button
                type="button"
                onClick={() => openPost(p)}
                className="w-full text-left bg-transparent border-none text-inherit cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[9px] tracking-wide uppercase border rounded-full px-2.5 py-0.5"
                    style={{ borderColor: hue, color: hue }}
                  >
                    {CAT_LABEL[p.category] ?? p.category}
                  </span>
                  <span className="text-xs text-faint">{p.author_nickname}</span>
                </div>
                <div className="text-[15px] mb-1.5">{p.title}</div>
                <div className="text-[13px] text-muted leading-relaxed line-clamp-3">{p.body}</div>
              </button>
              <div className="text-[11px] text-faint mt-2.5 flex gap-3">
                <span>{p.comment_count} respostas</span>
                <button
                  type="button"
                  onClick={() => reportPost(p.id)}
                  className="bg-transparent border-none text-faint text-[11px] cursor-pointer"
                >
                  denunciar
                </button>
              </div>
            </Card>
          )
        })
      )}
    </>
  )
}
