import { useState } from 'react'
import { STATUS } from '../lib/spellStatus'
import { GoldButton } from './ui'

function formatEntryDate(iso) {
  return new Date(iso)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    .replace('.', '')
}

const DIAS_MINIMOS_DOMINIO = 3

export default function SpellPanel({
  hue,
  description,
  status,
  onStatusChange,
  journalDays,
  entries,
  onAddEntry,
  onRemoveEntry,
  isCustom,
  onUntrack,
  onDeleteCustom,
}) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  // Antecipa o portão de domínio da migração 047: técnica pessoal não passa
  // por ele, e quem já dominou não precisa ver a contagem regressiva.
  const faltamDias =
    !isCustom && status !== 'dominado' ? Math.max(0, DIAS_MINIMOS_DOMINIO - (journalDays ?? 0)) : 0

  async function submitEntry() {
    const body = draft.trim()
    if (!body) return
    setSaving(true)
    await onAddEntry(body)
    setSaving(false)
    setDraft('')
  }

  return (
    <div className="ml-5 mb-3 pl-3.5" style={{ borderLeft: `2px solid ${hue}` }}>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {Object.keys(STATUS).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => onStatusChange(st)}
            style={{
              borderColor: status === st ? STATUS[st].dot : 'rgba(255,255,255,.14)',
              color: status === st ? STATUS[st].dot : undefined,
            }}
            className={`text-[11px] px-2.5 py-1.5 rounded-full border cursor-pointer ${
              status === st ? 'bg-white/5' : 'bg-transparent text-muted'
            }`}
          >
            {STATUS[st].label}
          </button>
        ))}
      </div>

      {description && (
        <p className="text-[13px] text-muted leading-relaxed mb-3.5">{description}</p>
      )}

      {faltamDias > 0 && (
        <p className="text-[11px] text-faint mb-3.5">
          {Math.min(journalDays ?? 0, DIAS_MINIMOS_DOMINIO)} de {DIAS_MINIMOS_DOMINIO} dias de diário
          registrados — faltam {faltamDias} dia{faltamDias > 1 ? 's' : ''} para poder dominar.
        </p>
      )}

      <div className="text-[10px] tracking-wide uppercase text-gold mb-2">Diário de práticas</div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="O que a prática de hoje revelou?"
        rows={2}
        className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 resize-y placeholder:text-faint focus:outline-none focus:border-gold"
      />
      <div className="my-2 mb-3">
        <GoldButton small disabled={!draft.trim() || saving} onClick={submitEntry}>
          {saving ? 'Registrando…' : 'Registrar'}
        </GoldButton>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-faint mb-2.5">
          Nenhum registro ainda. Cada entrada é um marco da tua jornada com esta técnica.
        </p>
      ) : (
        entries.map((e) => (
          <div key={e.id} className="py-2.5 border-t border-white/5">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] text-faint flex-shrink-0">{formatEntryDate(e.created_at)}</span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => onRemoveEntry(e.id)}
                className="bg-transparent border-none text-faint text-[10px] cursor-pointer"
              >
                apagar
              </button>
            </div>
            <div className="text-[13px] leading-relaxed mt-1 opacity-90">{e.body}</div>
          </div>
        ))
      )}

      <div className="pt-2.5 border-t border-white/5">
        {isCustom ? (
          <button
            type="button"
            onClick={onDeleteCustom}
            className="bg-transparent border-none text-red text-[11px] cursor-pointer"
          >
            apagar prática pessoal (o diário se perde junto)
          </button>
        ) : (
          <button
            type="button"
            onClick={onUntrack}
            className="bg-transparent border-none text-faint text-[11px] cursor-pointer"
          >
            deixar de rastrear (o diário continua guardado)
          </button>
        )}
      </div>
    </div>
  )
}
