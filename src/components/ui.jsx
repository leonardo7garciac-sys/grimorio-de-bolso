export function Card({ children, className = '', style }) {
  return (
    <div
      style={style}
      className={`border border-gold/20 rounded-xl bg-white/[.02] mb-3 overflow-hidden ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children }) {
  return (
    <div className="text-[11px] tracking-[3px] uppercase text-muted mb-3.5 mt-1.5">
      {children}
    </div>
  )
}

export function GoldButton({ children, onClick, disabled, small, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`tracking-wide rounded-lg cursor-pointer disabled:cursor-default
        ${disabled ? 'bg-white/10 text-faint' : 'bg-gradient-to-r from-gold to-gold-light text-navy-deep'}
        ${small ? 'px-3.5 py-2 text-xs' : 'px-6 py-3 text-sm'} ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, hue = 'var(--color-gold)', className = '', disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ borderColor: hue, color: hue }}
      className={`bg-transparent border rounded-lg px-3 py-1.5 text-xs tracking-wide cursor-pointer disabled:opacity-50 disabled:cursor-default ${className}`}
    >
      {children}
    </button>
  )
}
