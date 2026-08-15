import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { unlockAudio } from '../lib/audio'

const EMAIL_RE = /^(?!\.)(?!.*\.\.)[^\s@]+(?<!\.)@[^\s@]+\.[^\s@]+$/
const GENERIC_SEND_ERROR = 'Não foi possível enviar o código. Confira o e-mail e tente de novo.'

// error.message às vezes chega como JSON.stringify de um objeto sem
// campo reconhecido (lib @supabase/auth-js) — ex.: a string literal
// "{}". Isso é verdadeiro para efeitos de "||", então precisa de
// checagem própria, não só de vazio.
function readableAuthError(err) {
  const msg = err?.message?.trim()
  if (!msg || msg.startsWith('{')) return GENERIC_SEND_ERROR
  return msg
}

export default function LoginScreen() {
  const { markJustVerified } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [codeError, setCodeError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError('Digite um e-mail válido.')
      setStatus('error')
      return
    }
    setStatus('sending')
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) {
        setError(readableAuthError(error))
        setStatus('error')
      } else {
        setStatus('sent')
      }
    } catch (err) {
      setError(readableAuthError(err))
      setStatus('error')
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    setCodeError('')
    setVerifying(true)
    // Precisa nascer aqui, síncrono com o clique/submit -- é o único
    // gesto do usuário disponível neste fluxo, e o AudioContext exige um
    // para sair do estado suspenso.
    unlockAudio()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })
    setVerifying(false)
    if (error) {
      setCodeError(error.message)
      return
    }
    markJustVerified()
    // sucesso: onAuthStateChange cuida do resto, não precisa navegar aqui.
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3 text-gold">🜃</div>
          <h1 className="text-2xl">Grimório de Bolso</h1>
          <p className="text-muted text-sm mt-2 leading-relaxed">
            Entre com um código de 6 dígitos enviado ao teu e-mail. Sem senha.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="border border-gold/30 rounded-xl bg-white/5 p-5">
            <p className="text-sm leading-relaxed text-center">
              Enviamos um código de 6 dígitos para <span className="text-gold">{email}</span>.
              Confira o teu e-mail e digite o código abaixo.
            </p>

            <div className="mt-4">
              <form onSubmit={handleVerifyCode} className="space-y-2.5">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="código de 6 dígitos"
                  className="w-full box-border bg-white/5 border border-gold/30 rounded-lg text-ink text-base px-3 py-2.5 text-center tracking-[0.3em] placeholder:tracking-normal placeholder:text-faint focus:outline-none focus:border-gold"
                />
                {codeError && <p className="text-xs text-red text-center">{codeError}</p>}
                <button
                  type="submit"
                  disabled={verifying || code.length < 6}
                  className="w-full rounded-lg py-2.5 text-sm tracking-wide bg-gradient-to-r from-gold to-gold-light text-navy-deep disabled:opacity-50 disabled:cursor-default cursor-pointer"
                >
                  {verifying ? 'Confirmando…' : 'Confirmar código'}
                </button>
              </form>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStatus('idle')
                  setCode('')
                  setCodeError('')
                }}
                className="mt-4 text-xs text-faint underline"
              >
                usar outro e-mail
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full box-border bg-white/5 border border-gold/30 rounded-lg text-ink text-base px-3 py-2.5 placeholder:text-faint focus:outline-none focus:border-gold"
            />
            {status === 'error' && <p className="text-xs text-red">{error}</p>}
            <button
              type="submit"
              disabled={status === 'sending' || !email}
              className="w-full rounded-lg py-3 text-sm tracking-wide bg-gradient-to-r from-gold to-gold-light text-navy-deep disabled:opacity-50 disabled:cursor-default cursor-pointer"
            >
              {status === 'sending' ? 'Enviando…' : 'Enviar código'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
