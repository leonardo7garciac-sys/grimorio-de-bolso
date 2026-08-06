import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// O navegador só procura service worker novo em navegação -- um PWA
// instalado raramente navega de verdade, então sem isto o aviso abaixo
// pode nunca aparecer. Ver 'registration.update()' no visibilitychange.
export default function UpdatePrompt() {
  const registrationRef = useRef(null)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration ?? null
    },
  })

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        registrationRef.current?.update()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  if (!needRefresh) return null

  return (
    <button
      type="button"
      onClick={() => updateServiceWorker(true)}
      className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-gold to-gold-light text-navy-deep text-xs tracking-wide py-2.5 text-center cursor-pointer border-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.625rem)' }}
    >
      nova versão disponível — toque para atualizar
    </button>
  )
}
