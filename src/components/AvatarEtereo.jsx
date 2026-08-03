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
// que faz sentido pra forma típica do item (ex.: mao é 'height' porque
// os itens empunhados são altos e estreitos).
//
// `grip`: ponto do sprite que encosta no âncora (left/top) E pivô da
// rotação (CSS transform-origin) — o mesmo ponto serve pras duas
// coisas. É uma % da ALTURA do próprio sprite, de cima pra baixo: 0 =
// topo, 50 = centro, 100 = base. X fica sempre centralizado (50%). Um
// item pode fugir à regra do slot — ver ITEM_OVERRIDE abaixo.
//
// `zIndex`: empilhamento explícito entre slots "front" — a mão (item
// empunhado) sempre por cima de peito/cintura, já que ela pode ocupar
// parte do mesmo espaço visual. `slot`: identifica o slot pro próprio
// AnchoredItem (ex.: decidir se desenha a sombra de grip).
const SLOT_ANCHORS = {
  mao: { slot: 'mao', left: '66%', top: '71%', rotate: -18, layer: 'front', grip: 100, sizeAxis: 'height', size: 34, zIndex: 3 },
  peito: { slot: 'peito', left: '50%', top: '60%', rotate: 0, layer: 'front', grip: 50, sizeAxis: 'height', size: 14, zIndex: 2 },
  // Corda (primeira peça de cintura com arte real): 1056x873, proporção
  // 1,21 -- larga, ao contrário de todas as outras (altas e estreitas).
  // Ainda assim medida por altura, como o resto, pra manter a mesma
  // convenção de escala entre slots; 30% de altura vira uns 36% de
  // largura, o bastante pra acompanhar o tronco sem passar das mangas.
  // grip 62 (em vez do centro, 50): o ponto que encosta no âncora é o
  // NÓ da corda, não o centro geométrico do sprite -- é o que faz o
  // top abaixo significar "onde fica o nó". Ainda ponto de partida, não
  // calibração visual final.
  cintura: { slot: 'cintura', left: '50%', top: '93%', rotate: 0, layer: 'front', grip: 62, sizeAxis: 'height', size: 30, zIndex: 2 },
  atras_cabeca: { slot: 'atras_cabeca', left: '50%', top: '16%', rotate: 0, layer: 'behind', grip: 50, sizeAxis: 'height', size: 22, zIndex: 1 },
}
const FALLBACK_ANCHOR = SLOT_ANCHORS.peito

// O slot "mao" tem posição única (lado direito da tela); a mão esquerda usa
// o espelho dessa posição em torno do centro (50%), calculado aqui em vez
// de guardado como um segundo âncora fixo, pra não desalinhar se o left/top
// de "mao" mudar no futuro. Só faz sentido espelhar quando o slot é "mao" —
// os demais não têm variação por mão.
function resolveAnchor(base, hand) {
  if (base.slot === 'mao' && hand === 'mao_esquerda') {
    return { ...base, left: `${100 - parseFloat(base.left)}%` }
  }
  return base
}

