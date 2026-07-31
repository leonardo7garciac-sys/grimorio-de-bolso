import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import AvatarEtereo from './AvatarEtereo'
import { SectionLabel } from './ui'

const AURA_SLUG = 'aura-dourada'
const MOON_RING_SLUG = 'moldura-lunar'

const KIND_LABEL = { arma_magica: 'Arma mágica', item_encantado: 'Item encantado' }
const KIND_GLYPH = { arma_magica: '🗡', item_encantado: '🜏' }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function MagoScreen({ onClose }) {
  const { profile, titles, balance, circleExpiry, cosmeticTitleName, equippedItems, refresh } = useProfile()
  const [imageUrls, setImageUrls] = useState({})
  const [equippedImageUrls, setEquippedImageUrls] = useState({})
  const [busyId, setBusyId] = useState(null)

  const arsenal = useMemo(
    () => equippedItems.filter((e) => ['arma_magica', 'item_encantado'].includes(e.shop_items?.kind)),
    [equippedItems]
  )
  const cosmetics = useMemo(
    () => equippedItems.filter((e) => e.shop_items?.kind === 'cosmetico_perfil').map((e) => e.shop_items),
    [equippedItems]
  )
  const weaponRow = useMemo(() => arsenal.find((e) => e.shop_items.kind === 'arma_magica'), [arsenal])
  const relics = useMemo(() => arsenal.filter((e) => e.shop_items.kind === 'item_encantado'), [arsenal])

  useEffect(() => {
    const withImages = arsenal.filter((e) => e.shop_items.image_path)
    if (withImages.length === 0) return
    let cancelled = false
    Promise.all(
      withImages.map(async (e) => {
        const { data } = await supabase.storage.from('loja').createSignedUrl(e.shop_items.image_path, 3600)
        return [e.item_id, data?.signedUrl ?? null]
      })
    ).then((entries) => {
      if (!cancelled) setImageUrls(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [arsenal])

  // Arte específica para renderização sobre o avatar — cai para
  // imageUrls (vitrine) quando o item não tem image_path_equipped.
  useEffect(() => {
    const withEquippedImages = arsenal.filter((e) => e.shop_items.image_path_equipped)
    if (withEquippedImages.length === 0) {
      setEquippedImageUrls({})
      return
    }
    let cancelled = false
    Promise.all(
      withEquippedImages.map(async (e) => {
        const { data } = await supabase.storage
          .from('loja')
          .createSignedUrl(e.shop_items.image_path_equipped, 3600)
        return [e.item_id, data?.signedUrl ?? null]
      })
    ).then((entries) => {
      if (!cancelled) setEquippedImageUrls(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [arsenal])

  async function unequip(itemId) {
    setBusyId(itemId)
    const { error } = await supabase.rpc('equip_item', { p_item: itemId, p_equip: false })
    setBusyId(null)
    if (error) {
      alert(error.message)
      return
    }
    await refresh()
  }

  if (!profile || titles.length === 0) return null

  let idx = 0
  titles.forEach((t, i) => {
    if (profile.xp_total >= t.min_xp) idx = i
  })
  const current = titles[idx]
  const next = titles[idx + 1]
  const progress = next ? ((profile.xp_total - current.min_xp) / (next.min_xp - current.min_xp)) * 100 : 100

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-navy-deep">
      <div
        className="max-w-md mx-auto px-5 pb-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border-none text-gold text-sm cursor-pointer pb-1.5"
        >
          ← Voltar
        </button>

        <div className="flex flex-col items-center text-center mb-2">
          <AvatarEtereo
            glyph={current.glyph}
            weapon={weaponRow ? { ...weaponRow.shop_items, hand: weaponRow.hand } : null}
            weaponUrl={weaponRow ? equippedImageUrls[weaponRow.item_id] ?? imageUrls[weaponRow.item_id] : null}
            relics={relics.map((e) => ({
              item: { ...e.shop_items, hand: e.hand },
              url: equippedImageUrls[e.item_id] ?? imageUrls[e.item_id],
            }))}
            hasAura={cosmetics.some((c) => c.slug === AURA_SLUG)}
            hasMoonRing={cosmetics.some((c) => c.slug === MOON_RING_SLUG)}
          />
          <div className="text-lg mt-2">{current.name}</div>
          {cosmeticTitleName && <div className="text-sm text-gold mt-1">{cosmeticTitleName}</div>}

          <div className="w-full max-w-[220px] h-[6px] rounded-full bg-white/10 my-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-muted">
            {profile.xp_total} XP{' '}
            {next ? `· ${next.min_xp - profile.xp_total} até ${next.name}` : '· grau máximo'}
          </div>
          <div className="text-xs text-gold mt-1.5">
            {balance} ✦{circleExpiry && ` · Círculo até ${formatDate(circleExpiry)}`}
          </div>
        </div>

        <SectionLabel>Arsenal do Mago</SectionLabel>
        {arsenal.length === 0 ? (
          <p className="text-[13px] text-faint text-center py-9 px-5 leading-relaxed">
            Teu arsenal aguarda — visita o Tesouro para equipar armas e itens encantados.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {arsenal.map((e) => {
              const item = e.shop_items
              const url = imageUrls[e.item_id]
              return (
                <div
                  key={e.item_id}
                  className="border border-gold/20 rounded-xl bg-white/[.02] p-3.5 flex flex-col items-center text-center gap-1.5"
                >
                  <div
                    className="w-14 h-14 rounded-xl grid place-items-center text-2xl border border-gold/30 overflow-hidden"
                    style={{ background: 'radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)' }}
                  >
                    {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : KIND_GLYPH[item.kind] ?? '❖'}
                  </div>
                  <div className="text-[13px] mt-1">{item.name}</div>
                  <div className="text-[10px] text-muted uppercase tracking-wide">{KIND_LABEL[item.kind]}</div>
                  <button
                    type="button"
                    disabled={busyId === e.item_id}
                    onClick={() => unequip(e.item_id)}
                    className="text-[11px] text-faint bg-transparent border-none cursor-pointer mt-1 disabled:opacity-50"
                  >
                    guardar
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
