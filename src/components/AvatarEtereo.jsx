import { useEffect, useMemo, useState } from 'react'

// ── Anel em órbita elíptica (cosmético "Moldura Lunar") ──────────────────
// Uma elipse achatada e inclinada, centrada no peito. Os pontos que giram
// têm posição real (parametrizada por t) e são separados em duas camadas
// DOM (atrás/na frente da imagem base) pelo sinal da sua coordenada local
// — não por um recorte estático — trocando de camada exatamente ao cruzar
// os extremos laterais da elipse. Tamanho/opacidade seguem a mesma
// profundidade (maiores e mais brilhantes na frente, menores e mais
// apagados atrás).
const ORBIT_CX = 50
const ORBIT_CY = 60
const ORBIT_RX = 48
const ORBIT_RY = 13
const ORBIT_TILT_DEG = -8
const ORBIT_DOT_COUNT = 8
const ORBIT_DURATION_MS = 20000
const ORBIT_TILT_RAD = (ORBIT_TILT_DEG * Math.PI) / 180
const ORBIT_COS_TILT = Math.cos(ORBIT_TILT_RAD)
const ORBIT_SIN_TILT = Math.sin(ORBIT_TILT_RAD)

function tiltPoint(lx, ly) {
  return {
    x: ORBIT_CX + lx * ORBIT_COS_TILT - ly * ORBIT_SIN_TILT,
    y: ORBIT_CY + lx * ORBIT_SIN_TILT + ly * ORBIT_COS_TILT,
  }
}

// Guia estático da elipse (não anima) já separado em arco de trás/frente,
// calculado uma única vez pela mesma fórmula usada nos pontos.
const GUIDE_SEGMENTS = (() => {
  const STEPS = 72
  const points = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = (i / STEPS) * Math.PI * 2
    const { x, y } = tiltPoint(ORBIT_RX * Math.cos(t), ORBIT_RY * Math.sin(t))
    return { x, y, front: Math.sin(t) > 0 }
  })
  return {
    front: points.filter((p) => p.front),
    back: points.filter((p) => !p.front),
  }
})()

function useOrbitPhase(active) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    if (!active) return undefined
    let raf
    const start = performance.now()
    const tick = (now) => {
      setPhase(((now - start) % ORBIT_DURATION_MS) / ORBIT_DURATION_MS)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
  return phase
}

function useOrbitDots(phase) {
  return useMemo(
    () =>
      Array.from({ length: ORBIT_DOT_COUNT }, (_, i) => {
        const t = (i / ORBIT_DOT_COUNT + phase) * Math.PI * 2
        const { x, y } = tiltPoint(ORBIT_RX * Math.cos(t), ORBIT_RY * Math.sin(t))
        const depth = Math.sin(t) // -1 (mais atrás) .. +1 (mais à frente)
        return {
          x,
          y,
          front: depth > 0,
          r: 2.6 + depth * 1,
          opacity: 0.7 + depth * 0.3,
          lit: i % 2 === 0,
        }
      }),
    [phase]
  )
}

function GuideArc({ points }) {
  if (points.length < 2) return null
  return (
    <polyline
      points={points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
      fill="none"
      stroke="rgba(232,227,211,.28)"
      strokeWidth="0.5"
    />
  )
}

function OrbitDotsLayer({ dots, front }) {
  return dots
    .filter((d) => d.front === front)
    .map((d, i) => (
      <circle
        key={i}
        cx={d.x}
        cy={d.y}
        r={d.r}
        opacity={d.opacity}
        fill={d.lit ? '#e8e3d3' : '#060814'}
        stroke="rgba(232,227,211,.4)"
        strokeWidth="0.3"
      />
    ))
}

// ── Anel em círculo (implementação original) ─────────────────────────────
// Preservada sem uso — não é chamada por AvatarEtereo. Um círculo tem raio
// maior que a figura em qualquer ângulo, então nunca cruza o corpo; por
// isso foi substituído acima pela órbita elíptica. Fica disponível aqui
// para reaproveitar em outro cosmético que não precise do cruzamento
// atrás/na frente (ex.: um anel puramente decorativo ao redor da figura).
const CIRCLE_DOT_COUNT = 8

function circleDots(cx, cy, r) {
  return Array.from({ length: CIRCLE_DOT_COUNT }, (_, i) => {
    const angle = (i / CIRCLE_DOT_COUNT) * Math.PI * 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), lit: i % 2 === 0 }
  })
}