// Exceções por item ao padrão do próprio slot (grip, size, rotate,
// filter e/ou flipX). Hoje:
//  - athame e varinha: a arte tem pomo/remate abaixo da empunhadura,
//    então o punho real fica um pouco acima da base do sprite — a
//    proporção varia por item, por isso o valor é por slug, não pelo
//    slot "mao" inteiro.
//  - turíbulo: pende de uma corrente segurada pela mão, então gira a
//    partir de perto do topo, não da base; rotate 0 porque, pendurado,
//    fica a prumo — herdar o -18 do slot varreria o corpo do incensário
//    para o lado.
//  - cajado e cálice: tamanho de "mao" (34% de altura) não serve pra
//    eles — o cajado é bem mais alto, o cálice bem menor.
//  - filter: CSS filter aplicado só na imagem do item (não na sombra do
//    grip), pra ajuste pontual de cor/brilho por peça.
//  - flipX: espelhamento horizontal fixo do sprite (troca base/ponta),
//    independente do espelhamento por mão do avatar — os dois fatores
//    multiplicam (ver scaleXFactor em AnchoredItem), não se substituem.
//  - offsetX: pontos percentuais do palco somados ao left do slot, fora
//    da string de transform — desloca sempre na horizontal da TELA,
//    sem herdar o rotate/scaleX do próprio item.
// Itens de mão sem entrada aqui (ou sem o campo específico) usam o
// padrão do slot (grip 100, rotate -18 — comportamento de antes desta
// exceção existir).
const ITEM_OVERRIDE = {
  'athame-de-obsidiana': { grip: 78, size: 39, offsetX: 2 },
  // flipX + rotate: scaleX é aplicado antes do rotate (ordem da lista em
  // transform, da direita pra esquerda sobre o ponto), então rotacionar
  // o sprite já espelhado por +r equivale a rotacionar o original por -r
  // e espelhar o resultado inteiro -- as duas inversões se cancelam, e a
  // convenção do slot (positivo = ponta pra direita) continua valendo.
  'varinha-de-amendoeira-branca': { grip: 82, flipX: true, rotate: 3, offsetX: -2 },
  'turibulo-do-incenso-eterno': { grip: 20, rotate: 0 },
  'cajado-do-carvalho-antigo': { size: 45 },
  'calice-de-mercurio': { size: 24, grip: 68, filter: 'saturate(1.35) brightness(1.12)', offsetX: 2 },
  'pentaculo-de-salomao': { filter: 'saturate(1.4) brightness(1.25)' },
}

const ITEM_GLYPH_FALLBACK = { arma_magica: '🗡', item_encantado: '🜏' }

// Sombra de "mão sobre o item": faixa escura que acompanha o contorno do
// item (mask-image no próprio sprite, então só pinta em cima de pixel
// opaco) centrada no grip -- o mesmo ponto onde a mão do avatar encosta.
// Só faz sentido no slot "mao" -- peito/cintura/atrás da cabeça não têm
// mão cobrindo a peça. Largura em % da altura do sprite: a mão ocupa
// ~10% do palco contra 34% do item de mão, por isso ~30% cobre o que a
// mão de fato tapa sem escurecer a peça inteira. Os stops podem cair
// fora de 0-100% (ex.: turíbulo com grip perto do topo) -- o navegador
// simplesmente corta o gradiente no limite da caixa, sem precisar de
// caso especial aqui.
const GRIP_SHADOW_HEIGHT_PCT = 60
const GRIP_SHADOW_INTENSITY = 1

function gripShadowGradient(grip, bandPct) {
  const half = bandPct / 2
  return `linear-gradient(to bottom, transparent ${grip - half}%, rgba(0,0,0,${GRIP_SHADOW_INTENSITY}) ${grip}%, transparent ${grip + half}%)`
}

// Recorte do slot "cintura": o trecho de corda que passa atrás do
// corpo não fica na sombra, ele SOME -- o corpo está na frente de
// verdade, então desenhar essa parte por cima do avatar (mesmo
// escurecida) sempre ia denunciar a sobreposição. Duas máscaras em
// degradê -- uma lateral (soma as pontas da corda que desaparecem
// atrás das mangas) e uma superior (soma o arco que desaparece atrás
// do tronco, acima da linha do nó) -- compostas por interseção com o
// mask-image da própria imagem (mask-composite: intersect): só fica
// visível o que é opaco no sprite E está dentro da faixa central E
// está abaixo da linha do nó, as três condições ao mesmo tempo.
const WAIST_CLIP_SIDES = 0.78 // fração da largura preservada (opaca) no centro
const WAIST_CLIP_TOP = 0.4 // fração da altura do sprite a partir de onde passa a aparecer
const WAIST_CLIP_SOFTNESS_PCT = 6 // largura da transição suave de cada corte, em pontos percentuais

function waistSideClipGradient() {
  const half = (WAIST_CLIP_SIDES * 100) / 2
  const innerStart = 50 - half
  const innerEnd = 50 + half
  return `linear-gradient(to right, transparent ${innerStart - WAIST_CLIP_SOFTNESS_PCT}%, black ${innerStart}%, black ${innerEnd}%, transparent ${innerEnd + WAIST_CLIP_SOFTNESS_PCT}%)`
}

function waistTopClipGradient() {
  const startPct = WAIST_CLIP_TOP * 100
  return `linear-gradient(to bottom, transparent ${startPct - WAIST_CLIP_SOFTNESS_PCT}%, black ${startPct}%)`
}

