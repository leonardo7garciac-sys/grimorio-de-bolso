// src/components/PortalEntrada.jsx
// Tela de transição entre a validação do código de 6 dígitos e o app.
// O símbolo e a tipografia aqui são a especificação — não substituir por
// outro desenho.

import { useEffect, useRef, useState } from 'react'
import { tocarSequenciaPortal, pararSom } from '../lib/audio'

const OURO = '#c9a227'
const OURO_CLARO = '#e8c766'
const FUNDO = '#070d1a'
const TEXTO = '#efe7d2'
const CIRCUITO = '#5f7fb8'

const DURACAO_TOTAL = 6200

export default function PortalEntrada({ estreia, apelido, pronto, onFim }) {
  const [sequenciaFim, setSequenciaFim] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const encerrado = useRef(false)
  const tocou = useRef(false)
  const reduzido =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const frase2 = estreia
    ? 'Primeira travessia do véu. Qual aspecto da realidade vamos alterar hoje?'
    : apelido
      ? `Atravessando novamente o véu, ${apelido}, qual aspecto da realidade vamos alterar hoje?`
      : 'Atravessando novamente o véu. Qual aspecto da realidade vamos alterar hoje?'

  useEffect(() => {
    // Guarda contra remontagem de efeito (StrictMode em dev) -- a
    // sequência só pode ser agendada uma vez por montagem real do Portal.
    if (!reduzido && !tocou.current) {
      tocou.current = true
      tocarSequenciaPortal()
    }
    const t = setTimeout(() => setSequenciaFim(true), reduzido ? 2600 : DURACAO_TOTAL)
    return () => clearTimeout(t)
  }, [reduzido])

  useEffect(() => {
    if (sequenciaFim && pronto) encerrar()
  }, [sequenciaFim, pronto])

  function encerrar() {
    if (encerrado.current) return
    encerrado.current = true
    pararSom()
    setSaindo(true)
    setTimeout(onFim, 320)
  }

  return (
    <div
      onClick={encerrar}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: FUNDO,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: saindo ? 0 : 1,
        transition: 'opacity 320ms ease-out',
      }}
    >
      <style>{`
        @keyframes portal-emergir {
          0%   { transform: scale(0.35) rotate(-14deg); opacity: 0; }
          16%  { transform: scale(1) rotate(0deg); opacity: 1; }
          90%  { transform: scale(1.04) rotate(4deg); opacity: 1; }
          100% { transform: scale(1.12) rotate(6deg); opacity: 0; }
        }
        @keyframes portal-nucleo {
          0%, 100% { r: 9; opacity: 0.95; }
          50%      { r: 13; opacity: 0.5; }
        }
        @keyframes portal-frase1 {
          0%, 22%   { opacity: 0; }
          26%, 46%  { opacity: 1; }
          52%, 100% { opacity: 0; }
        }
        @keyframes portal-frase2 {
          0%, 56%  { opacity: 0; }
          64%, 96% { opacity: 1; }
          100%     { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .portal-simbolo { animation: none !important; opacity: 1 !important; }
          .portal-nucleo { animation: none !important; }
        }
      `}</style>

      <svg
        className="portal-simbolo"
        viewBox="0 0 290 290"
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 'min(92vw, 420px)',
          height: 'min(92vw, 420px)',
          animation: `portal-emergir ${DURACAO_TOTAL}ms ease-out forwards`,
        }}
      >
        <g stroke={OURO} fill="none">
          <circle cx="145" cy="145" r="138" strokeWidth="0.6" opacity="0.35" />
          <circle cx="145" cy="145" r="118" strokeWidth="0.5" strokeDasharray="1 9" opacity="0.7" />
          <circle cx="145" cy="145" r="74" strokeWidth="0.5" opacity="0.4" />
          <path d="M145 27 L247 204 L43 204 Z" strokeWidth="0.7" opacity="0.55" />
          <path d="M145 263 L43 86 L247 86 Z" strokeWidth="0.7" opacity="0.55" />
          <path
            d="M145 71 L145 27 M145 219 L145 263 M62 97 L27 76 M228 193 L263 214 M62 193 L27 214 M228 97 L263 76"
            strokeWidth="0.6"
            opacity="0.5"
          />
          <path
            d="M27 76 L14 76 M263 76 L276 76 M27 214 L14 214 M263 214 L276 214"
            strokeWidth="0.6"
            opacity="0.3"
          />
        </g>
        <g fill={OURO_CLARO}>
          <circle cx="145" cy="27" r="2.4" />
          <circle cx="27" cy="76" r="1.8" />
          <circle cx="263" cy="76" r="1.8" />
          <circle cx="27" cy="214" r="1.8" />
          <circle cx="263" cy="214" r="1.8" />
          <circle cx="145" cy="263" r="2.4" />
        </g>
        <g stroke={CIRCUITO} fill="none" opacity="0.55">
          <path d="M105 145 L120 145 L128 133 L162 133 L170 145 L185 145" strokeWidth="0.7" />
          <path d="M105 145 L120 145 L128 157 L162 157 L170 145 L185 145" strokeWidth="0.7" />
        </g>
        <circle
          className="portal-nucleo"
          cx="145"
          cy="145"
          r="9"
          fill={OURO_CLARO}
          style={{ animation: 'portal-nucleo 3.4s ease-in-out infinite' }}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '0 32px',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            margin: 0,
            position: 'absolute',
            left: 32,
            right: 32,
            top: -8,
            fontSize: 12,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: OURO,
            opacity: 0,
            animation: `portal-frase1 ${DURACAO_TOTAL}ms ease-in-out forwards`,
          }}
        >
          Conexão com egrégora confirmada
        </p>
        <p
          style={{
            margin: 0,
            position: 'absolute',
            left: 32,
            right: 32,
            top: -34,
            fontSize: 16,
            lineHeight: 1.65,
            color: TEXTO,
            fontFamily: 'Georgia, "Times New Roman", serif',
            opacity: 0,
            animation: `portal-frase2 ${DURACAO_TOTAL}ms ease-in-out forwards`,
          }}
        >
          {frase2}
        </p>
      </div>
    </div>
  )
}