function CircleRingHalf({ dots, clipId, clipY }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={clipId}>
          <rect x="-10" y={clipY} width="120" height="60" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g className="avatar-moon-ring-group">
          <ellipse cx="50" cy="50" rx="48" ry="48" fill="none" stroke="rgba(232,227,211,.3)" strokeWidth="0.5" />
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
      </g>
    </svg>
  )
}

export function MoonRingCircle() {
  const dots = useMemo(() => circleDots(50, 50, 48), [])
  return (
    <>
      <CircleRingHalf dots={dots} clipId="moon-ring-circle-back" clipY={-10} />
      <CircleRingHalf dots={dots} clipId="moon-ring-circle-front" clipY={50} />
    </>
  )
}

// ── Slots de equipamento ──────────────────────────────────────────────────
// Único lugar que define onde/como cada slot ancora no avatar. Um item novo
// só precisa do slot certo na linha do catálogo (shop_items.slot) — nada
// aqui muda por item, só por slot.
//
// `layer: 'behind'` desenha antes da imagem base (fica atrás da figura);
// qualquer outro valor desenha depois (na frente).
//
// `sizeAxis` + `size`: tamanho é medida relativa, em % do palco (o mesmo
// palco quadrado de left/top) — nunca px absoluto, senão o item não
// acompanha a tela. `sizeAxis: 'height'` fixa a altura e deixa a largura
// livre (width: auto); `'width'` faz o inverso. Cada slot escolhe o eixo
// que faz sentido pra forma típica do item (ex.: cintura é 'width'
// porque a corda é larga, não alta).
//
// `grip`: ponto do sprite que encosta no âncora (left/top) E pivô da
// rotação (CSS transform-origin) — o mesmo ponto serve pras duas
// coisas. É uma % da ALTURA do próprio sprite, de cima pra baixo: 0 =
// topo, 50 = centro, 100 = base. X fica sempre centralizado (50%). Um
// item pode fugir à regra do slot — ver ITEM_OVERRIDE abaixo.
const SLOT_ANCHORS = {
  mao: { left: '66%', top: '58%', rotate: -18, layer: 'front', grip: 100, sizeAxis: 'height', size: 34 },
  peito: { left: '50%', top: '50%', rotate: 0, layer: 'front', grip: 50, sizeAxis: 'height', size: 18 },
  cintura: { left: '50%', top: '72%', rotate: 0, layer: 'front', grip: 50, sizeAxis: 'width', size: 35 },
  atras_cabeca: { left: '50%', top: '16%', rotate: 0, layer: 'behind', grip: 50, sizeAxis: 'height', size: 22 },
}
const FALLBACK_ANCHOR = SLOT_ANCHORS.peito

// Exceções por item ao padrão do próprio slot (grip, size e/ou rotate).
// Hoje:
//  - athame e varinha: a arte tem pomo/remate abaixo da empunhadura,
//    então o punho real fica um pouco acima da base do sprite — a
//    proporção varia por item, por isso o valor é por slug, não pelo
//    slot "mao" inteiro.
//  - turíbulo: pende de uma corrente segurada pela mão, então gira a
//    partir do topo (grip 0), não da base.
//  - cajado e cálice: tamanho de "mao" (34% de altura) não serve pra
//    eles — o cajado é bem mais alto, o cálice bem menor.
// Itens de mão sem entrada aqui (ou sem o campo específico) usam o
// padrão do slot (grip 100, rotate -18 — comportamento de antes desta
// exceção existir).
const ITEM_OVERRIDE = {
  'athame-de-obsidiana': { grip: 46 },
  'varinha-de-amendoeira-branca': { grip: 50 },
  'turibulo-do-incenso-eterno': { grip: 0 },
  'cajado-do-carvalho-antigo': { size: 45 },
  'calice-de-mercurio': { size: 15 },
}

