import { useAuth } from '../hooks/useAuth'

export default function LogoutButton({ className = '' }) {
  const { signOut } = useAuth()
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className={`text-xs tracking-wide text-faint hover:text-gold transition-colors cursor-pointer ${className}`}
    >
      Sair
    </button>
  )
}
