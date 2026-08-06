// Geração pura (sem React) dos glifos do Sigilizador. Os dois métodos
// abaixo -- Roda Alfabética e Quadrado Mágico (kamea) -- convertem o
// intento numa sequência de pontos e usam o mesmo traçador: início em
// círculo pequeno, fim em barra perpendicular à última direção
// percorrida, e repetição consecutiva (a sequência volta ao mesmo
// ponto) marcada com um pequeno laço ao lado.
export const VIEWBOX_SIZE = 200
const CENTER = VIEWBOX_SIZE / 2

const STROKE_WIDTH = 2.6
const START_MARK_SIZE = 5
const END_MARK_SIZE = 9
const LOOP_MARK_SIZE = 4
// var(--color-gold) fixo em texto: o SVG salvo/baixado viaja sem o CSS do app.
const STROKE_COLOR = '#c9962e'

const WHEEL_RADIUS = 78 // roda alfabética: raio do círculo das 26 letras
export const KAMEA_GRID_SIZE = 160 // lado do quadrado do kamea, dentro do viewBox

const DIACRITIC_RANGE_START = 0x0300
const DIACRITIC_RANGE_END = 0x036f

export function normalizeIntent(text) {
  const noDiacritics = text
    .toUpperCase()
    .normalize('NFD')
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0)
      return code < DIACRITIC_RANGE_START || code > DIACRITIC_RANGE_END
    })
    .join('')
  return noDiacritics.replace(/[^A-Z]/g, '')
}

function samePoint(a, b) {
  return a.x === b.x && a.y === b.y
}

function traceGlyph(points) {
  if (points.length === 0) return ''
  const parts = []

  if (points.length >= 2) {
    const attr = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
    parts.push(
      `<polyline points="${attr}" fill="none" stroke="${STROKE_COLOR}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round" />`
    )
  }

  // Repetição consecutiva: a sequência volta ao mesmo ponto logo em
  // seguida (o segmento entre eles teria comprimento zero, invisível)
  // -- vira um pequeno laço ao lado, perpendicular ao trecho anterior.
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const cur = points[i]
    if (!samePoint(prev, cur)) continue
    const before = i >= 2 ? points[i - 2] : null
    let dx = before ? cur.x - before.x : 1
    let dy = before ? cur.y - before.y : 0
    if (dx === 0 && dy === 0) {
      dx = 1
      dy = 0
    }
    const len = Math.hypot(dx, dy)
    const lx = cur.x + (-dy / len) * LOOP_MARK_SIZE * 1.4
    const ly = cur.y + (dx / len) * LOOP_MARK_SIZE * 1.4
    parts.push(
      `<circle cx="${lx.toFixed(2)}" cy="${ly.toFixed(2)}" r="${LOOP_MARK_SIZE}" fill="none" stroke="${STROKE_COLOR}" stroke-width="${STROKE_WIDTH}" />`
    )
  }

  const start = points[0]
  parts.push(
    `<circle cx="${start.x.toFixed(2)}" cy="${start.y.toFixed(2)}" r="${START_MARK_SIZE}" fill="none" stroke="${STROKE_COLOR}" stroke-width="${STROKE_WIDTH}" />`
  )

  if (points.length >= 2) {
    const end = points[points.length - 1]
    let refIndex = points.length - 2
    while (refIndex > 0 && samePoint(points[refIndex], end)) {
      refIndex--
    }
    const ref = points[refIndex]
    let dx = end.x - ref.x
    let dy = end.y - ref.y
    if (dx === 0 && dy === 0) {
      dx = 1
      dy = 0
    }
    const len = Math.hypot(dx, dy)
    const px = (-dy / len) * (END_MARK_SIZE / 2)
    const py = (dx / len) * (END_MARK_SIZE / 2)
    parts.push(
      `<line x1="${(end.x - px).toFixed(2)}" y1="${(end.y - py).toFixed(2)}" x2="${(end.x + px).toFixed(2)}" y2="${(end.y + py).toFixed(2)}" stroke="${STROKE_COLOR}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" />`
    )
  }

  return parts.join('')
}

function wrapSvg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}">${inner}</svg>`
}

function letterWheelPoint(index) {
  const angle = ((-90 + index * (360 / 26)) * Math.PI) / 180
  return {
    x: CENTER + WHEEL_RADIUS * Math.cos(angle),
    y: CENTER + WHEEL_RADIUS * Math.sin(angle),
  }
}