const ITEM_GLYPH_FALLBACK = { arma_magica: '🗡', item_encantado: '🜏' }

function AnchoredItem({ item, url, anchor }) {
  const override = ITEM_OVERRIDE[item.slug] ?? {}
  const grip = override.grip ?? anchor.grip ?? 50
  const size = override.size ?? anchor.size
  const rotate = override.rotate ?? anchor.rotate ?? 0
  const flip = item.hand === 'mao_esquerda'
  const boxSize =
    anchor.sizeAxis === 'width' ? { width: `${size}%`, height: 'auto' } : { height: `${size}%`, width: 'auto' }
  const positionStyle = {
    position: 'absolute',
    left: anchor.left,
    top: anchor.top,
    transform: `translate(-50%, -${grip}%) rotate(${rotate}deg) scaleX(${flip ? -1 : 1})`,
    transformOrigin: `50% ${grip}%`,
    filter: 'drop-shadow(0 0 6px rgba(201,150,46,.6))',
  }

  if (!url) {
    return (
      <span className="text-lg" style={positionStyle}>
        {ITEM_GLYPH_FALLBACK[item.kind] ?? '❖'}
      </span>
    )
  }

  return <img src={url} alt={item.name} className="object-contain rounded" style={{ ...positionStyle, ...boxSize }} />
}

// ── Avatar ────────────────────────────────────────────────────────────────
// Palco quadrado: a imagem base ocupa ~80% da largura, deixando 20% de
// margem para a órbita (anel de cosméticos), que usa 100% do palco e por
// isso precisa desse respiro para não ser cortada.
export default function AvatarEtereo({ glyph, weapon, relics = [], weaponUrl, hasAura, hasMoonRing }) {
  const phase = useOrbitPhase(hasMoonRing)
  const dots = useOrbitDots(phase)

  const weaponAnchor = SLOT_ANCHORS[weapon?.slot] ?? SLOT_ANCHORS.mao
  const relicsWithAnchor = relics.map((r) => ({ ...r, anchor: SLOT_ANCHORS[r.item?.slot] ?? FALLBACK_ANCHOR }))
  const behindRelics = relicsWithAnchor.filter((r) => r.anchor.layer === 'behind')
  const frontRelics = relicsWithAnchor.filter((r) => r.anchor.layer !== 'behind')

  return (
    <div
      className="relative mx-auto"
      style={{ width: 'min(92vw, 460px)', aspectRatio: '1 / 1', overflow: 'visible' }}
    >
      {hasMoonRing && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          <GuideArc points={GUIDE_SEGMENTS.back} />
          <OrbitDotsLayer dots={dots} front={false} />
        </svg>
      )}

      {/* itens de slot "behind" (ex.: atras_cabeca) — atrás da imagem base */}
      {behindRelics.map((r) => (
        <AnchoredItem key={r.item.slug ?? r.item.name} item={r.item} url={r.url} anchor={r.anchor} />
      ))}

      {/* base: imagem do mago (fundo transparente, composta normalmente) */}
      <img
        src="/avatar-mago.webp"
        alt=""
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          width: '80%',
          height: 'auto',
          transform: 'translate(-50%, -50%)',
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

      {frontRelics.map((r) => (
        <AnchoredItem key={r.item.slug ?? r.item.name} item={r.item} url={r.url} anchor={r.anchor} />
      ))}

      {weapon && <AnchoredItem item={weapon} url={weaponUrl} anchor={weaponAnchor} />}

      {hasMoonRing && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          <GuideArc points={GUIDE_SEGMENTS.front} />
          <OrbitDotsLayer dots={dots} front={true} />
        </svg>
      )}
    </div>
  )
}
