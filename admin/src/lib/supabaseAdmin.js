import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

export const envReady = Boolean(url && serviceRoleKey)

// service_role ignora RLS por completo — nunca usar esta chave fora de um
// app que roda só localmente (ver README.md).
export const supabaseAdmin = createClient(url ?? '', serviceRoleKey ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
})
