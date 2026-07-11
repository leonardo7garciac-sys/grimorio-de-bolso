import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

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
          <div className="border border-gold/30 rounded-xl bg-white/5 p-5 text-center">
            <p className="text-sm leading-relaxed">
              Enviamos um link mágico para <span className="text-gold">{email}</span>.
              Abre o teu e-mail para entrar.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-4 text-xs text-faint underline"
            >
              usar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full box-border bg-white/5 border border-gold/30 rounded-lg text-ink text-sm px-3 py-2.5 placeholder:text-faint focus:outline-none focus:border-gold"
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
