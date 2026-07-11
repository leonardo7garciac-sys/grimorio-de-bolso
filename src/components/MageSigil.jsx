// Efeitos visuais conhecidos por slug de item cosmético (kind = 'cosmetico_perfil').
// Item novo sem slug mapeado aqui cai no anel dourado genérico (fallback).
const EFFECT_BY_SLUG = {
  'moldura-lunar': 'moon-ring',
  'aura-dourada': 'aura-glow',
}

export default function MageSigil({ glyph, size = 52, equippedCosmetics = [], onClick }) {
  const effects = new Set(equippedCosmetics.map((c) => EFFECT_BY_SLUG[c.slug]).filter(Boolean))
  const hasUnknownCosmetic = equippedCosmetics.some((c) => !EFFECT_BY_SLUG[c.slug])
  const showFallback = effects.size === 0 && hasUnknownCosmetic

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="relative grid place-items-center flex-shrink-0 bg-transparent border-none p-0"
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
    >
      {effects.has('aura-glow') && (
        <span className="mage-sigil-aura-glow" style={{ '--sigil-size': `${size}px` }} />
      )}
      {effects.has('moon-ring') && (
        <span className="mage-sigil-moon-ring" style={{ '--sigil-size': `${size}px` }} />
      )}
      {showFallback && <span className="mage-sigil-fallback-ring" style={{ '--sigil-size': `${size}px` }} />}

      <span
        className="rounded-full grid place-items-center text-navy-deep relative z-10"
        style={{
          width: size * 0.86,
          height: size * 0.86,
          fontSize: size * 0.42,
          background: 'radial-gradient(circle at 35% 30%, var(--color-gold-light), var(--color-gold) 70%)',
          boxShadow: '0 0 22px rgba(201,150,46,.3)',
        }}
      >
        {glyph}
      </span>
    </Tag>
  )
}
