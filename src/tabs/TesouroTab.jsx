import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { Card, SectionLabel, GoldButton } from '../components/ui'

const KIND_LABEL = {
  arma_magica: 'Arma mágica',
  item_encantado: 'Item encantado',
  titulo_especial: 'Título',
  cosmetico_perfil: 'Cosmético',
}

const KIND_GLYPH = {
  arma_magica: '🗡',
  item_encantado: '🜏',
  titulo_especial: '🔥',
  cosmetico_perfil: '✨',
}

const BUY_MESSAGE = {
  saldo_insuficiente: 'Saldo insuficiente para essa compra.',
  ja_possui: 'Já possuis este item.',
  item_indisponivel: 'Este item não está mais disponível.',
}

export default function TesouroTab() {
  const { profile, balance, refresh: refreshProfile } = useProfile()

  const [view, setView] = useState('loja') // loja | inventario
  const [items, setItems] = useState(null)
  const [inventory, setInventory] = useState([])
  const [imageUrls, setImageUrls] = useState({})
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function loadShop() {
    const [{ data: itemsData, error: itemsError }, { data: invData }] = await Promise.all([
      supabase.from('shop_items').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('user_items').select('item_id, equipped, acquired_at'),
    ])
    if (itemsError) {
      setError(itemsError.message)
      return
    }
    setError('')
    setItems(itemsData ?? [])
    setInventory(invData ?? [])

    const withImages = (itemsData ?? []).filter((i) => i.image_path)
    if (withImages.length > 0) {
      const entries = await Promise.all(
        withImages.map(async (i) => {
          const { data } = await supabase.storage.from('loja').createSignedUrl(i.image_path, 3600)
          return [i.id, data?.signedUrl ?? null]
        })
      )
      setImageUrls(Object.fromEntries(entries))
    }
  }

  useEffect(() => {
    loadShop()
  }, [])

  async function buy(item) {
    setBusyId(item.id)
    const { data, error } = await supabase.rpc('buy_item', { p_item: item.id })
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok') alert(BUY_MESSAGE[data] ?? data)
    await Promise.all([loadShop(), refreshProfile()])
  }

  async function toggleEquip(item, currentlyEquipped) {
    setBusyId(item.id)
    const { data, error } = await supabase.rpc('equip_item', { p_item: item.id, p_equip: !currentlyEquipped })
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok') alert(data)
    await Promise.all([loadShop(), refreshProfile()])
  }

  async function setActiveTitle(itemId) {
    setBusyId(itemId ?? 'title')
    const { data, error } = await supabase.rpc('set_cosmetic_title', { p_item: itemId })
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok') alert(data)
    await refreshProfile()
  }

  if (error) return <p className="text-red text-sm text-center py-10">{error}</p>
  if (items === null) return <p className="text-faint text-sm text-center py-10">Carregando…</p>

  const owned = new Set(inventory.map((r) => r.item_id))
  const equippedSet = new Set(inventory.filter((r) => r.equipped).map((r) => r.item_id))
  const visibleItems = items.filter((i) => view === 'loja' || owned.has(i.id))

  return (
    <>
      <div className="flex items-center mb-3.5">
        <SectionLabel>Tesouro do Mago</SectionLabel>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {['loja', 'inventario'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`text-[11px] px-3 py-1.5 rounded-full border cursor-pointer tracking-wide ${
                view === v ? 'border-gold text-gold' : 'border-white/15 text-muted'
              }`}
            >
              {v === 'inventario' ? 'Inventário' : 'Loja'}
            </button>
          ))}
        </div>
      </div>

      {visibleItems.map((item) => {
        const has = owned.has(item.id)
        const equipped = equippedSet.has(item.id)
        const isTitleKind = item.kind === 'titulo_especial'
        const isActiveTitle = profile?.cosmetic_title_id === item.id
        const url = imageUrls[item.id]
        const busy = busyId === item.id
        return (
          <Card key={item.id} className="p-4 flex gap-3.5 items-center">
            <div
              className="w-[54px] h-[54px] rounded-xl grid place-items-center text-2xl flex-shrink-0 border border-gold/30 overflow-hidden"
              style={{ background: 'radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)' }}
            >
              {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : KIND_GLYPH[item.kind] ?? '❖'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] tracking-wide uppercase text-muted">{KIND_LABEL[item.kind]}</div>
              <div className="text-[15px] mt-0.5">{item.name}</div>
              {item.description && (
                <div className="text-xs text-muted mt-0.5 leading-relaxed">{item.description}</div>
              )}
              <div className="mt-2">
                {!has ? (
                  <GoldButton small disabled={busy || balance < item.price_coins} onClick={() => buy(item)}>
                    {balance < item.price_coins
                      ? `Faltam ${item.price_coins - balance} ✦`
                      : `Adquirir · ${item.price_coins} ✦`}
                  </GoldButton>
                ) : isTitleKind ? (
                  <GoldButton small disabled={busy} onClick={() => setActiveTitle(isActiveTitle ? null : item.id)}>
                    {isActiveTitle ? 'Título em uso · remover' : 'Usar título'}
                  </GoldButton>
                ) : (
                  <GoldButton small disabled={busy} onClick={() => toggleEquip(item, equipped)}>
                    {equipped ? 'Equipado · guardar' : 'Equipar'}
                  </GoldButton>
                )}
              </div>
            </div>
          </Card>
        )
      })}

      {view === 'inventario' && visibleItems.length === 0 && (
        <p className="text-[13px] text-faint text-center py-8">
          Teu cofre está vazio. Completa tarefas para acumular ✦.
        </p>
      )}

      <p className="text-[11px] text-faint text-center mt-3.5 leading-relaxed">
        Itens do Tesouro são cerimoniais: não alteram XP, grau nem ranking.
      </p>
    </>
  )
}
