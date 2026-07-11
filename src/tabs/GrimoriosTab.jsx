import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { Card, SectionLabel, GoldButton, GhostButton } from '../components/ui'
import SpellPanel from '../components/SpellPanel'
import { STATUS } from '../lib/spellStatus'

export default function GrimoriosTab() {
  const { user } = useAuth()
  const { refresh: refreshProfile } = useProfile()

  const [collection, setCollection] = useState(null)
  const [collectionError, setCollectionError] = useState('')
  const [view, setView] = useState('colecao') // colecao | adicionar
  const [openSpellId, setOpenSpellId] = useState(null)
  const [journalBySpell, setJournalBySpell] = useState({})

  const [catalogSpells, setCatalogSpells] = useState(null)
  const [grimoires, setGrimoires] = useState(null)
  const [catalogError, setCatalogError] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [forging, setForging] = useState(false)

  async function loadCollection() {
    const { data, error } = await supabase.rpc('my_collection')
    if (error) setCollectionError(error.message)
    else {
      setCollectionError('')
      setCollection(data ?? [])
    }
  }

  useEffect(() => {
    loadCollection()
  }, [])

  async function loadCatalog() {
    setCatalogSpells(null)
    setGrimoires(null)
    setCatalogError('')
    const [{ data: spells, error: spellsError }, { data: grim, error: grimError }] = await Promise.all([
      supabase.from('spells').select('id, name, description, xp_reward, grimoire_id').is('owner_id', null),
      supabase.from('my_grimoires').select('*'),
    ])
    if (spellsError || grimError) {
      setCatalogError((spellsError ?? grimError).message)
      return
    }
    setCatalogSpells(spells ?? [])
    setGrimoires((grim ?? []).slice().sort((a, b) => a.sort_order - b.sort_order))
  }

  function openAddScreen() {
    setView('adicionar')
    loadCatalog()
  }

  async function track(spellId) {
    await supabase.from('user_spells').insert({ user_id: user.id, spell_id: spellId, status: 'novo' })
    await loadCollection()
    setView('colecao')
  }

  async function setStatus(spellId, status) {
    await supabase.from('user_spells').upsert({ user_id: user.id, spell_id: spellId, status })
    await Promise.all([loadCollection(), refreshProfile()])
  }

  async function untrack(spellId) {
    const ok = window.confirm(
      'Deixar de rastrear esta técnica? O diário continua guardado, mas o status volta a "não iniciado" se voltares a rastreá-la.'
    )
    if (!ok) return
    await supabase.from('user_spells').delete().eq('user_id', user.id).eq('spell_id', spellId)
    setOpenSpellId(null)
    await Promise.all([loadCollection(), refreshProfile()])
  }

  async function deleteCustom(spellId) {
    const ok = window.confirm('Apagar esta prática pessoal? O diário dela se perde junto.')
    if (!ok) return
    await supabase.from('spells').delete().eq('id', spellId)
    setOpenSpellId(null)
    await Promise.all([loadCollection(), refreshProfile()])
  }

  async function forge() {
    if (newName.trim().length < 3) return
    setForging(true)
    const { error } = await supabase.rpc('create_custom_spell', {
      p_name: newName.trim(),
      p_description: newDesc.trim() || null,
    })
    setForging(false)
    if (error) {
      alert(error.message)
      return
    }
    setNewName('')
    setNewDesc('')
    await loadCollection()
    setView('colecao')
  }

  async function loadJournal(spellId) {
    const { data } = await supabase
      .from('spell_journal')
      .select('id, body, created_at')
      .eq('spell_id', spellId)
      .order('created_at', { ascending: false })
    setJournalBySpell((prev) => ({ ...prev, [spellId]: data ?? [] }))
  }

  function toggleSpell(spellId) {
    setOpenSpellId((prev) => {
      const next = prev === spellId ? null : spellId
      if (next) loadJournal(next)
      return next
    })
  }

  async function addJournalEntry(spellId, body) {
    await supabase.from('spell_journal').insert({ user_id: user.id, spell_id: spellId, body })
    await loadJournal(spellId)
    await loadCollection()
  }

  async function removeJournalEntry(spellId, entryId) {
    await supabase.from('spell_journal').delete().eq('id', entryId)
    await loadJournal(spellId)
    await loadCollection()
  }

  const groups = useMemo(() => {
    const map = new Map()
    for (const row of collection ?? []) {
      const key = row.grimoire_id ?? '__custom__'
      if (!map.has(key)) {
        map.set(key, {
          key,
          title: row.grimoire_title,
          hue: row.grimoire_hue,
          isCustom: row.is_custom,
          rows: [],
        })
      }
      map.get(key).rows.push(row)
    }
    return Array.from(map.values())
  }, [collection])

  const trackedIds = useMemo(() => new Set((collection ?? []).map((r) => r.spell_id)), [collection])

  function renderSpellRow(row) {
    const detail = openSpellId === row.spell_id
    const entries = journalBySpell[row.spell_id] ?? []
    const st = STATUS[row.status]
    return (
      <div key={row.spell_id} className="border-t border-white/5">
        <button
          type="button"
          onClick={() => toggleSpell(row.spell_id)}
          className="w-full flex items-center gap-3 py-3 px-2 bg-transparent border-none text-inherit text-left cursor-pointer"
        >
          <span
            className="w-[9px] h-[9px] rounded-full flex-shrink-0"
            style={{ background: st.dot }}
          />
          <span className="flex-1 text-[15px]">{row.spell_name}</span>
          <span className="text-[11px]" style={{ color: st.dot }}>
            {st.label}
          </span>
          <span className="text-[11px] text-faint">
            {row.journal_count > 0 && `✎${row.journal_count} `}
            {detail ? '▾' : '▸'}
          </span>
        </button>
        {detail && (
          <SpellPanel
            hue={row.grimoire_hue}
            description={row.spell_description}
            status={row.status}
            onStatusChange={(status) => setStatus(row.spell_id, status)}
            entries={entries}
            onAddEntry={(body) => addJournalEntry(row.spell_id, body)}
            onRemoveEntry={(entryId) => removeJournalEntry(row.spell_id, entryId)}
            isCustom={row.is_custom}
            onUntrack={() => untrack(row.spell_id)}
            onDeleteCustom={() => deleteCustom(row.spell_id)}
          />
        )}
      </div>
    )
  }

  if (view === 'adicionar') {
    return (
      <>
        <button
          type="button"
          onClick={() => setView('colecao')}
          className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
        >
          ← Minha coleção
        </button>

        <SectionLabel>Forjar prática pessoal</SectionLabel>
        <Card className="p-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da técnica (ex.: Escaneamento etérico matinal)"
            className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 mb-2 placeholder:text-faint focus:outline-none focus:border-gold"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full box-border bg-white/[.04] border border-gold/25 rounded-lg text-ink text-base p-2.5 resize-y placeholder:text-faint focus:outline-none focus:border-gold"
          />
          <div className="mt-2.5 flex items-center gap-3">
            <GoldButton small disabled={newName.trim().length < 3 || forging} onClick={forge}>
              {forging ? 'Forjando…' : 'Forjar ⚒'}
            </GoldButton>
            <span className="text-[11px] text-faint">Práticas pessoais não concedem XP.</span>
          </div>
        </Card>

        <SectionLabel>Do catálogo Baltazar</SectionLabel>
        {catalogError ? (
          <p className="text-red text-sm text-center py-8">{catalogError}</p>
        ) : catalogSpells === null || grimoires === null ? (
          <p className="text-faint text-sm text-center py-8">Carregando catálogo…</p>
        ) : (
          grimoires.map((g) => {
            const locked = g.is_premium && !g.has_access
            const untracked = catalogSpells.filter((s) => s.grimoire_id === g.id && !trackedIds.has(s.id))
            if (untracked.length === 0) return null
            return (
              <Card key={g.id} className={locked ? 'opacity-55' : ''}>
                <div className="flex items-center gap-3 px-4 pt-3.5 pb-1.5">
                  <span className="w-1 h-[26px] rounded flex-shrink-0" style={{ background: g.hue }} />
                  <span className="flex-1 text-[15px]">{g.title}</span>
                  {locked && <span className="text-xs text-gold">🗝 Círculo</span>}
                </div>
                <div className="px-4 pb-2.5">
                  {untracked.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 py-2.5 px-2 border-t border-white/5">
                      <span className="flex-1">
                        <div className="text-sm">{s.name}</div>
                        <div className="text-[11px] text-muted">
                          {s.description} · {s.xp_reward} XP
                        </div>
                      </span>
                      {locked ? (
                        <span className="text-[11px] text-faint">selada</span>
                      ) : (
                        <GhostButton hue={g.hue} onClick={() => track(s.id)}>
                          + Rastrear
                        </GhostButton>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )
          })
        )}
      </>
    )
  }

  if (collectionError) {
    return <p className="text-red text-sm text-center py-10">{collectionError}</p>
  }

  if (collection === null) {
    return <p className="text-faint text-sm text-center py-10">Carregando coleção…</p>
  }

  const catalogGroups = groups.filter((g) => !g.isCustom)
  const customGroup = groups.find((g) => g.isCustom)

  return (
    <>
      <div className="flex items-center">
        <SectionLabel>Teus grimórios</SectionLabel>
        <div className="flex-1" />
        <GhostButton onClick={openAddScreen}>+ Adicionar técnica</GhostButton>
      </div>

      {catalogGroups.length === 0 && !customGroup && (
        <p className="text-[13px] text-faint text-center py-9 px-5 leading-relaxed">
          Tua coleção está vazia.
          <br />
          Adiciona técnicas do catálogo ou forja as tuas.
        </p>
      )}

      {catalogGroups.map((g) => {
        const dominated = g.rows.filter((r) => r.status === 'dominado').length
        return (
          <Card key={g.key}>
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-1.5">
              <span className="w-1 h-[30px] rounded flex-shrink-0" style={{ background: g.hue }} />
              <span className="flex-1">
                <div className="text-base">{g.title}</div>
                <div className="text-[11px] text-muted">
                  {dominated}/{g.rows.length} dominadas
                </div>
              </span>
            </div>
            <div className="px-4 pb-2">{g.rows.map(renderSpellRow)}</div>
          </Card>
        )
      })}

      {customGroup && (
        <Card>
          <div className="flex items-center gap-3 px-4 pt-3.5 pb-1.5">
            <span className="w-1 h-[30px] rounded flex-shrink-0 bg-muted" />
            <span className="flex-1">
              <div className="text-base">Práticas Pessoais</div>
              <div className="text-[11px] text-muted">forjadas por ti · sem XP</div>
            </span>
            <span className="text-lg">⚒</span>
          </div>
          <div className="px-4 pb-2">{customGroup.rows.map(renderSpellRow)}</div>
        </Card>
      )}

      <p className="text-[11px] text-faint text-center mt-4 leading-relaxed">
        Toca numa técnica para ajustar o estado e registrar tua prática.
      </p>
    </>
  )
}