export function buildRodaSvg(letters) {
  if (!letters) return null
  const points = letters.split('').map((ch) => letterWheelPoint(ch.charCodeAt(0) - 65))
  return wrapSvg(traceGlyph(points))
}

// Quadrados mágicos fixos de Agrippa, um por planeta, do menor (Saturno
// 3x3) ao maior (Lua 9x9). Cada quadrado soma o mesmo valor (a magic
// constant n·(n²+1)/2) em toda linha, coluna e as duas diagonais.
export const KAMEA_PLANETS = [
  {
    id: 'saturno',
    label: 'Saturno',
    square: [
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6],
    ],
  },
  {
    id: 'jupiter',
    label: 'Júpiter',
    square: [
      [4, 14, 15, 1],
      [9, 7, 6, 12],
      [5, 11, 10, 8],
      [16, 2, 3, 13],
    ],
  },
  {
    id: 'marte',
    label: 'Marte',
    square: [
      [11, 24, 7, 20, 3],
      [4, 12, 25, 8, 16],
      [17, 5, 13, 21, 9],
      [10, 18, 1, 14, 22],
      [23, 6, 19, 2, 15],
    ],
  },
  {
    id: 'sol',
    label: 'Sol',
    square: [
      [6, 32, 3, 34, 35, 1],
      [7, 11, 27, 28, 8, 30],
      [19, 14, 16, 15, 23, 24],
      [18, 20, 22, 21, 17, 13],
      [25, 29, 10, 9, 26, 12],
      [36, 5, 33, 4, 2, 31],
    ],
  },
  {
    id: 'venus',
    label: 'Vênus',
    square: [
      [22, 47, 16, 41, 10, 35, 4],
      [5, 23, 48, 17, 42, 11, 29],
      [30, 6, 24, 49, 18, 36, 12],
      [13, 31, 7, 25, 43, 19, 37],
      [38, 14, 32, 1, 26, 44, 20],
      [21, 39, 8, 33, 2, 27, 45],
      [46, 15, 40, 9, 34, 3, 28],
    ],
  },
  {
    id: 'mercurio',
    label: 'Mercúrio',
    square: [
      [8, 58, 59, 5, 4, 62, 63, 1],
      [49, 15, 14, 52, 53, 11, 10, 56],
      [41, 23, 22, 44, 45, 19, 18, 48],
      [32, 34, 35, 29, 28, 38, 39, 25],
      [40, 26, 27, 37, 36, 30, 31, 33],
      [17, 47, 46, 20, 21, 43, 42, 24],
      [9, 55, 54, 12, 13, 51, 50, 16],
      [64, 2, 3, 61, 60, 6, 7, 57],
    ],
  },
  {
    id: 'lua',
    label: 'Lua',
    square: [
      [37, 78, 29, 70, 21, 62, 13, 54, 5],
      [6, 38, 79, 30, 71, 22, 63, 14, 46],
      [47, 7, 39, 80, 31, 72, 23, 55, 15],
      [16, 48, 8, 40, 81, 32, 64, 24, 56],
      [57, 17, 49, 9, 41, 73, 33, 65, 25],
      [26, 58, 18, 50, 1, 42, 74, 34, 66],
      [67, 27, 59, 10, 51, 2, 43, 75, 35],
      [36, 68, 19, 60, 11, 52, 3, 44, 76],
      [77, 28, 69, 20, 61, 12, 53, 4, 45],
    ],
  },
]

function reduceToMax(value, max) {
  let n = value
  while (n > max) {
    n = String(n)
      .split('')
      .reduce((sum, d) => sum + Number(d), 0)
  }
  return n
}

function kameaCellCenter(row, col, n) {
  const margin = (VIEWBOX_SIZE - KAMEA_GRID_SIZE) / 2
  const cell = KAMEA_GRID_SIZE / n
  return { x: margin + cell * (col + 0.5), y: margin + cell * (row + 0.5) }
}

