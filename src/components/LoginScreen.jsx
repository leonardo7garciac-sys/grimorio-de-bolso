import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [codeError, setCodeError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    setCodeError('')
    setVerifying(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })
    setVerifying(false)
    if (error) {
      setCodeError(error.message)
    }
    // sucesso: onAuthStateChange cuida do resto, não precisa navegar aqui.
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3 text-gold">🜃</div>
          <h1 className="text-2xl">Grimório de Bolso</h1>
          <p className="text-muted text-sm mt-2 leading-relaxed">
            Entre com um link mágico enviado ao teu e-mail. Sem senha.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="border border-gold/30 rounded-xl bg-white/5 p-5">
            <p className="text-sm leading-relaxed text-center">
              Enviamos um link mágico para <span className="text-gold">{email}</span>.
              Abre o teu e-mail para entrar.
            </p>

            <div className="border-t border-white/10 mt-4 pt-4">
              <p className="text-xs text-muted text-center mb-3 leading-relaxed">
                Instalou o app na tela de início do iPhone? O link abre no Safari, não no app
                instalado — usa o código de 6 dígitos do mesmo e-mail em vez disso.
              </p>
              <form onSubmit={handleVerifyCode} className="space-y-2.5">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="ou digita o código de 6 dígitos do e-mail"
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
              {status === 'sending' ? 'Enviando…' : 'Enviar link mágico'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
