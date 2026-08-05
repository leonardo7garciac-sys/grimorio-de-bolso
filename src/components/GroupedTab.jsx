import PremiumGate from './PremiumGate'

export default function GroupedTab({ sections, section, onSectionChange, components, paying = true }) {
  const current = sections.find((s) => s.id === section)
  const Section = components[section]
  const gated = current?.premium && !paying

  return (
    <>
      <div className="flex gap-1.5 mb-4">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSectionChange(s.id)}
            className={`flex-1 text-[11px] px-2 py-1.5 rounded-full border cursor-pointer tracking-wide ${
              section === s.id ? 'border-gold text-gold' : 'border-white/15 text-muted'
            }`}
          >
            {s.label}
            {s.premium && !paying ? ' 🗝' : ''}
          </button>
        ))}
      </div>
      {gated ? <PremiumGate /> : Section && <Section />}
    </>
  )
}