// Halo dourado dos itens: no slot "mao" ele é reduzido (metade do blur e
// da opacidade, tunável em HAND_ITEM_GLOW_SCALE) -- no valor cheio o halo
// empurra a peça pra frente e briga com o efeito de estar sendo segurada.
// Outros slots mantêm o brilho original.
const ITEM_GLOW_BLUR_PX = 6
const ITEM_GLOW_ALPHA = 0.6
const HAND_ITEM_GLOW_SCALE = 0.5

function itemGlowFilter(isHandSlot) {
  const scale = isHandSlot ? HAND_ITEM_GLOW_SCALE : 1
  return `drop-shadow(0 0 ${ITEM_GLOW_BLUR_PX * scale}px rgba(201,150,46,${ITEM_GLOW_ALPHA * scale}))`
}

// Camada de "dedos por cima do item": segunda cópia da imagem do avatar,
// com mix-blend-mode: screen (só os filamentos claros pintam -- o fundo
// escuro do avatar some) e recortada por um mask-image radial-gradient
// centrado no âncora da mão. Raio e suavidade tunáveis abaixo; ambos em
// % do palco, que é sempre quadrado (aspectRatio 1/1), então % de
// largura e de altura valem o mesmo raio físico nos dois eixos.
const HAND_OVERLAY_RADIUS_PCT = 9
const HAND_OVERLAY_EDGE_SOFTNESS_PCT = 5

function handOverlayMask(anchor) {
  const inner = Math.max(HAND_OVERLAY_RADIUS_PCT - HAND_OVERLAY_EDGE_SOFTNESS_PCT, 0)
  return `radial-gradient(circle at ${anchor.left} ${anchor.top}, black 0%, black ${inner}%, transparent ${HAND_OVERLAY_RADIUS_PCT}%)`
}

// Identidade de um item desenhado é slot + mão, não só o slug -- dois itens
// diferentes podem ocupar o mesmo slot 'mao' ao mesmo tempo (um por mão).
// item.id (chave real de shop_items) é preferido ao slug por segurança.
function itemKey(item) {
  return `${item.id ?? item.slug ?? item.name}-${item.hand ?? 'x'}`
}