// A=1 ... Z=26, reduzido por soma de dígitos só quando o valor passa do
// maior número do quadrado escolhido (nos quadrados a partir do Sol,
// 26 já cabe, então nunca reduz).
export function buildKameaSvg(letters, square) {
  if (!letters) return null
  const n = square.length
  const max = n * n
  const lookup = new Map()
  square.forEach((row, r) => row.forEach((value, c) => lookup.set(value, { r, c })))

  const points = letters.split('').map((ch) => {
    const raw = ch.charCodeAt(0) - 64
    const value = reduceToMax(raw, max)
    const cell = lookup.get(value)
    return kameaCellCenter(cell.r, cell.c, n)
  })

  return wrapSvg(traceGlyph(points))
}

// Linhas da grade do quadrado, pro preview mostrar de onde o traçado
// saiu -- não entra no SVG salvo, só no que aparece em tela.
export function kameaGridLines(n) {
  const margin = (VIEWBOX_SIZE - KAMEA_GRID_SIZE) / 2
  const cell = KAMEA_GRID_SIZE / n
  const lines = []
  for (let i = 0; i <= n; i++) {
    const pos = margin + cell * i
    lines.push({ x1: margin, y1: pos, x2: margin + KAMEA_GRID_SIZE, y2: pos })
    lines.push({ x1: pos, y1: margin, x2: pos, y2: margin + KAMEA_GRID_SIZE })
  }
  return lines
}

// Método de Spare -- alfabeto vetorial próprio, desenhado à mão como
// traços retos num grid local (4 largura x 6 altura). Cada letra vira
// sempre um <path> com transform, nunca um <text>: assim o glifo nunca
// depende de nenhuma fonte existir no aparelho de quem abrir depois.
export const SPARE_GLYPH_WIDTH = 4
export const SPARE_GLYPH_HEIGHT = 6

const SPARE_BASE_SCALE = 13 // tamanho "natural" (escala 1) de uma letra, em unidades do viewBox
const SPARE_ROTATION_JITTER = 40 // graus, +/-, do arranjo inicial
const SPARE_SCALE_MIN = 0.8
const SPARE_SCALE_MAX = 1.3
const SPARE_POSITION_JITTER = 14 // unidades do viewBox, +/-, do arranjo inicial

