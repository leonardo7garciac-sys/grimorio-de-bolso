export const TABS = [
  { id: 'grimoires', label: 'Grimórios', icon: '📖', premium: false },
  { id: 'oficio', label: 'Ofício', icon: '🕯', premium: false },
  { id: 'compendio', label: 'Compêndio', icon: '🜏', premium: true },
  { id: 'conclave', label: 'Conclave', icon: '🗣', premium: true },
  { id: 'servidor', label: 'FORJA', icon: '🕸', premium: false },
  { id: 'circle', label: 'Círculo', icon: '👥', premium: false },
]

// Cada aba agrupada reúne duas seções antigas sob um seletor no topo da
// tela. A primeira da lista é a seção padrão ao abrir a aba.
export const TAB_GROUPS = {
  oficio: [
    { id: 'quests', label: 'Quests' },
    { id: 'treasure', label: 'Tesouro' },
  ],
  compendio: [
    { id: 'bestiary', label: 'Bestiário' },
    { id: 'library', label: 'Acervo' },
  ],
  conclave: [
    { id: 'forum', label: 'Fórum' },
    { id: 'ranking', label: 'Ranking' },
  ],
  servidor: [
    { id: 'servidor_astral', label: 'Servidor Astral' },
    { id: 'sigilizador', label: 'Sigilizador', premium: true },
    { id: 'tarot', label: 'Tarot' },
  ],
}

// Rotas de antes do agrupamento (uma aba por seção) → aba nova + seção
// correta. Preservado para qualquer navegação futura (deep link, push)
// que ainda aponte para o id de uma seção isolada.
export const LEGACY_ROUTES = {
  quests: { tab: 'oficio', section: 'quests' },
  treasure: { tab: 'oficio', section: 'treasure' },
  bestiary: { tab: 'compendio', section: 'bestiary' },
  library: { tab: 'compendio', section: 'library' },
  forum: { tab: 'conclave', section: 'forum' },
  ranking: { tab: 'conclave', section: 'ranking' },
}
