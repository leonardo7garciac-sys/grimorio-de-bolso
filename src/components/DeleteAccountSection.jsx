import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const CONFIRM_WORD = 'APAGAR'

export default function DeleteAccountSection() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function cancel() {
    setOpen(false)
    setConfirmText('')
    setError('')
  }

  async function deleteAccount() {
    setBusy(true)
    setError('')

    // Os arquivos no bucket 'servidores' não saem por cascata do banco, e
    // depois da RPC a sessão morre -- precisam ser apagados antes, com a
    // sessão ainda válida.
    const { data: files, error: listError } = await supabase.storage.from('servidores').list(user.id)
    if (listError) {
      setBusy(false)
      setError(listError.message)
      return
    }
    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`)
      const { error: removeError } = await supabase.storage.from('servidores').remove(paths)
      if (removeError) {
        setBusy(false)
        setError(removeError.message)
        return
      }
    }

    const { error: rpcError } = await supabase.rpc('delete_my_account')
    if (rpcError) {
      setBusy(false)
      const permissionIssue =
        rpcError.code === '42501' || /permission|privilege|denied/i.test(rpcError.message ?? '')
      setError(
        permissionIssue
          ? 'Não foi possível apagar a conta agora. Tenta de novo mais tarde ou fala com o suporte.'
          : rpcError.hint || rpcError.message
      )
      return
    }

    await signOut()
  }

  return (
    <div className="mt-10 pt-6 border-t border-red/20">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-faint bg-transparent border-none cursor-pointer"
        >
          apagar minha conta
        </button>
      ) : (
        <div className="border border-red/30 rounded-xl p-4 bg-red/[.05]">
          <div className="text-sm text-red mb-2">Isto é irreversível</div>
          <p className="text-[12px] text-muted leading-relaxed mb-3">
            Ao apagar a conta, você perde para sempre: diário de prática, servidores astrais,
            sigilos forjados, itens, correspondências e todo o progresso. Não há como desfazer
            nem recuperar depois.
          </p>
          <label className="block text-[11px] text-muted mb-1.5">
            Digite <span className="text-red">{CONFIRM_WORD}</span> para confirmar
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={busy}
            className="w-full box-border bg-white/[.04] border border-red/30 rounded-lg text-ink text-base p-2.5 mb-2 focus:outline-none focus:border-red disabled:opacity-60"
          />
          {error && <p className="text-[12px] text-red mb-2 leading-relaxed">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={confirmText !== CONFIRM_WORD || busy}
              onClick={deleteAccount}
              className="tracking-wide rounded-lg cursor-pointer px-3.5 py-2 text-xs border-none bg-red text-navy-deep disabled:opacity-40 disabled:cursor-default"
            >
              {busy ? 'Apagando…' : 'Apagar definitivamente'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={cancel}
              className="bg-transparent border-none text-faint text-xs cursor-pointer disabled:opacity-50"
            >
              cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
