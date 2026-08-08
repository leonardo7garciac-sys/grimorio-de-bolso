import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { Card, SectionLabel, GoldButton, GhostButton } from '../components/ui'
import PremiumGate from '../components/PremiumGate'
import { periodKey } from '../lib/periodKey'

// Redação sujeita a ajuste — mantida numa constante única para não
// espalhar o texto pelo componente.
const TAROT_INTRO = {
  short:
    'Instrumento de reflexão, não de previsão. As cartas não dizem o que vai acontecer — ajudam a enxergar o que já está diante de você.',
  title: 'O que o tarô é',
  body: `O tarô não prevê o futuro. É um instrumento de reflexão: setenta e oito imagens que a tradição ocidental refinou ao longo de séculos, até que cada uma condensasse uma situação humana reconhecível.

O que a carta faz é obrigar você a nomear o que já percebia e ainda não tinha dito. Diante de uma imagem ambígua, projetamos o que carregamos — e é isso que aparece na leitura. A psicologia chama esse tipo de recurso de instrumento projetivo; a tradição chama de espelho. As duas descrições apontam para a mesma coisa.

Por isso a pergunta útil nunca é "o que vai acontecer comigo", e sim "o que estou deixando de ver nesta situação, e como agir a partir daqui".`,
}

const MAJOR_SPREADS = [
  { id: 'tres', label: 'Três Cartas' },
  { id: 'cruz_celta', label: 'Cruz Celta' },
]

const SPREAD_LABEL = { uma: 'Carta do Dia', tres: 'Três Cartas', cruz_celta: 'Cruz Celta' }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function cardImageUrl(imagePath) {
  if (!imagePath) return null
  return supabase.storage.from('tarot').getPublicUrl(imagePath).data.publicUrl
}

// Une as duas formas em que uma carta sorteada chega: a linha da RPC
// (chave `posicao`, sem verbete) e o jsonb persistido em
// tarot_readings.cards (chave `position`, também sem verbete). O nome,
// a imagem e o texto (upright ou reversed, conforme a orientação) vêm
// sempre de cardsBySlug — fonte única.
function normalizeCards(raw, cardsBySlug) {
  return (raw ?? [])
    .map((c) => {
      const def = cardsBySlug[c.slug] ?? {}
      return {
        slug: c.slug,
        reversed: c.reversed,
        position: c.position ?? c.posicao,
        name: def.name ?? c.slug,
        image_path: def.image_path ?? null,
        text: c.reversed ? def.reversed : def.upright,
      }
    })
    .sort((a, b) => a.position - b.position)
}

function TarotCardFace({ name, imagePath, reversed, size = 160 }) {
  const url = cardImageUrl(imagePath)
  return (
    <div
      className="rounded-xl border border-gold/30 overflow-hidden flex-shrink-0 grid place-items-center"
      style={{
        width: size,
        height: size * 1.6,
        background: 'radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)',
      }}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          style={{ transform: reversed ? 'rotate(180deg)' : undefined }}
        />
      ) : (
        <span style={{ fontSize: size * 0.3 }}>🂠</span>
      )}
    </div>
  )
}

