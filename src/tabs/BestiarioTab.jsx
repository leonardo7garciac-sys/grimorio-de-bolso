import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SectionLabel } from '../components/ui'

const KIND_GLYPH = {
  criatura: '🜂',
  deidade: '🌒',
  espirito: '👁',
  flora: '🜃',
  artefato: '🜏',
  lugar: '⛰',
}

const EPI_HUE = {
  lenda: 'var(--color-purple)',
  relato: 'var(--color-gold)',
  tradição: 'var(--color-red)',
  'psicologia verificada': 'var(--color-green)',
}

export default function BestiarioTab() {
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)

  useEffect(() => {
    supabase
      .from('bestiary_entries')
      .select('id, slug, name, kind, pantheon, summary, epistemics, image_path')
      .eq('is_published', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setEntries(data ?? [])
      })
  }, [])

  async function openEntry(slug) {
    const { data, error } = await supabase.from('bestiary_entries').select('*').eq('slug', slug).single()
    if (error) {
      setError(error.message)
      return
    }
    setSelected(data)
    setImageUrl(null)
    if (data.image_path) {
      const { data: signed } = await supabase.storage.from('bestiario').createSignedUrl(data.image_path, 3600)
      setImageUrl(signed?.signedUrl ?? null)
    }
  }

  if (error) return <p className="text-red text-sm text-center py-10">{error}</p>
  if (entries === null) return <p className="text-faint text-sm text-center py-10">Carregando…</p>

  if (selected) {
    const hue = EPI_HUE[selected.epistemics] ?? 'var(--color-gold)'
    return (
      <>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
        >
          ← Bestiário
        </button>
        <div className="text-center pb-4">
          <div
            className="w-[110px] h-[110px] mx-auto mb-3.5 rounded-full grid place-items-center text-5xl border border-gold/35 overflow-hidden"
            style={{ background: 'radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)' }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              KIND_GLYPH[selected.kind] ?? '❖'
            )}
          </div>
          <div className="text-2xl">{selected.name}</div>
          <div className="text-xs text-muted mt-1">
            {selected.kind}
            {selected.pantheon ? ` · panteão ${selected.pantheon}` : ''}
          </div>
          {selected.epistemics && (
            <span
              className="inline-block mt-2.5 text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full border"
              style={{ borderColor: hue, color: hue }}
            >
              {selected.epistemics}
            </span>
          )}
        </div>
        {selected.summary && <p className="text-[15px] leading-relaxed opacity-90 mb-3">{selected.summary}</p>}
        {selected.lore && <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">{selected.lore}</p>}
      </>
    )
  }

  if (entries.length === 0) {
    return <p className="text-faint text-sm text-center py-10">Nenhum verbete publicado ainda.</p>
  }

  return (
    <>
      <SectionLabel>Bestiário Astral</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        {entries.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => openEntry(b.slug)}
            className="border border-gold/20 rounded-xl bg-white/[.02] px-3 pt-5 pb-4 text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">{KIND_GLYPH[b.kind] ?? '❖'}</div>
            <div className="text-[15px]">{b.name}</div>
            {b.pantheon && <div className="text-[11px] text-muted mt-0.5">{b.pantheon}</div>}
            {b.epistemics && (
              <div
                className="mt-2 text-[9px] tracking-wide uppercase"
                style={{ color: EPI_HUE[b.epistemics] ?? 'var(--color-gold)' }}
              >
                {b.epistemics}
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  )
}
