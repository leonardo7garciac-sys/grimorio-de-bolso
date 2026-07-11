import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, SectionLabel } from '../components/ui'

export default function AcervoTab() {
  const [works, setWorks] = useState(null)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)
  const [excerptsByWork, setExcerptsByWork] = useState({})

  useEffect(() => {
    supabase
      .from('library_works')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setWorks(data ?? [])
      })
  }, [])

  async function toggle(work) {
    const next = openId === work.id ? null : work.id
    setOpenId(next)
    if (next && !excerptsByWork[work.id]) {
      const { data, error } = await supabase
        .from('library_excerpts')
        .select('*')
        .eq('work_id', work.id)
        .order('sort_order')
      if (!error) setExcerptsByWork((prev) => ({ ...prev, [work.id]: data ?? [] }))
    }
  }

  if (error) return <p className="text-red text-sm text-center py-10">{error}</p>
  if (works === null) return <p className="text-faint text-sm text-center py-10">Carregando…</p>
  if (works.length === 0) return <p className="text-faint text-sm text-center py-10">Nenhuma obra publicada ainda.</p>

  return (
    <>
      <SectionLabel>Arquivo Proibido</SectionLabel>
      {works.map((w) => {
        const open = openId === w.id
        const excerpts = excerptsByWork[w.id] ?? []
        return (
          <Card key={w.id}>
            <button
              type="button"
              onClick={() => toggle(w)}
              className="w-full p-4 bg-transparent border-none text-inherit text-left cursor-pointer"
            >
              <div className="text-[15px]">{w.title}</div>
              <div className="text-xs text-muted mt-0.5">
                {[w.author, w.era, w.tradition].filter(Boolean).join(' · ')}
              </div>
            </button>
            {open && (
              <div className="px-4 pb-4">
                {w.intro && <p className="text-sm text-muted leading-relaxed mb-3">{w.intro}</p>}
                {excerpts.length === 0 && (
                  <p className="text-xs text-faint">Nenhum trecho cadastrado ainda.</p>
                )}
                {excerpts.map((ex) => (
                  <div key={ex.id} className="mb-4 last:mb-0">
                    {ex.heading && (
                      <div className="text-xs text-gold tracking-wide uppercase mb-1.5">{ex.heading}</div>
                    )}
                    <div
                      className="border-l-2 pl-3.5 italic text-[15px] leading-relaxed opacity-90"
                      style={{ borderColor: 'var(--color-gold)' }}
                    >
                      “{ex.body}”
                    </div>
                    {ex.commentary && (
                      <div className="text-[13px] text-muted leading-relaxed mt-2.5">
                        <span className="text-gold text-[10px] tracking-wide uppercase">Nota de estudo · </span>
                        {ex.commentary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })}
    </>
  )
}
