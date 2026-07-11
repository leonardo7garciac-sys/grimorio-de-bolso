import { useMemo } from 'react'

const MOON_PHASE_COUNT = 8

function moonDots(cx, cy, rx, ry) {
  return Array.from({ length: MOON_PHASE_COUNT }, (_, i) => {
    const angle = (i / MOON_PHASE_COUNT) * Math.PI * 2
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      lit: i % 2 === 0,
    }
  })
}

// Silhueta translúcida de mago: contornos dourados sobre navy, sem preenchimento
// sólido — a "aparência de corpo astral" vem do fill semitransparente e do stroke fino.
export default function AvatarEtereo({ glyph, weapon, relic, weaponUrl, relicUrl, hasAura, hasMoonRing }) {
  const dots = useMemo(() => moonDots(80, 130, 92, 138), [])

  return (
    <div className="relative mx-auto" style={{ width: 200, height: 320 }}>
      {hasAura && <div className="avatar-aura-glow" />}

      <div
        className="absolute avatar-glyph-float text-xl text-gold"
        style={{ left: '50%', top: '-4%', transform: 'translateX(-50%)' }}
      >
        {glyph}
      </div>

      <svg viewBox="0 0 200 320" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="etherealFill" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#c9962e" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#c9962e" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        {hasMoonRing && (
          <g className="avatar-moon-ring-group">
            <ellipse cx="80" cy="130" rx="92" ry="138" fill="none" stroke="rgba(232,227,211,.3)" strokeWidth="1" />
            {dots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r="4"
                fill={d.lit ? '#e8e3d3' : '#060814'}
                stroke="rgba(232,227,211,.4)"
                strokeWidth="0.5"
              />
            ))}
          </g>
        )}

        <g stroke="#c9962e" strokeOpacity="0.55" strokeWidth="1.5" fill="url(#etherealFill)">
          <path d="M70,40 Q80,10 90,40" />
          <circle cx="80" cy="46" r="26" />
          <path d="M58,72 C40,112 26,170 20,250 L140,250 C134,170 120,112 102,72 C94,86 66,86 58,72 Z" />
          <path d="M52,96 C34,124 26,150 30,182" fill="none" />
          <path d="M108,96 C126,124 134,150 130,182" fill="none" />
        </g>
      </svg>

      {relic && (
        <div
          className="absolute grid place-items-center"
          style={{ left: '50%', top: '39%', transform: 'translate(-50%, -50%)' }}
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
          style={{ left: '65%', top: '58%', transform: 'translate(-50%, -50%)' }}
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
    </div>
  )
}
