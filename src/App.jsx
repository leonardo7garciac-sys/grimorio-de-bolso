import { useAuth } from './hooks/useAuth'
import LoginScreen from './components/LoginScreen'
import LogoutButton from './components/LogoutButton'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-2xl animate-pulse">🜃</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-sm mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="text-2xl text-gold">🜃</div>
            <h1 className="text-lg mt-1">Grimório de Bolso</h1>
          </div>
          <LogoutButton />
        </header>
        <p className="text-muted text-sm leading-relaxed">
          Sessão ativa como <span className="text-gold">{user.email}</span>.
          Próxima etapa: casca do app e aba Grimórios.
        </p>
      </div>
    </div>
  )
}

export default App
