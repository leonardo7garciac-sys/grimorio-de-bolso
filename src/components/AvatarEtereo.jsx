import { useMemo } from 'react'

const MOON_PHASE_COUNT = 8

function moonDots(cx, cy, r) {
  return Array.from({ length: MOON_PHASE_COUNT }, (_, i) => {
    const angle = (i / MOON_PHASE_COUNT) * Math.PI * 2
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lit: i % 2 === 0,
    }
  })
}

// Palco quadrado: a imagem base ocupa ~78% da largura, deixando 22% de
// margem para a órbita (anel de cosméticos), que usa 100% do palco e por
// isso precisa desse respiro para não ser cortada.
export default function AvatarEtereo({ glyph, weapon, relic, weaponUrl, relicUrl, hasAura, hasMoonRing }) {
  const dots = useMemo(() => moonDots(50, 50, 47), [])

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 260, aspectRatio: '1 / 1', overflow: 'visible' }}>
      {/* base: imagem do mago */}
      <img
        src="/avatar-mago.webp"
        alt=""
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          width: '78%',
          height: 'auto',
          transform: 'translate(-50%, -50%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* efeitos sobrepostos: exatamente como funcionam hoje */}
      {hasAura && <div className="avatar-aura-glow" />}

      <div
        className="absolute avatar-glyph-float text-xl text-gold"
        style={{ left: '50%', top: '2%', transform: 'translateX(-50%)' }}
      >
        {glyph}
      </div>

      {relic && (
        <div
          className="absolute grid place-items-center"
          style={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}
        >
          {relicUrl ? (
            <img
              src={relicUrl}
              alt={relic.name}
              className="w-8 h-8 object-contain rounded"
              style={{ filter: 'drop-shadow(0 0 6px rgba(201,150,46,.6))' }}
            />
          ) : (
            <span className="text-lg" style={{ filter: 'drop-shadow(0 0 6px rgba(201,150,46,.6))' }}>
              🜏
            </span>
          )}
        </div>
      )}

      {weapon && (
        <div
          className="absolute grid place-items-center"
          style={{ left: '66%', top: '58%', transform: 'translate(-50%, -50%)' }}
        >
          {weaponUrl ? (
            <img
              src={weaponUrl}
              alt={weapon.name}
              className="w-8 h-8 object-contain rounded"
              style={{ filter: 'drop-shadow(0 0 6px rgba(201,150,46,.6))' }}
            />
          ) : (
            <span className="text-lg" style={{ filter: 'drop-shadow(0 0 6px rgba(201,150,46,.6))' }}>
              🗡
            </span>
          )}
        </div>
      )}

      {/* cosméticos orbitais: camada própria a 100% do palco, acima das demais */}
      {hasMoonRing && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          <g className="avatar-moon-ring-group">
            <ellipse cx="50" cy="50" rx="47" ry="47" fill="none" stroke="rgba(232,227,211,.3)" strokeWidth="0.5" />
            {dots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r="2.2"
                fill={d.lit ? '#e8e3d3' : '#060814'}
                stroke="rgba(232,227,211,.4)"
                strokeWidth="0.3"
              />
            ))}
          </g>
        </svg>
      )}
    </div>
  )
}
