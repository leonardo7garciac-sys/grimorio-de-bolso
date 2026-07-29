import { TABS } from '../lib/tabs'

export default function BottomNav({ tab, onChange, paying, servitorsLowCount = 0 }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 bg-navy-black/90 backdrop-blur-md border-t border-gold/15"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`relative flex-1 min-w-0 py-2.5 pb-3 bg-transparent border-none cursor-pointer focus-visible:relative focus-visible:z-10 ${
              tab === t.id ? 'text-gold' : 'text-faint'
            }`}
          >
            <div className="relative inline-block text-[17px]">
              {t.icon}
              {t.id === 'servidor' && servitorsLowCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[13px] h-[13px] px-[3px] rounded-full bg-red text-navy-deep text-[8px] leading-[13px] font-bold">
                  {servitorsLowCount}
                </span>
              )}
            </div>
            <div className="text-[9px] tracking-tight mt-1 uppercase whitespace-nowrap">
              {t.label}
              {t.premium && !paying ? ' 🗝' : ''}
            </div>
          </button>
        ))}
      </div>
    </nav>
  )
}
