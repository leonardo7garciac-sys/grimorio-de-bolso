import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // Sinaliza que a sessão atual acabou de nascer de um código confirmado
  // com sucesso em LoginScreen -- é o gatilho para o PortalEntrada. Vive
  // aqui (não em sessionStorage) porque precisa disparar um re-render do
  // App assim que setada e porque não deve sobreviver a um recarregamento
  // de página: se a página recarregar no meio da sequência, o
  // AudioContext (também em memória) já era, então reabrir o portal sem
  // som não faria sentido.
  const [justVerified, setJustVerified] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    justVerified,
    markJustVerified: () => setJustVerified(true),
    clearJustVerified: () => setJustVerified(false),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return ctx
}
