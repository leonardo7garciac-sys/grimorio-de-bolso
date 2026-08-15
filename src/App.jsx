import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import LoginScreen from './components/LoginScreen'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import PremiumGate from './components/PremiumGate'
import MagoScreen from './components/MagoScreen'
import GroupedTab from './components/GroupedTab'
import UpdatePrompt from './components/UpdatePrompt'
import LegalAcceptanceGate from './components/LegalAcceptanceGate'
import PortalEntrada from './components/PortalEntrada'
import { TABS, TAB_GROUPS, LEGACY_ROUTES } from './lib/tabs'
import { isFreshSignup } from './lib/freshSignup'
import GrimoriosTab from './tabs/GrimoriosTab'
import QuestsTab from './tabs/QuestsTab'
import TesouroTab from './tabs/TesouroTab'
import BestiarioTab from './tabs/BestiarioTab'
import AcervoTab from './tabs/AcervoTab'
import ForumTab from './tabs/ForumTab'
import RankingTab from './tabs/RankingTab'
import ServidorTab from './tabs/ServidorTab'
import SigilizadorTab from './tabs/SigilizadorTab'
import TarotTab from './tabs/TarotTab'
import CirculoTab from './tabs/CirculoTab'

const TAB_COMPONENTS = {
  grimoires: GrimoriosTab,
  circle: CirculoTab,
}

const SECTION_COMPONENTS = {
  quests: QuestsTab,
  treasure: TesouroTab,
  bestiary: BestiarioTab,
  library: AcervoTab,
  forum: ForumTab,
  ranking: RankingTab,
  servidor_astral: ServidorTab,
  sigilizador: SigilizadorTab,
  tarot: TarotTab,
}

function App() {
  const { user, justVerified, clearJustVerified, loading: authLoading } = useAuth()
  const { profile, paying, servitorsLowCount, loading: profileLoading } = useProfile()
  const [tab, setTab] = useState('grimoires')
  const [section, setSection] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  // Começa bloqueado por padrão: LegalAcceptanceGate ainda não teve chance
  // de dizer se há pendência, e o PortalEntrada não pode arriscar aparecer
  // por cima de um aceite de termos ainda por resolver.
  const [legalBlocking, setLegalBlocking] = useState(true)

  // Ponto único de navegação entre abas: aceita tanto os ids novos
  // (aba agrupada, cai na primeira seção) quanto os ids de antes do
  // agrupamento (LEGACY_ROUTES), redirecionando para a aba certa já
  // com a seção certa selecionada.
  function navigate(id) {
    const legacy = LEGACY_ROUTES[id]
    if (legacy) {
      setTab(legacy.tab)
      setSection(legacy.section)
      return
    }
    setTab(id)
    setSection(TAB_GROUPS[id] ? TAB_GROUPS[id][0].id : null)
  }

  let content
  if (authLoading) {
    content = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-2xl animate-pulse">🜃</div>
      </div>
    )
  } else if (!user) {
    content = <LoginScreen />
  } else {
    const activeTab = TABS.find((t) => t.id === tab)
    const gated = activeTab.premium && !paying
    const group = TAB_GROUPS[tab]
    const TabContent = TAB_COMPONENTS[tab]

    content = (
      <div className="min-h-screen" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
        <div className="max-w-md mx-auto px-5">
          <Header onOpenProfile={() => setShowProfile(true)} />
          <main className="pt-2">
            {profileLoading ? (
              <p className="text-faint text-sm text-center py-10">Carregando…</p>
            ) : gated ? (
              <PremiumGate />
            ) : group ? (
              <GroupedTab
                sections={group}
                section={section}
                onSectionChange={setSection}
                components={SECTION_COMPONENTS}
                paying={paying}
              />
            ) : (
              <TabContent />
            )}
          </main>
        </div>
        <BottomNav tab={tab} onChange={navigate} paying={paying} servitorsLowCount={servitorsLowCount} />
        {showProfile && <MagoScreen onClose={() => setShowProfile(false)} />}
      </div>
    )
  }

  return (
    <>
      <UpdatePrompt />
      <LegalAcceptanceGate onBlockingChange={setLegalBlocking} />
      {content}
      {user && justVerified && !legalBlocking && (
        <PortalEntrada
          estreia={isFreshSignup(user)}
          apelido={profile?.nickname ?? null}
          pronto={!profileLoading}
          onFim={clearJustVerified}
        />
      )}
    </>
  )
}

export default App
