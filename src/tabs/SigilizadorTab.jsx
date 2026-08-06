import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, SectionLabel, GoldButton, GhostButton } from '../components/ui'
import {
  VIEWBOX_SIZE,
  KAMEA_PLANETS,
  normalizeIntent,
  buildRodaSvg,
  buildKameaSvg,
  kameaGridLines,
  dedupeLetters,
  randomSpareLayout,
  buildSpareSvg,
  spareLetterTransform,
  sparePathD,
} from '../lib/sigils'

const METHODS = [
  { id: 'roda', label: 'Roda Alfabética' },
  { id: 'kamea', label: 'Quadrado Mágico' },
  { id: 'spare', label: 'Método de Spare' },
]

const METHOD_LABEL = { roda: 'Roda alfabética', kamea: 'Quadrado mágico', spare: 'Método de Spare', rosa_cruz: 'Rosa-Cruz' }

const SPARE_CANVAS_PX = 260
const SPARE_ROTATE_STEP = 15
const SPARE_SCALE_STEP = 0.1
const SPARE_SCALE_MIN = 0.4
const SPARE_SCALE_MAX = 2.2

function planetLabel(id) {
  return KAMEA_PLANETS.find((p) => p.id === id)?.label ?? id
}

function downloadSvg(svg, name) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name || 'sigilo'}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

// Preview quadrado (não circular) pro traçado recém-forjado: quando a
// grade do kamea está visível, não faz sentido cortá-la num círculo.
function SigilPreview({ svg, gridLines, size = 180 }) {
  return (
    <div
      className="relative rounded-xl border border-gold/30 overflow-hidden flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)',
      }}
    >
      {gridLines && (
        <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="absolute inset-0 w-full h-full">
          {gridLines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(201,150,46,0.25)" strokeWidth="1" />
          ))}
        </svg>
      )}
      <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}

