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

// Gesto lateral (navegar) x toque parado (entrar/sair da contemplação):
// mesmo limiar usado nos dois lugares que precisam distinguir os dois.
const SWIPE_THRESHOLD_PX = 50
const TAP_THRESHOLD_PX = 10

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

// Distingue toque parado (tap) de arrasto lateral (swipe) a partir do
// mesmo par de eventos pointerdown/pointerup -- usado tanto na tela de
// detalhe quanto no modo de contemplação, com destinos diferentes pro
// tap (entrar/sair) mas o mesmo swipe (navegar entre sigilos).
function useSwipeAndTap({ onSwipeLeft, onSwipeRight, onTap }) {
  const startRef = useRef(null)
  return {
    onPointerDown: (e) => {
      startRef.current = { x: e.clientX, y: e.clientY }
    },
    onPointerUp: (e) => {
      const start = startRef.current
      startRef.current = null
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) onSwipeLeft?.()
        else onSwipeRight?.()
      } else if (onTap && Math.abs(dx) < TAP_THRESHOLD_PX && Math.abs(dy) < TAP_THRESHOLD_PX) {
        onTap()
      }
    },
  }
}

// Enquanto em contemplação, pede pra tela não apagar. Sem suporte
// (navigator.wakeLock ausente) ou pedido recusado, degrada em
// silêncio -- fitar o sigilo continua funcionando, só sem a garantia.
// Reconquista o lock se a aba voltar a ficar visível (o navegador
// solta o lock sozinho quando ela sai de foco).
function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined
    let sentinel = null
    let cancelled = false

    async function acquire() {
      try {
        sentinel = await navigator.wakeLock.request('screen')
      } catch {
        // sem suporte real, permissão negada, ou aba em segundo plano
      }
    }
    acquire()

    function handleVisibility() {
      if (document.visibilityState === 'visible' && !cancelled) acquire()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      sentinel?.release().catch(() => {})
    }
  }, [active])
}

// Tela dedicada de um sigilo salvo: glifo grande, nome discreto, ações
// mínimas. Toque no glifo entra em modo de contemplação (tela cheia,
// sem nada além do traço); toque nele sai. Arrasto lateral navega
// entre os sigilos salvos nos dois modos.
function SigilDetailScreen({ sigil, hasPrev, hasNext, onBack, onPrev, onNext, onRename, onDelete, onDownload, busy }) {
  const [contemplating, setContemplating] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(sigil.name)

  useEffect(() => {
    setEditingName(false)
    setDraftName(sigil.name)
  }, [sigil.id, sigil.name])

  useWakeLock(contemplating)

  const swipeOnly = useSwipeAndTap({ onSwipeLeft: hasNext ? onNext : null, onSwipeRight: hasPrev ? onPrev : null })
  const swipeAndEnter = useSwipeAndTap({
    onSwipeLeft: hasNext ? onNext : null,
    onSwipeRight: hasPrev ? onPrev : null,
    onTap: () => setContemplating(true),
  })
  const swipeAndExit = useSwipeAndTap({
    onSwipeLeft: hasNext ? onNext : null,
    onSwipeRight: hasPrev ? onPrev : null,
    onTap: () => setContemplating(false),
  })

  if (contemplating) {
    return (
      <div className="fixed inset-0 z-40 bg-navy-deep grid place-items-center p-6" {...swipeAndExit}>
        <div className="w-full max-w-md aspect-square" dangerouslySetInnerHTML={{ __html: sigil.svg }} />
      </div>
    )
  }

  return (
    <>
      <button type="button" onClick={onBack} className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5">
        ← Sigilos
      </button>

      <div className="w-full aspect-square touch-none select-none" {...swipeAndEnter} dangerouslySetInnerHTML={{ __html: sigil.svg }} />

      <div className="text-center mt-3" {...swipeOnly}>
        {editingName ? (
          <div className="flex gap-1.5 justify-center">
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={60}
              autoFocus
              className="flex-1 min-w-0 max-w-[220px] box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-sm p-1.5 focus:outline-none focus:border-gold"
            />
            <button
              type="button"
              disabled={busy || draftName.trim().length < 1}
              onClick={() => {
                onRename(draftName)
                setEditingName(false)
              }}
              className="bg-transparent border-none text-gold text-[11px] cursor-pointer disabled:opacity-50"
            >
              salvar
            </button>
          </div>
        ) : (
          <div className="text-sm text-muted">{sigil.name}</div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <GhostButton onClick={() => setEditingName((v) => !v)}>{editingName ? 'cancelar' : 'renomear'}</GhostButton>
        <GhostButton onClick={onDownload}>baixar imagem</GhostButton>
        <GhostButton hue="var(--color-red)" disabled={busy} onClick={onDelete}>
          apagar
        </GhostButton>
      </div>

      <p className="text-[11px] text-faint text-center mt-5 leading-relaxed">
        toca no glifo pra entrar em modo de contemplação · arrasta pros lados pra navegar
      </p>
    </>
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

  const [view, setView] = useState('lista')
  const [detailIndex, setDetailIndex] = useState(null)

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
  const currentSigil = detailIndex !== null && sigils ? sigils[detailIndex] : null

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

  function openDetail(index) {
    setDetailIndex(index)
    setView('detalhe')
  }

  function closeDetail() {
    setView('lista')
    setDetailIndex(null)
  }

  function goNext() {
    setDetailIndex((i) => (i === null || !sigils ? i : Math.min(sigils.length - 1, i + 1)))
  }

  function goPrev() {
    setDetailIndex((i) => (i === null ? i : Math.max(0, i - 1)))
  }

  async function renameSigil(sigil, newName) {
    const trimmed = newName.trim()
    if (trimmed.length < 1 || trimmed.length > 60) return
    setBusyId(sigil.id)
    const { error } = await supabase.from('sigils').update({ name: trimmed }).eq('id', sigil.id)
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    await load()
  }

  async function deleteSigil(sigil) {
    const ok = window.confirm(`Apagar o sigilo "${sigil.name}"? Não pode ser desfeito.`)
    if (!ok) return
    setBusyId(sigil.id)
    const { error } = await supabase.from('sigils').delete().eq('id', sigil.id)
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    closeDetail()
    await load()
  }

  if (view === 'detalhe' && currentSigil) {
    return (
      <SigilDetailScreen
        sigil={currentSigil}
        hasPrev={detailIndex > 0}
        hasNext={sigils ? detailIndex < sigils.length - 1 : false}
        onBack={closeDetail}
        onPrev={goPrev}
        onNext={goNext}
        onRename={(newName) => renameSigil(currentSigil, newName)}
        onDelete={() => deleteSigil(currentSigil)}
        onDownload={() => downloadSvg(currentSigil.svg, currentSigil.name)}
        busy={busyId === currentSigil.id}
      />
    )
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

        <GoldButton small disabled={normalized.length === 0} onClick={method === 'spare' ? composeSpare : forge}>
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
        sigils.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => openDetail(i)}
            className="w-full text-left bg-transparent border-none p-0 cursor-pointer"
          >
            <Card className="p-3.5 flex items-center gap-3.5">
              <SigilThumb svg={s.svg} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] truncate">{s.name}</div>
                <div className="text-[10px] text-muted uppercase tracking-wide mt-0.5">
                  {METHOD_LABEL[s.method] ?? s.method}
                  {s.method === 'kamea' && s.detail ? ` · ${planetLabel(s.detail)}` : ''}
                </div>
              </div>
            </Card>
          </button>
        ))
      )}
    </>
  )
}
