import { useEffect, useState } from 'react'
import { marked } from 'marked'
import { supabase } from '../lib/supabase'

const TITLES = { termos: 'Termos de Uso', privacidade: 'Política de Privacidade' }

const PROSE_CLASSES =
  '[&_h1]:text-xl [&_h1]:text-gold [&_h1]:mt-0 [&_h1]:mb-3 [&_h1]:leading-snug ' +
  '[&_h2]:text-base [&_h2]:text-gold [&_h2]:mt-7 [&_h2]:mb-2.5 ' +
  '[&_p]:mb-3 [&_strong]:text-ink ' +
  '[&_hr]:border-gold/20 [&_hr]:my-6 ' +
  '[&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-1 ' +
  '[&_a]:text-gold ' +
  '[&_table]:w-full [&_table]:border-collapse [&_table]:text-[12px] [&_table]:my-4 ' +
  '[&_th]:border [&_th]:border-gold/20 [&_th]:p-2 [&_th]:text-left [&_th]:text-muted ' +
  '[&_td]:border [&_td]:border-gold/20 [&_td]:p-2 [&_td]:align-top'

// Página pública, sem login: quem decide se cria conta precisa poder ler
// antes. Por isso este componente é montado direto em main.jsx, fora dos
// providers de auth -- não depende de sessão nenhuma.
export default function LegalDocumentPage({ kind }) {
  const [body, setBody] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    supabase.rpc('legal_current').then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setError(error.message)
        return
      }
      const doc = (data ?? []).find((d) => d.kind === kind)
      setBody(doc?.body ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [kind])

  return (
    <div className="min-h-screen bg-navy-deep">
      <div className="max-w-md mx-auto px-5" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)', paddingBottom: '3rem' }}>
        <a href="/" className="text-xs text-gold no-underline">
          ← Grimório de Bolso
        </a>

        <h1 className="text-lg text-ink mt-5 mb-5">{TITLES[kind] ?? 'Documento'}</h1>

        {error && <p className="text-red text-sm">{error}</p>}
        {body === null && !error && <p className="text-faint text-sm">Carregando…</p>}
        {body === '' && <p className="text-faint text-sm">Documento não encontrado.</p>}
        {body && (
          <div
            className={`text-[14px] text-muted leading-relaxed ${PROSE_CLASSES}`}
            dangerouslySetInnerHTML={{ __html: marked.parse(body) }}
          />
        )}
      </div>
    </div>
  )
}
