import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { Card, SectionLabel, GoldButton, GhostButton } from '../components/ui'

const RECHARGE_MIN = 1
const RECHARGE_MAX = 365
const RECHARGE_SHORTCUTS = [7, 14, 28, 30]

function clampRechargeDays(value) {
  return Math.max(RECHARGE_MIN, Math.min(RECHARGE_MAX, value))
}

function RechargeDaysPicker({ value, onChange }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] text-muted mb-1.5">Intervalo de recarga (dias)</label>
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => onChange(clampRechargeDays(value - 1))}
          disabled={value <= RECHARGE_MIN}
          className="w-11 h-11 flex-shrink-0 grid place-items-center bg-white/[.04] border border-gold/25 rounded-lg text-gold text-lg cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          −
        </button>
        <div className="flex-1 text-center text-ink text-base tabular-nums">{value}</div>
        <button
          type="button"
          onClick={() => onChange(clampRechargeDays(value + 1))}
          disabled={value >= RECHARGE_MAX}
          className="w-11 h-11 flex-shrink-0 grid place-items-center bg-white/[.04] border border-gold/25 rounded-lg text-gold text-lg cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          +
        </button>
      </div>
      <div className="flex gap-2">
        {RECHARGE_SHORTCUTS.map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => onChange(days)}
            className={`flex-1 h-10 rounded-lg text-xs cursor-pointer border ${
              value === days ? 'bg-gradient-to-r from-gold to-gold-light text-navy-deep border-transparent' : 'bg-white/[.04] border-gold/25 text-muted'
            }`}
          >
            {days}
          </button>
        ))}
      </div>
    </div>
  )
}

function statusInfo(row) {
  if (row.is_charged) {
    const days = Math.ceil((new Date(row.next_charge_due).getTime() - Date.now()) / 86400000)
    return {
      label: 'Carregado',
      className: 'text-green border-green/40',
      detail: days <= 0 ? 'a recarga vence hoje' : `próxima recarga em ${days} dia${days === 1 ? '' : 's'}`,
    }
  }
  const days = row.days_overdue
  return {
    label: 'Carga baixa',
    className: 'text-red border-red/40',
    detail: days <= 0 ? 'a recarga venceu hoje' : `recarga vencida há ${days} dia${days === 1 ? '' : 's'}`,
  }
}

function Sigil({ url, size = 96 }) {
  return (
    <div
      className="rounded-full grid place-items-center border border-gold/30 overflow-hidden flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)',
      }}
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.36 }}>🕸</span>
      )}
    </div>
  )
}