function AnchoredItem({ item, url, anchor }) {
  const override = ITEM_OVERRIDE[item.slug] ?? {}
  const grip = override.grip ?? anchor.grip ?? 50
  const size = override.size ?? anchor.size
  // Espelhamento por mão do avatar e espelhamento fixo do override (troca
  // base/ponta do sprite) são fatores independentes -- multiplicam, não se
  // substituem, então os dois ativos ao mesmo tempo se cancelam de volta a 1.
  const handFlip = item.hand === 'mao_esquerda' ? -1 : 1
  const overrideFlip = override.flipX ? -1 : 1
  const scaleXFactor = handFlip * overrideFlip
  // rotate e offsetX são calibrados olhando a mão direita; pra a mão
  // esquerda ser um espelho fiel (não só a imagem invertida no lugar
  // errado), os dois precisam negar junto com a posição -- scaleX(-1) sozinho
  // não basta (Rotate(r)∘ScaleX(-1) = ScaleX(-1)∘Rotate(-r): espelhar a cena
  // sem negar o rotate deixaria o ângulo do lado errado).
  const rotate = (override.rotate ?? anchor.rotate ?? 0) * handFlip
  const offsetX = (override.offsetX ?? 0) * handFlip
  // offsetX soma no left, fora da string de transform -- assim o
  // deslocamento é sempre horizontal na tela, sem herdar rotate/scaleX
  // do próprio item (que giraria/espelharia o deslocamento junto).
  const left = offsetX ? `calc(${anchor.left} + ${offsetX}%)` : anchor.left
  const transformStyle = {
    position: 'absolute',
    left,
    top: anchor.top,
    transform: `translate(-50%, -${grip}%) rotate(${rotate}deg) scaleX(${scaleXFactor})`,
    transformOrigin: `50% ${grip}%`,
    zIndex: anchor.zIndex,
  }

  if (!url) {
    return (
      <span className="text-lg" style={transformStyle}>
        {ITEM_GLYPH_FALLBACK[item.kind] ?? '❖'}
      </span>
    )
  }

  // O wrapper carrega a rotação; a imagem e a sombra são filhas dele, na
  // mesma caixa, então giram e flipam juntas. sizeProp fica em % (mesma
  // conta de antes) e o outro eixo em 'auto' -- só que agora o 'auto' é
  // resolvido pela própria img (elemento substituído, preserva aspecto),
  // e o wrapper (sem tamanho próprio) encolhe exatamente para caber nela.
  const sizeProp = anchor.sizeAxis === 'width' ? 'width' : 'height'
  const otherProp = sizeProp === 'width' ? 'height' : 'width'
  const wrapperStyle = { ...transformStyle, [sizeProp]: `${size}%`, [otherProp]: 'auto' }
  const fillStyle = { [sizeProp]: '100%', [otherProp]: 'auto', display: 'block' }
  const imgFilter = [override.filter, itemGlowFilter(anchor.slot === 'mao')].filter(Boolean).join(' ')
  // Recorte por interseção: cada layer de mask-image só some ONDE seu
  // próprio degradê é transparente -- por isso o sprite entra por
  // último na lista, senão as bordas já recortadas dos degradês
  // "vazariam" pixel do sprite fora delas (mask-composite acumula da
  // esquerda pra direita).
  const waistMaskStyle =
    anchor.slot === 'cintura'
      ? {
          WebkitMaskImage: `${waistSideClipGradient()}, ${waistTopClipGradient()}, url(${url})`,
          maskImage: `${waistSideClipGradient()}, ${waistTopClipGradient()}, url(${url})`,
          WebkitMaskComposite: 'source-in',
          maskComposite: 'intersect',
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }
      : {}

  return (
    <div style={wrapperStyle}>
      <img
        src={url}
        alt={item.name}
        className="object-contain rounded"
        style={{ ...fillStyle, filter: imgFilter, ...waistMaskStyle }}
      />
      {anchor.slot === 'mao' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: gripShadowGradient(grip, GRIP_SHADOW_HEIGHT_PCT),
            WebkitMaskImage: `url(${url})`,
            maskImage: `url(${url})`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          }}
        />
      )}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────
// Palco quadrado: a imagem base ocupa ~80% da largura, deixando 20% de
// margem para a órbita (anel de cosméticos), que usa 100% do palco e por
// isso precisa desse respiro para não ser cortada.
export default function AvatarEtereo({ glyph, items = [], hasAura, hasMoonRing }) {
  const phase = useOrbitPhase(hasMoonRing)
  const dots = useOrbitDots(phase)

  const itemsWithAnchor = items.map((entry) => ({
    ...entry,
    anchor: resolveAnchor(SLOT_ANCHORS[entry.item?.slot] ?? FALLBACK_ANCHOR, entry.item?.hand),
  }))
  const behindItems = itemsWithAnchor.filter((entry) => entry.anchor.layer === 'behind')
  const frontItems = itemsWithAnchor.filter((entry) => entry.anchor.layer !== 'behind')
  // Cada item de mão (podem ser até dois, um por mão) ganha sua própria
  // camada de "dedos por cima" -- mascarada no âncora daquele item específico.
  const handItems = frontItems.filter((entry) => entry.anchor.slot === 'mao')

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
      {behindItems.map((entry) => (
        <AnchoredItem key={itemKey(entry.item)} item={entry.item} url={entry.url} anchor={entry.anchor} />
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

      {frontItems.map((entry) => (
        <AnchoredItem key={itemKey(entry.item)} item={entry.item} url={entry.url} anchor={entry.anchor} />
      ))}

      {/* dedos do mago por cima do item empunhado -- acima de tudo, um por mão */}
      {handItems.map((entry) => (
        <div
          key={`dedos-${itemKey(entry.item)}`}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            mixBlendMode: 'screen',
            WebkitMaskImage: handOverlayMask(entry.anchor),
            maskImage: handOverlayMask(entry.anchor),
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          }}
        >
          <img
            src="/avatar-mago.webp"
            alt=""
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '80%',
              height: 'auto',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      ))}

      {hasMoonRing && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          <GuideArc points={GUIDE_SEGMENTS.front} />
          <OrbitDotsLayer dots={dots} front={true} />
        </svg>
      )}
    </div>
  )
}