const SPARE_LETTER_STROKES = {
  A: [
    [[0, 6], [2, 0], [4, 6]],
    [[0.8, 3.8], [3.2, 3.8]],
  ],
  B: [
    [[0, 0], [0, 6]],
    [[0, 0], [2.6, 0], [3.2, 1], [3.2, 2.6], [2.6, 3], [0, 3]],
    [[0, 3], [2.8, 3], [3.4, 4], [3.4, 5], [2.8, 6], [0, 6]],
  ],
  C: [[[3.6, 1.2], [2.6, 0], [1.4, 0], [0.2, 1.2], [0.2, 4.8], [1.4, 6], [2.6, 6], [3.6, 4.8]]],
  D: [
    [[0, 0], [0, 6]],
    [[0, 0], [2.4, 0], [3.6, 1.5], [3.6, 4.5], [2.4, 6], [0, 6]],
  ],
  E: [
    [[4, 0], [0, 0], [0, 6], [4, 6]],
    [[0, 3], [3, 3]],
  ],
  F: [
    [[0, 6], [0, 0], [4, 0]],
    [[0, 3], [3, 3]],
  ],
  G: [[[3.6, 1.2], [2.6, 0], [1.4, 0], [0.2, 1.2], [0.2, 4.8], [1.4, 6], [2.6, 6], [3.6, 4.8], [3.6, 3.4], [2.2, 3.4]]],
  H: [
    [[0, 0], [0, 6]],
    [[4, 0], [4, 6]],
    [[0, 3], [4, 3]],
  ],
  I: [
    [[0, 0], [4, 0]],
    [[2, 0], [2, 6]],
    [[0, 6], [4, 6]],
  ],
  J: [[[3.2, 0], [3.2, 4.6], [2.4, 6], [1, 6], [0.2, 4.8]]],
  K: [
    [[0, 0], [0, 6]],
    [[3.6, 0], [0, 3], [3.6, 6]],
  ],
  L: [[[0, 0], [0, 6], [4, 6]]],
  M: [[[0, 6], [0, 0], [2, 3.2], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  O: [[[1.4, 0], [2.6, 0], [3.8, 1.4], [3.8, 4.6], [2.6, 6], [1.4, 6], [0.2, 4.6], [0.2, 1.4], [1.4, 0]]],
  P: [
    [[0, 6], [0, 0]],
    [[0, 0], [2.8, 0], [3.6, 1.2], [3.6, 2.8], [2.8, 4], [0, 4]],
  ],
  Q: [
    [[1.4, 0], [2.6, 0], [3.8, 1.4], [3.8, 4.6], [2.6, 6], [1.4, 6], [0.2, 4.6], [0.2, 1.4], [1.4, 0]],
    [[2.4, 4.6], [4.2, 6.6]],
  ],
  R: [
    [[0, 6], [0, 0]],
    [[0, 0], [2.8, 0], [3.6, 1.2], [3.6, 2.8], [2.8, 4], [0, 4]],
    [[1.6, 4], [3.8, 6]],
  ],
  S: [[[3.6, 1.2], [2.6, 0], [1, 0], [0.2, 1], [0.2, 2.2], [1, 3], [3, 3], [3.8, 3.8], [3.8, 5], [3, 6], [1.4, 6], [0.4, 4.8]]],
  T: [
    [[0, 0], [4, 0]],
    [[2, 0], [2, 6]],
  ],
  U: [[[0, 0], [0, 4.6], [1.4, 6], [2.6, 6], [3.8, 4.6], [3.8, 0]]],
  V: [[[0, 0], [2, 6], [4, 0]]],
  W: [[[0, 0], [1, 6], [2, 2.5], [3, 6], [4, 0]]],
  X: [
    [[0, 0], [4, 6]],
    [[4, 0], [0, 6]],
  ],
  Y: [
    [[0, 0], [2, 3.2], [2, 6]],
    [[4, 0], [2, 3.2]],
  ],
  Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
}

const SPARE_LETTER_PATHS = Object.fromEntries(
  Object.entries(SPARE_LETTER_STROKES).map(([ch, strokes]) => [
    ch,
    strokes.map((pts) => 'M ' + pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L ')).join(' '),
  ])
)

export function sparePathD(char) {
  return SPARE_LETTER_PATHS[char] ?? ''
}

// Mantém só a primeira ocorrência de cada letra, na ordem em que
// aparecem -- etapa própria do método, mostrada ao usuário antes da
// composição.
export function dedupeLetters(letters) {
  const seen = new Set()
  let result = ''
  for (const ch of letters) {
    if (seen.has(ch)) continue
    seen.add(ch)
    result += ch
  }
  return result
}

// Arranjo inicial: letras sobrepostas perto do centro, com variação de
// rotação e escala -- ponto de partida estético, não determinístico,
// que o usuário refina arrastando/girando/redimensionando/espelhando.
export function randomSpareLayout(letters) {
  return letters.split('').map((char, i) => ({
    id: `${char}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    char,
    x: CENTER + (Math.random() * 2 - 1) * SPARE_POSITION_JITTER,
    y: CENTER + (Math.random() * 2 - 1) * SPARE_POSITION_JITTER,
    rotation: Math.round((Math.random() * 2 - 1) * SPARE_ROTATION_JITTER),
    scale: SPARE_SCALE_MIN + Math.random() * (SPARE_SCALE_MAX - SPARE_SCALE_MIN),
    flipX: false,
  }))
}

// scale é relativo (1 = tamanho natural); SPARE_BASE_SCALE converte pro
// tamanho absoluto em unidades do viewBox. Espelhar inverte só o eixo x.
export function spareLetterTransform({ x, y, rotation, scale, flipX }) {
  const s = scale * SPARE_BASE_SCALE
  const sx = flipX ? -s : s
  return `translate(${x.toFixed(2)},${y.toFixed(2)}) rotate(${rotation}) scale(${sx.toFixed(3)},${s.toFixed(3)}) translate(${-SPARE_GLYPH_WIDTH / 2},${-SPARE_GLYPH_HEIGHT / 2})`
}

// Achata o arranjo atual num SVG final: cada letra é um <path> (nunca
// <text>) com o traço fixo do alfabeto próprio e o transform da pose
// escolhida. vector-effect mantém a espessura do traço constante mesmo
// as letras sendo escaladas por transform.
export function buildSpareSvg(instances) {
  if (!instances || instances.length === 0) return null
  const paths = instances
    .map((inst) => {
      const d = sparePathD(inst.char)
      if (!d) return ''
      return `<path d="${d}" transform="${spareLetterTransform(inst)}" vector-effect="non-scaling-stroke" fill="none" stroke="${STROKE_COLOR}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round" />`
    })
    .join('')
  return wrapSvg(paths)
}
