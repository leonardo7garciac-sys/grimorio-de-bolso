import { SectionLabel } from '../components/ui'

export default function SigilizadorTab() {
  return (
    <>
      <SectionLabel>Sigilizador</SectionLabel>
      <div className="text-center px-6 py-12">
        <div className="text-4xl mb-3">🜂</div>
        <div className="text-lg mb-2">Em preparação</div>
        <p className="text-sm text-muted leading-relaxed max-w-[300px] mx-auto">
          A forja de sigilos ainda está sendo erguida. Em breve poderás gerar teu
          próprio glifo aqui, por Kamea, Roda, Spare ou Rosa-Cruz.
        </p>
      </div>
    </>
  )
}
