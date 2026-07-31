import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const ProfileContext = createContext(undefined)

const EMPTY = {
  profile: null,
  titles: [],
  balance: 0,
  paying: false,
  circleExpiry: null,
  cosmeticTitleName: null,
  equippedItems: [],
  servitorsLowCount: 0,
}

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(EMPTY)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [
      { data: profile },
      { data: titles },
      { data: balance },
      { data: paying },
      { data: circleExpiry },
      { data: equippedItems },
      { data: servitorsLowCount },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, xp_total, title_id, nickname, show_in_ranking, cosmetic_title_id')
        .single(),
      supabase.from('titles').select('*').order('min_xp'),
      supabase.rpc('my_balance'),
      supabase.rpc('am_i_paying'),
      supabase.rpc('my_circle_expiry'),
      supabase.from('user_items').select('item_id, hand, shop_items(*)').eq('equipped', true),
      supabase.rpc('servitors_low_charge_count'),
    ])

    let cosmeticTitleName = null
    if (profile?.cosmetic_title_id) {
      const { data: item } = await supabase
        .from('shop_items')
        .select('name')
        .eq('id', profile.cosmetic_title_id)
        .single()
      cosmeticTitleName = item?.name ?? null
    }

    setState({
      profile: profile ?? null,
      titles: titles ?? [],
      balance: balance ?? 0,
      paying: Boolean(paying),
      circleExpiry: circleExpiry ?? null,
      cosmeticTitleName,
      equippedItems: equippedItems ?? [],
      servitorsLowCount: servitorsLowCount ?? 0,
    })
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      refresh()
    } else {
      setState(EMPTY)
      setLoading(false)
    }
  }, [user, refresh])

  return (
    <ProfileContext.Provider value={{ ...state, loading, refresh }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (ctx === undefined) {
    throw new Error('useProfile deve ser usado dentro de <ProfileProvider>')
  }
  return ctx
}