export default function TarotTab() {
  const { paying } = useProfile()

  const [introOpen, setIntroOpen] = useState(false)

  const [cardsBySlug, setCardsBySlug] = useState(null)
  const [dailyReading, setDailyReading] = useState(undefined) // undefined = carregando, null = ainda não tirada hoje
  const [drawingDaily, setDrawingDaily] = useState(false)

  const [spread, setSpread] = useState('tres')
  const [question, setQuestion] = useState('')
  const [drawingMajor, setDrawingMajor] = useState(false)

  const [history, setHistory] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null) // { readingId, position }
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [positions, setPositions] = useState(null) // { [spread]: { [posicao]: { name, meaning } } }
  const [error, setError] = useState('')

  async function loadCards() {
    const { data, error } = await supabase.from('tarot_cards').select('slug, name, image_path, upright, reversed')
    if (error) {
      setError(error.message)
      return
    }
    setCardsBySlug(Object.fromEntries((data ?? []).map((c) => [c.slug, c])))
  }

  async function loadDaily() {
    const { data, error } = await supabase
      .from('tarot_readings')
      .select('id, cards, question, note, created_at')
      .eq('spread', 'uma')
      .eq('period_key', periodKey('diaria'))
      .maybeSingle()
    if (error) {
      setError(error.message)
      return
    }
    setDailyReading(data)
  }

  async function loadHistory() {
    const { data, error } = await supabase
      .from('tarot_readings')
      .select('id, spread, question, cards, note, period_key, created_at')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
      return
    }
    setHistory(data ?? [])
  }

  async function loadPositions() {
    const { data, error } = await supabase.from('tarot_positions').select('spread, posicao, name, meaning')
    if (error) {
      setError(error.message)
      return
    }
    const grouped = {}
    for (const p of data ?? []) {
      grouped[p.spread] ??= {}
      grouped[p.spread][p.posicao] = { name: p.name, meaning: p.meaning }
    }
    setPositions(grouped)
  }

  useEffect(() => {
    loadCards()
    loadDaily()
    loadHistory()
    loadPositions()
  }, [])

  async function drawDaily() {
    setDrawingDaily(true)
    const { error } = await supabase.rpc('draw_tarot', { p_spread: 'uma' })
    setDrawingDaily(false)
    if (error) {
      alert(error.hint || error.message)
      return
    }
    await Promise.all([loadDaily(), loadHistory()])
  }

  async function drawMajor() {
    setDrawingMajor(true)
    const { data, error } = await supabase.rpc('draw_tarot', {
      p_spread: spread,
      p_question: question.trim() || null,
    })
    setDrawingMajor(false)
    if (error) {
      alert(error.hint || error.message)
      return
    }
    setQuestion('')
    await loadHistory()
    const newId = data?.[0]?.reading_id
    if (newId) {
      setExpandedId(newId)
      setNoteDraft('')
    }
  }

  function toggleExpand(reading) {
    setSelectedCard(null)
    if (expandedId === reading.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(reading.id)
    setNoteDraft(reading.note ?? '')
  }

  function toggleCardSelect(readingId, position) {
    setSelectedCard((prev) =>
      prev?.readingId === readingId && prev?.position === position ? null : { readingId, position }
    )
  }

  async function saveNote(reading) {
    setSavingNote(true)
    const { error } = await supabase.from('tarot_readings').update({ note: noteDraft.trim() || null }).eq('id', reading.id)
    setSavingNote(false)
    if (error) {
      alert(error.message)
      return
    }
    await loadHistory()
  }

  async function deleteReading(reading) {
    const ok = window.confirm('Apagar esta tiragem? A anotação também é perdida — não pode ser desfeito.')
    if (!ok) return
    setDeletingId(reading.id)
    // A policy recusa apagar a carta do dia de hoje. Isso não vem como
    // erro: a linha simplesmente não casa com o `using` e nada é
    // apagado -- por isso o .select('id') para distinguir "apagou" de
    // "a policy barrou".
    const { data, error } = await supabase.from('tarot_readings').delete().eq('id', reading.id).select('id')
    setDeletingId(null)
    if (error) {
      alert(error.message)
      return
    }
    if (!data || data.length === 0) {
      alert('A carta do dia de hoje não pode ser apagada — ela só se refaz a partir de amanhã.')
      return
    }
    setExpandedId(null)
    setSelectedCard(null)
    await loadHistory()
  }

  const ready = cardsBySlug !== null
  const dailyCard = ready && dailyReading ? normalizeCards(dailyReading.cards, cardsBySlug)[0] : null

  return (
    <>
      <p className="text-[11px] text-faint text-center leading-relaxed mb-3">{TAROT_INTRO.short}</p>

      <Card className="p-3.5 mb-4">
        <button
          type="button"
          onClick={() => setIntroOpen((v) => !v)}
          className="w-full flex items-center gap-2 bg-transparent border-none text-left cursor-pointer p-0"
        >
          <span className="text-[13px] flex-1">{TAROT_INTRO.title}</span>
          <span className="text-faint text-xs flex-shrink-0">{introOpen ? '▲' : '▼'}</span>
        </button>
        {introOpen && (
          <p className="text-[13px] text-muted leading-relaxed whitespace-pre-wrap mt-3 pt-3 border-t border-white/5">
            {TAROT_INTRO.body}
          </p>
        )}
      </Card>

      <SectionLabel>Carta do Dia</SectionLabel>
      <Card className="p-4 flex flex-col items-center text-center gap-3">
        {!ready || dailyReading === undefined ? (
          <p className="text-faint text-sm py-6">Carregando…</p>
        ) : dailyCard ? (
          <>
            <TarotCardFace name={dailyCard.name} imagePath={dailyCard.image_path} reversed={dailyCard.reversed} size={180} />
            <div className="text-base mt-1">
              {dailyCard.name}
              {dailyCard.reversed ? ' (invertida)' : ''}
            </div>
            <p className="text-[13px] text-muted leading-relaxed whitespace-pre-wrap text-left">{dailyCard.text}</p>
          </>
        ) : (
          <>
            <p className="text-[13px] text-faint leading-relaxed">
              Uma carta por dia — depois de tirada, não se refaz.
            </p>
            <GoldButton small disabled={drawingDaily} onClick={drawDaily}>
              {drawingDaily ? 'Sorteando…' : 'Tirar a carta de hoje'}
            </GoldButton>
          </>
        )}
      </Card>

      <SectionLabel>Tiragens Maiores</SectionLabel>
      {!paying ? (
        <PremiumGate />
      ) : (
        <Card className="p-4">
          <div className="flex gap-1.5 mb-3">
            {MAJOR_SPREADS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSpread(s.id)}
                className={`flex-1 text-[11px] px-2 py-1.5 rounded-full border cursor-pointer tracking-wide ${
                  spread === s.id ? 'border-gold text-gold' : 'border-white/15 text-muted'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pergunta (opcional)…"
            rows={2}
            maxLength={500}
            className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-3 resize-y placeholder:text-faint focus:outline-none focus:border-gold"
          />
          <GoldButton small disabled={drawingMajor} onClick={drawMajor}>
            {drawingMajor ? 'Sorteando…' : 'Sortear'}
          </GoldButton>
        </Card>
      )}

      <SectionLabel>Histórico</SectionLabel>
      {error ? (
        <p className="text-red text-sm text-center py-6">{error}</p>
      ) : !ready || history === null ? (
        <p className="text-faint text-sm text-center py-6">Carregando…</p>
      ) : history.length === 0 ? (
        <p className="text-[13px] text-faint text-center py-6">Nenhuma tiragem ainda.</p>
      ) : (
        history.map((r) => {
          const cards = normalizeCards(r.cards, cardsBySlug)
          const open = expandedId === r.id
          const isTodaysDaily = r.spread === 'uma' && r.period_key === periodKey('diaria')
          return (
            <Card key={r.id} className="p-3.5">
              <button
                type="button"
                onClick={() => toggleExpand(r)}
                className="w-full flex items-center gap-2 bg-transparent border-none text-left cursor-pointer p-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px]">{SPREAD_LABEL[r.spread] ?? r.spread}</div>
                  <div className="text-[11px] text-faint mt-0.5 truncate">
                    {formatDate(r.created_at)}
                    {r.question ? ` · ${r.question}` : ''}
                  </div>
                </div>
                <span className="text-faint text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
              </button>

              {open && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {cards.map((c) => {
                      const cardOpen = selectedCard?.readingId === r.id && selectedCard?.position === c.position
                      return (
                        <button
                          key={c.position}
                          type="button"
                          onClick={() => toggleCardSelect(r.id, c.position)}
                          className={`flex-shrink-0 text-center bg-transparent border-none cursor-pointer p-1 rounded-lg ${
                            cardOpen ? 'bg-white/[.05]' : ''
                          }`}
                          style={{ width: 84 }}
                        >
                          <TarotCardFace name={c.name} imagePath={c.image_path} reversed={c.reversed} size={84} />
                          <div className="text-[10px] text-muted mt-1 leading-tight">
                            {c.position}. {c.name}
                            {c.reversed ? ' (inv.)' : ''}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {selectedCard?.readingId === r.id &&
                    (() => {
                      const card = cards.find((c) => c.position === selectedCard.position)
                      if (!card) return null
                      const pos = positions?.[r.spread]?.[card.position]
                      return (
                        <div className="mt-3 p-3 rounded-lg bg-white/[.03] border border-gold/15 text-left">
                          {pos && (
                            <>
                              <div className="text-[11px] tracking-wide uppercase text-gold">
                                {card.position}. {pos.name}
                              </div>
                              <p className="text-[12px] text-faint leading-relaxed mt-1 mb-2.5">{pos.meaning}</p>
                            </>
                          )}
                          <div className="text-sm">
                            {card.name}
                            {card.reversed ? ' (invertida)' : ''}
                          </div>
                          <p className="text-[13px] text-muted leading-relaxed whitespace-pre-wrap mt-1">{card.text}</p>
                        </div>
                      )
                    })()}

                  <label className="block text-[11px] text-muted mt-3.5 mb-1">Anotação</label>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="O que aconteceu depois desta tiragem?"
                    rows={3}
                    className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-sm p-2.5 mb-2 resize-y placeholder:text-faint focus:outline-none focus:border-gold"
                  />
                  <div className="flex gap-2">
                    <GhostButton disabled={savingNote} onClick={() => saveNote(r)}>
                      {savingNote ? 'Salvando…' : 'Salvar anotação'}
                    </GhostButton>
                    {!isTodaysDaily && (
                      <GhostButton hue="var(--color-red)" disabled={deletingId === r.id} onClick={() => deleteReading(r)}>
                        {deletingId === r.id ? 'Apagando…' : 'Apagar tiragem'}
                      </GhostButton>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })
      )}
    </>
  )
}