export default function ServidorTab() {
  const { user } = useAuth()
  const { refresh: refreshProfile } = useProfile()

  const [servitors, setServitors] = useState(null)
  const [error, setError] = useState('')
  const [imageUrls, setImageUrls] = useState({})
  const [view, setView] = useState('lista') // lista | criar | detalhe
  const [selectedId, setSelectedId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rechargeDays, setRechargeDays] = useState(7)
  const [creating, setCreating] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editRechargeDays, setEditRechargeDays] = useState(7)
  const [savingEdit, setSavingEdit] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingVisibility, setSavingVisibility] = useState(false)

  async function load() {
    const { data, error } = await supabase.rpc('my_servitors')
    if (error) {
      setError(error.message)
      return
    }
    setError('')
    setServitors(data ?? [])

    const withPhotos = (data ?? []).filter((s) => s.sigil_path)
    if (withPhotos.length > 0) {
      const entries = await Promise.all(
        withPhotos.map(async (s) => {
          const { data: signed } = await supabase.storage.from('servidores').createSignedUrl(s.sigil_path, 3600)
          return [s.id, signed?.signedUrl ?? null]
        })
      )
      setImageUrls((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setName('')
    setDescription('')
    setRechargeDays(7)
    setView('criar')
  }

  async function create() {
    if (name.trim().length < 2) return
    setCreating(true)
    const { data, error } = await supabase
      .from('servitors')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        recharge_interval_days: rechargeDays,
      })
      .select('id')
      .single()
    setCreating(false)
    if (error) {
      alert(error.message)
      return
    }
    await Promise.all([load(), refreshProfile()])
    setSelectedId(data.id)
    setView('detalhe')
  }

  function openDetail(servitor) {
    setSelectedId(servitor.id)
    setEditing(false)
    setView('detalhe')
  }

  function startEdit(servitor) {
    setEditName(servitor.name)
    setEditDescription(servitor.description ?? '')
    setEditRechargeDays(servitor.recharge_interval_days)
    setEditing(true)
  }

  async function saveEdit(servitor) {
    if (editName.trim().length < 2) return
    setSavingEdit(true)
    const { error } = await supabase
      .from('servitors')
      .update({
        name: editName.trim(),
        description: editDescription.trim() || null,
        recharge_interval_days: editRechargeDays,
      })
      .eq('id', servitor.id)
    setSavingEdit(false)
    if (error) {
      alert(error.message)
      return
    }
    setEditing(false)
    await load()
  }

  async function recharge(servitor) {
    const ok = window.confirm(
      `Realizar agora o ritual de recarga de ${servitor.name}? A contagem de dias reinicia a partir de hoje.`
    )
    if (!ok) return
    setBusyId(servitor.id)
    const { data, error } = await supabase.rpc('recharge_servitor', { p_servitor: servitor.id })
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok') {
      alert(data)
      return
    }
    await Promise.all([load(), refreshProfile()])
  }

  async function burn(servitor) {
    const ok = window.confirm(
      `Queimar ${servitor.name}? O servidor será desfeito e seus dados não poderão ser recuperados.`
    )
    if (!ok) return
    setBusyId(servitor.id)
    const { data, error } = await supabase.rpc('burn_servitor', { p_servitor: servitor.id })
    if (error) {
      setBusyId(null)
      alert(error.message)
      return
    }
    if (servitor.sigil_path) {
      await supabase.storage.from('servidores').remove([servitor.sigil_path])
    }
    setBusyId(null)
    if (data !== 'queimado') {
      alert(data)
      return
    }
    setView('lista')
    setSelectedId(null)
    await Promise.all([load(), refreshProfile()])
  }

  async function toggleVisibility(servitor, nextVisible) {
    setSavingVisibility(true)
    const { data, error } = await supabase.rpc('set_servitor_visibility', {
      p_servitor: servitor.id,
      p_visible: nextVisible,
    })
    setSavingVisibility(false)
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok') {
      alert(data)
      return
    }
    await load()
  }

  async function uploadPhoto(servitor, file) {
    setUploadingPhoto(true)
    const path = `${user.id}/${servitor.id}.jpg`
    const { error: upErr } = await supabase.storage.from('servidores').upload(path, file, { upsert: true })
    if (upErr) {
      setUploadingPhoto(false)
      alert(upErr.message)
      return
    }
    const { error: updErr } = await supabase.from('servitors').update({ sigil_path: path }).eq('id', servitor.id)
    setUploadingPhoto(false)
    if (updErr) {
      alert(updErr.message)
      return
    }
    await load()
  }

  if (error) return <p className="text-red text-sm text-center py-10">{error}</p>
  if (servitors === null) return <p className="text-faint text-sm text-center py-10">Carregando servidores…</p>

  if (view === 'criar') {
    return (
      <>
        <button
          type="button"
          onClick={() => setView('lista')}
          className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
        >
          ← Servidores
        </button>

        <SectionLabel>Vincular novo servidor</SectionLabel>
        <Card className="p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do servidor"
            className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-2 placeholder:text-faint focus:outline-none focus:border-gold"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição — aparência, habilidades, background…"
            rows={4}
            className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-2 resize-y placeholder:text-faint focus:outline-none focus:border-gold"
          />
          <RechargeDaysPicker value={rechargeDays} onChange={setRechargeDays} />
          <div>
            <GoldButton small disabled={name.trim().length < 2 || creating} onClick={create}>
              {creating ? 'Vinculando…' : 'Vincular servidor'}
            </GoldButton>
          </div>
        </Card>
      </>
    )
  }

  if (view === 'detalhe') {
    const servitor = servitors.find((s) => s.id === selectedId)
    if (!servitor) {
      setView('lista')
      return null
    }
    const status = statusInfo(servitor)
    const busy = busyId === servitor.id

    return (
      <>
        <button
          type="button"
          onClick={() => setView('lista')}
          className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
        >
          ← Servidores
        </button>

        <div className="flex flex-col items-center text-center mb-4">
          <label className="cursor-pointer">
            <Sigil url={imageUrls[servitor.id]} size={104} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadPhoto(servitor, f)
              }}
            />
          </label>
          <div className="text-[11px] text-faint mt-1.5">
            {uploadingPhoto ? 'Enviando sigilo…' : 'toca no sigilo para trocar a foto'}
          </div>

          <div className="text-lg mt-3">{servitor.name}</div>
          <span className={`text-[10px] tracking-wide uppercase border rounded-full px-2.5 py-1 mt-2 ${status.className}`}>
            {status.label}
          </span>
          <div className="text-xs text-muted mt-1.5">{status.detail}</div>

          <div className="mt-3">
            <GoldButton small disabled={busy} onClick={() => recharge(servitor)}>
              {busy ? 'Recarregando…' : 'Recarregar'}
            </GoldButton>
          </div>
        </div>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm">Visível para amigos</div>
            <div className="text-[11px] text-muted mt-0.5 leading-relaxed">
              Oculto, este servidor não aparece no teu perfil visto por amigos.
            </div>
          </div>
          <input
            type="checkbox"
            checked={servitor.visible_to_friends}
            disabled={savingVisibility}
            onChange={(e) => toggleVisibility(servitor, e.target.checked)}
          />
        </Card>

        <Card className="p-4">
          {editing ? (
            <>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-2 focus:outline-none focus:border-gold"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-2 resize-y focus:outline-none focus:border-gold"
              />
              <RechargeDaysPicker value={editRechargeDays} onChange={setEditRechargeDays} />
              <div className="flex gap-2">
                <GoldButton small disabled={editName.trim().length < 2 || savingEdit} onClick={() => saveEdit(servitor)}>
                  {savingEdit ? 'Salvando…' : 'Salvar'}
                </GoldButton>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="bg-transparent border-none text-faint text-xs cursor-pointer"
                >
                  cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center mb-2">
                <div className="text-[11px] tracking-wide uppercase text-muted">Descrição</div>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => startEdit(servitor)}
                  className="bg-transparent border-none text-gold text-[11px] cursor-pointer"
                >
                  editar
                </button>
              </div>
              {servitor.description ? (
                <p className="text-[13px] text-muted leading-relaxed whitespace-pre-wrap">{servitor.description}</p>
              ) : (
                <p className="text-[13px] text-faint">Sem descrição ainda.</p>
              )}
            </>
          )}
        </Card>

        <div className="mt-5 pt-3.5 border-t border-white/5 text-center">
          <button
            type="button"
            disabled={busy}
            onClick={() => burn(servitor)}
            className="bg-transparent border-none text-red text-xs cursor-pointer disabled:opacity-50"
          >
            🔥 Queimar Servidor
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center">
        <SectionLabel>Servidores Astrais</SectionLabel>
        <div className="flex-1" />
        <GhostButton onClick={openCreate}>+ Novo servidor</GhostButton>
      </div>

      {servitors.length === 0 ? (
        <div className="text-center py-9 px-5">
          <p className="text-[13px] text-faint leading-relaxed">Não possuis um servidor astral.</p>
          <GoldButton small className="mt-3" onClick={openCreate}>
            Criar servidor
          </GoldButton>
        </div>
      ) : (
        servitors.map((s) => {
          const status = statusInfo(s)
          return (
            <Card key={s.id} className="p-3.5">
              <button
                type="button"
                onClick={() => openDetail(s)}
                className="flex items-center gap-3.5 w-full bg-transparent border-none text-left cursor-pointer p-0"
              >
                <Sigil url={imageUrls[s.id]} size={52} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px]">{s.name}</div>
                  <div className={`text-[10px] tracking-wide uppercase mt-0.5 ${status.className.split(' ')[0]}`}>
                    {status.label}
                  </div>
                  <div className="text-[11px] text-faint mt-0.5">{status.detail}</div>
                </div>
              </button>
            </Card>
          )
        })
      )}

      <p className="text-[11px] text-faint text-center mt-4 leading-relaxed">
        Servidores astrais são estritamente pessoais — só tu enxergas os teus.
      </p>
    </>
  )
}
