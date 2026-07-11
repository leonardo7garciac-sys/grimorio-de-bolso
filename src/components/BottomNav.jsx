import { TABS } from '../lib/tabs'

export default function BottomNav({ tab, onChange, paying }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-navy-black/90 backdrop-blur-md border-t border-gold/15">
      <div className="max-w-md mx-auto flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex-1 min-w-0 py-2.5 pb-3 bg-transparent border-none cursor-pointer ${
              tab === t.id ? 'text-gold' : 'text-faint'
            }`}
          >
            <div className="text-[17px]">{t.icon}</div>
            <div className="text-[8px] tracking-wide mt-1 uppercase whitespace-nowrap">
              {t.label}
              {t.premium && !paying ? ' 🗝' : ''}
            </div>
          </button>
        ))}
      </div>
    </nav>
  )
}
