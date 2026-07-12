import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionLabel, GhostButton } from '../../components/ui'

const KIND_LABEL = {
  arma_magica: 'Arma mágica',
  item_encantado: 'Item encantado',
  titulo_especial: 'Título',
  cosmetico_perfil: 'Cosmético',
}
const KIND_GLYPH = { arma_magica: '🗡', item_encantado: '🜏', titulo_especial: '🔥', cosmetico_perfil: '✨' }

export default function FriendProfileView({ friendId, friendNickname, onBack, onProposeTrade, onBlocked }) {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [itemImages, setItemImages] = useState({})
  const [sigilUrl, setSigilUrl] = useState(null)
  const [blocking, setBlocking] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId])

  async function load() {
    setProfile(null)
    setError('')
    const { data, error } = await supabase.rpc('friend_profile', { p_friend: friendId }).single()
    if (error) {
      setError(error.message)
      return
    }
    setProfile(data)

    const items = data?.items ?? []
    const withImages = items.filter((i) => i.image_path)
    if (withImages.length > 0) {
      const entries = await Promise.all(
        withImages.map(async (i) => {
          const { data: signed } = await supabase.storage.from('loja').createSignedUrl(i.image_path, 3600)
          return [i.image_path, signed?.signedUrl ?? null]
        })
      )
      setItemImages(Object.fromEntries(entries))
    }

    if (data?.servitor?.sigil_path) {
      const { data: signed } = await supabase.storage.from('servidores').createSignedUrl(data.servitor.sigil_path, 3600)
      setSigilUrl(signed?.signedUrl ?? null)
    } else {
      setSigilUrl(null)
    }
  }

  async function block() {
    const ok = window.confirm(
      `Bloquear ${friendNickname}? A amizade será desfeita e ele não poderá te adicionar, propor trocas ou enviar mensagens. Ele não será notificado.`
    )
    if (!ok) return
    setBlocking(true)
    const { data, error } = await supabase.rpc('block_user', { p_nickname: friendNickname })
    setBlocking(false)
    if (error) {
      alert(error.message)
      return
    }
    if (data !== 'ok') {
      alert(data)
      return
    }
    onBlocked?.()
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="bg-transparent border-none text-gold text-sm cursor-pointer pb-3.5"
      >
        ← Amigos
      </button>

      {error ? (
        <p className="text-red text-sm text-center py-10">{error}</p>
      ) : profile === null ? (
        <p className="text-faint text-sm text-center py-10">Carregando perfil…</p>
      ) : (
        <>
          <div className="flex flex-col items-center text-center mb-4">
            <span className="text-3xl text-gold">{profile.title_glyph}</span>
            <div className="text-lg mt-2">{friendNickname}</div>
            <div className="text-xs text-muted">
              {profile.title_name}
              {profile.cosmetic_title ? ` · ${profile.cosmetic_title}` : ''}
            </div>
            <div className="text-xs text-gold mt-1">{profile.xp_total} XP</div>
            <div className="flex gap-2 mt-3">
              <GhostButton onClick={() => onProposeTrade(friendId)}>Propor troca</GhostButton>
              <GhostButton hue="var(--color-red)" disabled={blocking} onClick={block}>
                {blocking ? 'Bloqueando…' : 'Bloquear'}
              </GhostButton>
            </div>
          </div>

          {profile.servitor && (
            <>
              <SectionLabel>Servidor ativo</SectionLabel>
              <Card className="p-3.5 flex items-center gap-3.5">
                <div
                  className="w-14 h-14 rounded-full grid place-items-center border border-gold/30 overflow-hidden flex-shrink-0"
                  style={{ background: 'radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)' }}
                >
                  {sigilUrl ? <img src={sigilUrl} alt="" className="w-full h-full object-cover" /> : <span>🕸</span>}
                </div>
                <div>
                  <div className="text-sm">{profile.servitor.name}</div>
                  <div
                    className={`text-[10px] uppercase tracking-wide mt-0.5 ${
                      profile.servitor.is_charged ? 'text-green' : 'text-red'
                    }`}
                  >
                    {profile.servitor.is_charged ? 'Carregado' : 'Carga baixa'}
                  </div>
                </div>
              </Card>
            </>
          )}

          <SectionLabel>Itens adquiridos</SectionLabel>
          {!profile.items || profile.items.length === 0 ? (
            <p className="text-[13px] text-faint text-center py-6">Nenhum item ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {profile.items.map((item, i) => (
                <div
                  key={i}
                  className="border border-gold/20 rounded-xl bg-white/[.02] p-3.5 flex flex-col items-center text-center gap-1.5"
                >
                  <div
                    className="w-14 h-14 rounded-xl grid place-items-center text-2xl border border-gold/30 overflow-hidden"
                    style={{ background: 'radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)' }}
                  >
                    {item.image_path && itemImages[item.image_path] ? (
                      <img src={itemImages[item.image_path]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      KIND_GLYPH[item.kind] ?? '❖'
                    )}
                  </div>
                  <div className="text-[13px]">{item.name}</div>
                  <div className="text-[10px] text-muted uppercase tracking-wide">
                    {KIND_LABEL[item.kind] ?? item.kind}
                  </div>
                  {item.equipped && <div className="text-[10px] text-gold">equipado</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