function SigilThumb({ svg, size = 56 }) {
  return (
    <div
      className="rounded-full grid place-items-center border border-gold/30 overflow-hidden flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

// Canvas interativo do monograma de Spare: cada letra é um <path> de
// verdade (nunca <text>), arrastável com Pointer Events (mouse e
// toque). Tocar fora de qualquer letra desseleciona.
function SpareCanvas({ instances, selectedId, onSelect, onDrag }) {
  const dragRef = useRef(null)

  function handlePointerDown(e, inst) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    onSelect(inst.id)
    dragRef.current = { id: inst.id, startX: e.clientX, startY: e.clientY, origX: inst.x, origY: inst.y }
  }

  function handlePointerMove(e) {
    const drag = dragRef.current
    if (!drag) return
    const scale = VIEWBOX_SIZE / SPARE_CANVAS_PX
    const x = drag.origX + (e.clientX - drag.startX) * scale
    const y = drag.origY + (e.clientY - drag.startY) * scale
    onDrag(drag.id, Math.max(0, Math.min(VIEWBOX_SIZE, x)), Math.max(0, Math.min(VIEWBOX_SIZE, y)))
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      width={SPARE_CANVAS_PX}
      height={SPARE_CANVAS_PX}
      className="touch-none select-none rounded-xl border border-gold/30"
      style={{ background: 'radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)' }}
      onPointerDown={() => onSelect(null)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {instances.map((inst) => (
        <g key={inst.id}>
          {inst.id === selectedId && (
            <rect
              x={0}
              y={0}
              width={4}
              height={6}
              transform={spareLetterTransform(inst)}
              vectorEffect="non-scaling-stroke"
              fill="none"
              stroke="var(--color-gold-light)"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
          <path
            d={sparePathD(inst.char)}
            transform={spareLetterTransform(inst)}
            vectorEffect="non-scaling-stroke"
            fill="none"
            stroke="#c9962e"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ cursor: 'grab' }}
            onPointerDown={(e) => handlePointerDown(e, inst)}
          />
        </g>
      ))}
    </svg>
  )
}

export default function SigilizadorTab() {
  const { user } = useAuth()

  const [intent, setIntent] = useState('')
  const [method, setMethod] = useState('roda')
  const [planetId, setPlanetId] = useState(KAMEA_PLANETS[0].id)
  const [showGrid, setShowGrid] = useState(true)

  const [svg, setSvg] = useState(null)
  const [svgMethod, setSvgMethod] = useState(null)
  const [svgPlanetId, setSvgPlanetId] = useState(null)

  const [spareLetters, setSpareLetters] = useState('')
  const [spareInstances, setSpareInstances] = useState([])
  const [selectedLetterId, setSelectedLetterId] = useState(null)

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const [sigils, setSigils] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('sigils')
      .select('id, name, method, detail, svg, created_at')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
      return
    }
    setError('')
    setSigils(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const normalized = normalizeIntent(intent)
  const planet = KAMEA_PLANETS.find((p) => p.id === planetId)
  const deduped = dedupeLetters(normalized)
  const selectedLetter = spareInstances.find((inst) => inst.id === selectedLetterId) ?? null

  function forge() {
    if (method === 'kamea') {
      setSvg(buildKameaSvg(normalized, planet.square))
      setSvgPlanetId(planetId)
    } else {
      setSvg(buildRodaSvg(normalized))
      setSvgPlanetId(null)
    }
    setSvgMethod(method)
    setName('')
  }

  function composeSpare() {
    setSpareLetters(deduped)
    setSpareInstances(randomSpareLayout(deduped))
    setSelectedLetterId(null)
    setName('')
  }

  function reshuffleSpare() {
    setSpareInstances(randomSpareLayout(spareLetters))
    setSelectedLetterId(null)
  }

  function updateSelectedSpare(patch) {
    setSpareInstances((prev) => prev.map((inst) => (inst.id === selectedLetterId ? { ...inst, ...patch(inst) } : inst)))
  }

  async function save() {
    const trimmed = name.trim()
    if (!svg || trimmed.length < 1 || trimmed.length > 60) return
    setSaving(true)
    const { error } = await supabase.from('sigils').insert({
      user_id: user.id,
      name: trimmed,
      method: svgMethod,
      detail: svgMethod === 'kamea' ? svgPlanetId : null,
      svg,
    })
    setSaving(false)
    if (error) {
      alert(error.message)
      return
    }
    setSvg(null)
    setIntent('')
    setName('')
    await load()
  }

  async function saveSpare() {
    const trimmed = name.trim()
    const svgOut = buildSpareSvg(spareInstances)
    if (!svgOut || trimmed.length < 1 || trimmed.length > 60) return
    setSaving(true)
    const { error } = await supabase.from('sigils').insert({
      user_id: user.id,
      name: trimmed,
      method: 'spare',
      detail: null,
      svg: svgOut,
    })
    setSaving(false)
    if (error) {
      alert(error.message)
      return
    }
    setSpareInstances([])
    setSpareLetters('')
    setSelectedLetterId(null)
    setIntent('')
    setName('')
    await load()
  }

  async function remove(sigil) {
    const ok = window.confirm(`Apagar o sigilo "${sigil.name}"? Não pode ser desfeito.`)
    if (!ok) return
    setBusyId(sigil.id)
    const { error } = await supabase.from('sigils').delete().eq('id', sigil.id)
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  function startRename(sigil) {
    setRenamingId(sigil.id)
    setRenameValue(sigil.name)
  }

  async function saveRename(sigil) {
    const trimmed = renameValue.trim()
    if (trimmed.length < 1 || trimmed.length > 60) return
    setBusyId(sigil.id)
    const { error } = await supabase.from('sigils').update({ name: trimmed }).eq('id', sigil.id)
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    setRenamingId(null)
    await load()
  }

  return (
    <>
      <SectionLabel>Sigilizador</SectionLabel>

      <div className="flex gap-1.5 mb-3">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`flex-1 text-[11px] px-2 py-1.5 rounded-full border cursor-pointer tracking-wide ${
              method === m.id ? 'border-gold text-gold' : 'border-white/15 text-muted'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Card className="p-4">
        {method === 'kamea' && (
          <>
            <label className="block text-[11px] text-muted mb-1">Planeta</label>
            <select
              value={planetId}
              onChange={(e) => setPlanetId(e.target.value)}
              className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-3 focus:outline-none focus:border-gold"
            >
              {KAMEA_PLANETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} · {p.square.length}x{p.square.length}
                </option>
              ))}
            </select>
          </>
        )}
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="Escreve teu intento…"
          rows={2}
          className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-2 resize-y placeholder:text-faint focus:outline-none focus:border-gold"
        />
        <p className="text-[11px] text-faint leading-relaxed mb-3">
          O intento não é salvo nem enviado a lugar nenhum — só o glifo resultante,
          depois de forjado, pode ser guardado.
        </p>

        {method === 'spare' && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {deduped.length > 0 ? (
              deduped.split('').map((ch, i) => (
                <span
                  key={i}
                  className="w-6 h-6 grid place-items-center rounded border border-gold/30 text-gold text-xs"
                >
                  {ch}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-faint">as letras que sobrarem, sem repetição, aparecem aqui</span>
            )}
          </div>
        )}

        <GoldButton
          small
          disabled={normalized.length === 0}
          onClick={method === 'spare' ? composeSpare : forge}
        >
          {method === 'spare' ? 'Compor monograma' : 'Forjar sigilo'}
        </GoldButton>
      </Card>

      {method !== 'spare' && svg && (
        <Card className="p-4 flex flex-col items-center text-center gap-3">
          <SigilPreview
            svg={svg}
            gridLines={svgMethod === 'kamea' && showGrid ? kameaGridLines(KAMEA_PLANETS.find((p) => p.id === svgPlanetId).square.length) : null}
          />
          {svgMethod === 'kamea' && (
            <button
              type="button"
              onClick={() => setShowGrid((v) => !v)}
              className="bg-transparent border-none text-faint text-[11px] cursor-pointer"
            >
              {showGrid ? 'ocultar grade' : 'mostrar grade'}
            </button>
          )}
          <div className="flex gap-2 w-full">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do sigilo"
              maxLength={60}
              className="flex-1 min-w-0 box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-sm p-2 placeholder:text-faint focus:outline-none focus:border-gold"
            />
            <GoldButton small disabled={saving || name.trim().length < 1} onClick={save}>
              {saving ? 'Salvando…' : 'Salvar'}
            </GoldButton>
          </div>
          <GhostButton onClick={() => downloadSvg(svg, name.trim() || 'sigilo')}>Baixar imagem</GhostButton>
        </Card>
      )}

      {method === 'spare' && spareInstances.length > 0 && (
        <Card className="p-4 flex flex-col items-center text-center gap-3">
          <SpareCanvas
            instances={spareInstances}
            selectedId={selectedLetterId}
            onSelect={setSelectedLetterId}
            onDrag={(id, x, y) =>
              setSpareInstances((prev) => prev.map((inst) => (inst.id === id ? { ...inst, x, y } : inst)))
            }
          />

          {selectedLetter ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] text-muted">ajustando "{selectedLetter.char}":</span>
              <GhostButton onClick={() => updateSelectedSpare((inst) => ({ rotation: inst.rotation - SPARE_ROTATE_STEP }))}>
                ↺ girar
              </GhostButton>
              <GhostButton onClick={() => updateSelectedSpare((inst) => ({ rotation: inst.rotation + SPARE_ROTATE_STEP }))}>
                ↻ girar
              </GhostButton>
              <GhostButton
                onClick={() =>
                  updateSelectedSpare((inst) => ({ scale: Math.max(SPARE_SCALE_MIN, inst.scale - SPARE_SCALE_STEP) }))
                }
              >
                − tamanho
              </GhostButton>
              <GhostButton
                onClick={() =>
                  updateSelectedSpare((inst) => ({ scale: Math.min(SPARE_SCALE_MAX, inst.scale + SPARE_SCALE_STEP) }))
                }
              >
                + tamanho
              </GhostButton>
              <GhostButton onClick={() => updateSelectedSpare((inst) => ({ flipX: !inst.flipX }))}>
                espelhar
              </GhostButton>
            </div>
          ) : (
            <p className="text-[11px] text-faint">toca numa letra pra arrastar, girar, redimensionar ou espelhar</p>
          )}

          <GhostButton onClick={reshuffleSpare}>Sortear novo arranjo</GhostButton>

          <div className="flex gap-2 w-full">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do sigilo"
              maxLength={60}
              className="flex-1 min-w-0 box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-sm p-2 placeholder:text-faint focus:outline-none focus:border-gold"
            />
            <GoldButton small disabled={saving || name.trim().length < 1} onClick={saveSpare}>
              {saving ? 'Salvando…' : 'Salvar'}
            </GoldButton>
          </div>
          <GhostButton onClick={() => downloadSvg(buildSpareSvg(spareInstances), name.trim() || 'sigilo')}>
            Baixar imagem
          </GhostButton>
        </Card>
      )}

      <SectionLabel>Sigilos forjados</SectionLabel>
      {error ? (
        <p className="text-red text-sm text-center py-6">{error}</p>
      ) : sigils === null ? (
        <p className="text-faint text-sm text-center py-6">Carregando…</p>
      ) : sigils.length === 0 ? (
        <p className="text-[13px] text-faint text-center py-6">Nenhum sigilo forjado ainda.</p>
      ) : (
        sigils.map((s) => (
          <Card key={s.id} className="p-3.5 flex items-center gap-3.5">
            <SigilThumb svg={s.svg} />
            <div className="flex-1 min-w-0">
              {renamingId === s.id ? (
                <div className="flex gap-1.5">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    maxLength={60}
                    className="flex-1 min-w-0 box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-sm p-1.5 focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    disabled={busyId === s.id || renameValue.trim().length < 1}
                    onClick={() => saveRename(s)}
                    className="bg-transparent border-none text-gold text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    salvar
                  </button>
                </div>
              ) : (
                <div className="text-[15px] truncate">{s.name}</div>
              )}
              <div className="text-[10px] text-muted uppercase tracking-wide mt-0.5">
                {METHOD_LABEL[s.method] ?? s.method}
                {s.method === 'kamea' && s.detail ? ` · ${planetLabel(s.detail)}` : ''}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
              <button
                type="button"
                onClick={() => downloadSvg(s.svg, s.name)}
                className="bg-transparent border-none text-faint text-[11px] cursor-pointer"
              >
                baixar
              </button>
              <button
                type="button"
                onClick={() => (renamingId === s.id ? setRenamingId(null) : startRename(s))}
                className="bg-transparent border-none text-faint text-[11px] cursor-pointer"
              >
                {renamingId === s.id ? 'cancelar' : 'renomear'}
              </button>
              <button
                type="button"
                disabled={busyId === s.id}
                onClick={() => remove(s)}
                className="bg-transparent border-none text-red text-[11px] cursor-pointer disabled:opacity-50"
              >
                apagar
              </button>
            </div>
          </Card>
        ))
      )}
    </>
  )
}
