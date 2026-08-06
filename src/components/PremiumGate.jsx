import { CIRCULO_CHECKOUT_URL } from '../lib/links'

export default function PremiumGate() {
  return (
    <div className="text-center px-6 py-12">
      <div className="text-4xl mb-3">🗝</div>
      <div className="text-lg mb-2">Câmara selada</div>
      <p className="text-sm text-muted leading-relaxed max-w-[300px] mx-auto mb-4">
        Esta área é reservada aos membros do Círculo Interno. Adquira qualquer
        grimório Baltazar ou assine o Círculo para romper o selo.
      </p>
      <a
        href={CIRCULO_CHECKOUT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block tracking-wide rounded-lg cursor-pointer bg-gradient-to-r from-gold to-gold-light text-navy-deep px-6 py-3 text-sm no-underline"
      >
        Assinar o Círculo
      </a>
    </div>
  )
}
