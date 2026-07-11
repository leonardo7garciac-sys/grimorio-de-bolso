import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import LoginScreen from './components/LoginScreen'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import PremiumGate from './components/PremiumGate'
import { TABS } from './lib/tabs'
import GrimoriosTab from './tabs/GrimoriosTab'
import QuestsTab from './tabs/QuestsTab'
import TesouroTab from './tabs/TesouroTab'
import BestiarioTab from './tabs/BestiarioTab'
import AcervoTab from './tabs/AcervoTab'
import ForumTab from './tabs/ForumTab'
import RankingTab from './tabs/RankingTab'

const TAB_COMPONENTS = {
  grimoires: GrimoriosTab,
  quests: QuestsTab,
  treasure: TesouroTab,
  bestiary: BestiarioTab,
  library: AcervoTab,
  forum: ForumTab,
  ranking: RankingTab,
}

function App() {
  const { user, loading: authLoading } = useAuth()
  const { paying, loading: profileLoading } = useProfile()
  const [tab, setTab] = useState('grimoires')

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-2xl animate-pulse">🜃</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  const activeTab = TABS.find((t) => t.id === tab)
  const gated = activeTab.premium && !paying
  const TabContent = TAB_COMPONENTS[tab]

  return (
    <div className="min-h-screen" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
      <div className="max-w-md mx-auto px-5">
        <Header />
        <main className="pt-2">
          {profileLoading ? (
            <p className="text-faint text-sm text-center py-10">Carregando…</p>
          ) : gated ? (
            <PremiumGate />
          ) : (
            <TabContent />
          )}
        </main>
      </div>
      <BottomNav tab={tab} onChange={setTab} paying={paying} />
    </div>
  )
}

export default App
