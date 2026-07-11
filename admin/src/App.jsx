import { useState } from 'react'
import { envReady } from './lib/supabaseAdmin'
import QuestQueue from './screens/QuestQueue.jsx'
import ForumReports from './screens/ForumReports.jsx'

export default function App() {
  const [tab, setTab] = useState('quests')

  if (!envReady) {
    return (
      <div className="wrap">
        <p className="error">
          Configure admin/.env.local com VITE_SUPABASE_URL e
          VITE_SUPABASE_SERVICE_ROLE_KEY (a service_role, não a anon) antes
          de usar este painel. Veja admin/README.md.
        </p>
      </div>
    )
  }

  return (
    <div className="wrap">
      <header className="header">
        <h1>Painel Admin — Grimório de Bolso</h1>
        <p className="muted small">Uso local apenas. Nunca deployar (ver README.md).</p>
        <nav className="tabs">
          <button
            type="button"
            className={tab === 'quests' ? 'tab active' : 'tab'}
            onClick={() => setTab('quests')}
          >
            Fila de Quests
          </button>
          <button
            type="button"
            className={tab === 'forum' ? 'tab active' : 'tab'}
            onClick={() => setTab('forum')}
          >
            Denúncias do Fórum
          </button>
        </nav>
      </header>
      <main>{tab === 'quests' ? <QuestQueue /> : <ForumReports />}</main>
    </div>
  )
}
