const hasEnv = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className="text-4xl mb-4 text-gold">🜃</div>
        <h1 className="text-2xl mb-2">Grimório de Bolso</h1>
        <p className="text-muted text-sm leading-relaxed">
          Fundação do app criada. Próxima etapa: autenticação por magic link.
        </p>
        <p className="mt-4 text-xs" style={{ color: hasEnv ? '#6fbf8e' : '#c96a4a' }}>
          {hasEnv
            ? 'Variáveis do Supabase configuradas.'
            : 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local.'}
        </p>
      </div>
    </div>
  )
}

export default App
