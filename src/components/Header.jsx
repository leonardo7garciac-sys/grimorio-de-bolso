import { useMemo } from 'react'
import { useProfile } from '../hooks/useProfile'
import LogoutButton from './LogoutButton'
import MageSigil from './MageSigil'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function Header({ onOpenProfile }) {
  const { profile, titles, balance, circleExpiry, cosmeticTitleName, equippedItems, loading } = useProfile()

  const equippedCosmetics = useMemo(
    () =>
      equippedItems
        .filter((e) => e.shop_items?.kind === 'cosmetico_perfil')
        .map((e) => e.shop_items),
    [equippedItems]
  )

  const { current, next, progress } = useMemo(() => {
    if (!profile || titles.length === 0) return { current: null, next: null, progress: 0 }
    const xp = profile.xp_total
    let idx = 0
    titles.forEach((t, i) => {
      if (xp >= t.min_xp) idx = i
    })
    const current = titles[idx]
    const next = titles[idx + 1]
    const progress = next ? ((xp - current.min_xp) / (next.min_xp - current.min_xp)) * 100 : 100
    return { current, next, progress }
  }, [profile, titles])

  if (loading || !profile || !current) {
    return (
      <header
        className="sticky top-0 z-20 -mx-5 px-5 pb-5 mb-2 bg-navy-deep/85 backdrop-blur-md border-b border-gold/10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)' }}
      >
        <div className="h-13 rounded-xl bg-white/5 animate-pulse" />
      </header>
    )
  }

  return (
    <header
      className="sticky top-0 z-20 -mx-5 px-5 pb-4 mb-2 bg-navy-deep/85 backdrop-blur-md border-b border-gold/10 flex items-center gap-3.5"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
    >
      <MageSigil glyph={current.glyph} size={52} equippedCosmetics={equippedCosmetics} onClick={onOpenProfile} />
      <div className="flex-1 min-w-0">
        <div className="text-base whitespace-nowrap overflow-hidden text-ellipsis">
          {current.name}
          {cosmeticTitleName && <span className="text-xs text-gold ml-2">· {cosmeticTitleName}</span>}
        </div>
        <div className="h-[5px] rounded-full bg-white/10 my-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[11px] text-muted">
          {profile.xp_total} XP {next ? `· ${next.min_xp - profile.xp_total} até ${next.name}` : '· grau máximo'}
          <span className="text-gold ml-2.5">{balance} ✦</span>
          {circleExpiry && <span className="text-gold ml-2.5">· Círculo até {formatDate(circleExpiry)}</span>}
        </div>
      </div>
      <LogoutButton />
    </header>
  )
}
