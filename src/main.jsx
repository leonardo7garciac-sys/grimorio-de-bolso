import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LegalDocumentPage from './components/LegalDocumentPage.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { ProfileProvider } from './hooks/useProfile.jsx'

// Rota pública, sem login: legal_documents é de leitura livre de
// propósito, e não há biblioteca de rotas no projeto -- checar o
// pathname aqui evita puxar uma dependência só pra isto.
const legalMatch = window.location.pathname.match(/^\/legal\/(termos|privacidade)$/)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {legalMatch ? (
      <LegalDocumentPage kind={legalMatch[1]} />
    ) : (
      <AuthProvider>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </AuthProvider>
    )}
  </StrictMode>,
)
