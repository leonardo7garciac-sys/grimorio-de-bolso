import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { isFreshSignup as checkFreshSignup } from '../lib/freshSignup'
import { unlockAudio } from '../lib/audio'

// onBlockingChange (opcional) é avisado sempre que este gate passa a
// bloquear a tela ou deixa de bloquear -- o App usa isso para não montar
// o PortalEntrada por cima de uma pendência de aceite legal ainda não
// resolvida. Enquanto `pending` não chegou do banco, contamos como
// bloqueante (conservador): evita o Portal "piscar" antes de sabermos se
// há documento pendente, justamente no caso de conta recém-criada, que é
// onde os dois fluxos mais se cruzam.
export default function LegalAcceptanceGate({ onBlockingChange }) {
  const { user } = useAuth()
  const [pending, setPending] = useState(null)
  const [checkedDocs, setCheckedDocs] = useState(false)
  const [checkedAge, setCheckedAge] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase.rpc('legal_pending').then(({ data, error }) => {
      if (!cancelled && !error) setPending(data ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const isFreshSignup = user ? checkFreshSignup(user) : false
  const isBlocking =
    Boolean(user) && (pending === null || (pending.length > 0 && (isFreshSignup || !dismissed)))

  useEffect(() => {
    onBlockingChange?.(isBlocking)
  }, [isBlocking, onBlockingChange])

  if (!user || !pending || pending.length === 0) return null
  if (!isFreshSignup && dismissed) return null

  const canAccept = checkedDocs && checkedAge

  async function accept() {
    // Toque válido para religar o AudioContext, caso o celular já tenha
    // suspendido por inatividade entre o código e este passo.
    unlockAudio()
    setBusy(true)
    setError('')
    const rows = pending.map((p) => ({ user_id: user.id, kind: p.kind, version: p.version }))
    const { error } = await supabase.from('legal_acceptances').insert(rows)
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setPending([])
  }

  const form = (
    <>
      <div className="text-base mb-2">{isFreshSignup ? 'Antes de continuar' : 'Documentos atualizados'}</div>
      <p className="text-[13px] text-muted leading-relaxed mb-4">
        {isFreshSignup
          ? 'Para criar tua conta, leia e aceite os documentos abaixo.'
          : 'Os Termos de Uso e a Política de Privacidade do Grimório de Bolso foram publicados. Leia e aceite para continuar em dia.'}
      </p>

      <label className="flex items-start gap-2.5 text-[13px] text-muted leading-relaxed mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checkedDocs}
          onChange={(e) => setCheckedDocs(e.target.checked)}
          className="mt-0.5 w-4 h-4 flex-shrink-0"
        />
        <span>
          Li e aceito os{' '}
          <a href="/legal/termos" target="_blank" rel="noopener noreferrer" className="text-gold">
            Termos de Uso
          </a>{' '}
          e a{' '}
          <a href="/legal/privacidade" target="_blank" rel="noopener noreferrer" className="text-gold">
            Política de Privacidade
          </a>
          .
        </span>
      </label>

      <label className="flex items-start gap-2.5 text-[13px] text-muted leading-relaxed mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={checkedAge}
          onChange={(e) => setCheckedAge(e.target.checked)}
          className="mt-0.5 w-4 h-4 flex-shrink-0"
        />
        <span>Declaro ter 18 anos ou mais.</span>
      </label>

      {error && <p className="text-xs text-red mb-3 leading-relaxed">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={!canAccept || busy}
          onClick={accept}
          className="tracking-wide rounded-lg cursor-pointer px-5 py-2.5 text-sm border-none bg-gradient-to-r from-gold to-gold-light text-navy-deep disabled:opacity-40 disabled:cursor-default"
        >
          {busy ? 'Confirmando…' : 'Aceitar e continuar'}
        </button>
        {!isFreshSignup && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setDismissed(true)}
            className="bg-transparent border-none text-faint text-xs cursor-pointer disabled:opacity-50"
          >
            depois
          </button>
        )}
      </div>
    </>
  )

  if (isFreshSignup) {
    return (
      <div className="fixed inset-0 z-[60] bg-navy-deep overflow-y-auto grid place-items-center p-6">
        <div className="w-full max-w-sm">{form}</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 grid place-items-center p-6">
      <div className="w-full max-w-sm bg-navy-deep border border-gold/25 rounded-xl p-5">{form}</div>
    </div>
  )
}
