import React, { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────
// GRIMÓRIO DE BOLSO — protótipo v5
// Abas: Grimórios · Quests · Tesouro · Bestiário · Acervo · Fórum · Ranking
// Novidades v5 (curadoria da coleção):
//  • "Teus Grimórios" agora mostra só as técnicas que o usuário RASTREIA
//  • Tela "Adicionar técnica": catálogo por grimório + forjar skill própria
//  • Seção "Práticas Pessoais" (skills criadas pelo usuário — 0 XP,
//    com status e diário; não afetam grau nem ranking)
//  • Deixar de rastrear preserva progresso e diário
// Mantém tudo da v4: diário por técnica, quests, tesouro, título etc.
// ─────────────────────────────────────────────────────────────

const GOLD = "#c9962e";
const GOLD_LIGHT = "#f2d98c";
const INK = "#e8e3d3";
const MUTED = "#8a93a8";
const FAINT = "#5a6478";
const GREEN = "#6fbf8e";
const RED = "#c96a4a";
const PURPLE = "#8a7fd6";

const TITLES = [
  { name: "Neófito", min: 0, glyph: "☿" },
  { name: "Zelator", min: 100, glyph: "🜂" },
  { name: "Praticante", min: 300, glyph: "🜄" },
  { name: "Adepto", min: 700, glyph: "🜁" },
  { name: "Magus", min: 1500, glyph: "🜃" },
  { name: "Ipsissimus", min: 3000, glyph: "✶" },
];

// catálogo oficial (owner_id = null no banco)
const CATALOG = [
  {
    id: "fogo", title: "O Fogo Interior", hue: GOLD, premium: false,
    spells: [
      { id: "f1", name: "Respiração da Chama", desc: "Ritmo respiratório de concentração.", xp: 40 },
      { id: "f2", name: "Concentração no Ponto", desc: "Dharana sobre um foco único.", xp: 30 },
      { id: "f3", name: "A Vontade Verdadeira", desc: "Descoberta do propósito central.", xp: 60 },
    ],
  },
  {
    id: "sigilos", title: "Sigilos & Caos", hue: PURPLE, premium: false,
    spells: [
      { id: "s1", name: "Método das Sentenças", desc: "Construção clássica de sigilos.", xp: 40 },
      { id: "s2", name: "Carga por Gnose", desc: "Ativação em estado alterado.", xp: 50 },
      { id: "s3", name: "Esquecimento Deliberado", desc: "Liberar o sigilo da mente consciente.", xp: 45 },
    ],
  },
  {
    id: "mascaras", title: "Máscaras Divinas", hue: RED, premium: true,
    spells: [
      { id: "m1", name: "Assunção da Forma-Deus", desc: "Vestir a máscara da deidade.", xp: 70 },
      { id: "m2", name: "Vibração do Nome Bárbaro", desc: "Entonação ritual dos nomes de poder.", xp: 55 },
    ],
  },
];

const QUESTS_INIT = [
  { id: "q1", title: "Prática do dia", desc: "10 minutos de meditação ou respiração ritual.", freq: "diária", proof: "nenhuma", coins: 5, state: "disponivel" },
  { id: "q2", title: "Diário do mago", desc: "Registre em poucas linhas sua prática ou insight de hoje.", freq: "diária", proof: "relato", coins: 10, state: "disponivel" },
  { id: "q3", title: "Sigilo da Semana", desc: "Crie e carregue um sigilo. Envie a foto do sigilo desenhado.", freq: "semanal", proof: "foto", coins: 40, state: "disponivel" },
  { id: "q4", title: "Travessia do Véu", desc: "Tente uma projeção astral e relate a experiência.", freq: "semanal", proof: "relato", coins: 30, state: "aprovada" },
];

const SHOP_INIT = [
  { id: "i1", kind: "arma_magica", name: "Athame de Obsidiana", desc: "Lâmina ritual do teu arsenal astral.", price: 450, glyph: "🗡" },
  { id: "i2", kind: "arma_magica", name: "Cajado do Carvalho Antigo", desc: "Condutor de vontade dos velhos bosques.", price: 600, glyph: "🪄" },
  { id: "i3", kind: "item_encantado", name: "Talismã de Saturno", desc: "Selo planetário de disciplina e estrutura.", price: 250, glyph: "🜏" },
  { id: "i4", kind: "titulo_especial", name: "Portador da Chama", desc: "Título cerimonial exibido junto ao teu grau.", price: 300, glyph: "🔥" },
  { id: "i5", kind: "cosmetico_perfil", name: "Aura Dourada", desc: "Halo dourado ao redor do teu sigilo de perfil.", price: 350, glyph: "✨" },
  { id: "i6", kind: "cosmetico_perfil", name: "Moldura Lunar", desc: "Anel de fases da lua no teu perfil.", price: 200, glyph: "🌙" },
];

const KIND_LABEL = {
  arma_magica: "Arma mágica", item_encantado: "Item encantado",
  titulo_especial: "Título", cosmetico_perfil: "Cosmético",
};

const BESTIARY = [
  { id: "b1", name: "Salamandra", kind: "criatura", pantheon: "Elemental", epi: "lenda", glyph: "🜂", summary: "Espírito ígneo dos alquimistas, senhora do fogo transformador." },
  { id: "b2", name: "Hécate", kind: "deidade", pantheon: "Grego", epi: "tradição", glyph: "🌒", summary: "Deusa tríplice das encruzilhadas, da magia e dos limiares." },
  { id: "b3", name: "Egrégora", kind: "espírito", pantheon: "Hermético", epi: "relato", glyph: "👁", summary: "Entidade coletiva nutrida pela atenção de muitos praticantes." },
  { id: "b4", name: "Mandrágora", kind: "flora", pantheon: "Europeu", epi: "lenda", glyph: "🜃", summary: "Raiz de forma humana, guardiã de segredos ctônicos." },
];
const EPI_COLORS = { lenda: PURPLE, tradição: RED, relato: GOLD };

const LIBRARY = [
  { id: "l1", title: "Corpus Hermeticum", author: "Hermes Trismegisto", era: "séc. II–III", tradition: "Hermetismo", excerpt: "O que está embaixo é como o que está em cima...", commentary: "O axioma da correspondência que fundamenta a prática hermética posterior." },
  { id: "l2", title: "De Occulta Philosophia", author: "Cornelius Agrippa", era: "1533", tradition: "Magia Renascentista", excerpt: "A magia é a faculdade de maravilhosa virtude...", commentary: "Agrippa sistematizou três mundos — elemental, celeste e intelectual." },
];

const FORUM_INIT = [
  { id: "p1", cat: "experimento", author: "Corvo de Saturno", title: "30 dias de sigilos: registro metódico", body: "Documentei carga, esquecimento e resultados de 12 sigilos...", comments: 7 },
  { id: "p2", cat: "discussão", author: "Íris Ctônica", title: "Egrégoras: modelo psicológico ou espiritual?", body: "Proponho debatermos os dois modelos com honestidade epistêmica...", comments: 12 },
  { id: "p3", cat: "parceria", author: "Aprendiz do Véu", title: "Grupo de estudo: Corpus Hermeticum", body: "Procuro 3–4 magos para leitura semanal comentada...", comments: 4 },
];
const CAT_LABEL = { experimento: "Experimento", discussão: "Discussão", parceria: "Parceria" };
const CAT_HUE = { experimento: GOLD, discussão: PURPLE, parceria: GREEN };

const RANKING = [
  { nick: "Corvo de Saturno", xp: 320, pos: 1 },
  { nick: "Íris Ctônica", xp: 280, pos: 2 },
  { nick: "Lumen Noctis", xp: 240, pos: 3 },
  { nick: "Você (Baltazar)", xp: 80, pos: 7, me: true },
];

const STATUS = {
  novo: { label: "Não iniciado", dot: FAINT },
  praticando: { label: "Em prática", dot: GOLD },
  dominado: { label: "Dominado", dot: GREEN },
};

// ── utilitários ──────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      border: "1px solid rgba(201,150,46,.18)", borderRadius: 12,
      background: "rgba(255,255,255,.02)", marginBottom: 12,
      overflow: "hidden", ...style
    }}>{children}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: MUTED, margin: "6px 0 14px" }}>
      {children}
    </div>
  );
}

function GoldButton({ children, onClick, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "rgba(255,255,255,.08)" : `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
      color: disabled ? FAINT : "#0a1024", border: "none", borderRadius: 8,
      padding: small ? "8px 14px" : "12px 24px", fontSize: small ? 12 : 14,
      fontFamily: "inherit", cursor: disabled ? "default" : "pointer", letterSpacing: 1,
    }}>{children}</button>
  );
}

function GhostButton({ children, onClick, hue = GOLD }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: `1px solid ${hue}`, color: hue,
      borderRadius: 8, padding: "7px 13px", fontSize: 12, fontFamily: "inherit",
      cursor: "pointer", letterSpacing: 0.5,
    }}>{children}</button>
  );
}

function PremiumGate({ onUnlock }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 42, marginBottom: 12 }}>🗝</div>
      <div style={{ fontSize: 19, marginBottom: 8 }}>Câmara selada</div>
      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 300, margin: "0 auto 20px" }}>
        Esta área é reservada aos membros do Círculo Interno.
        Adquira qualquer grimório Baltazar para romper o selo.
      </p>
      <GoldButton onClick={onUnlock}>Romper o selo (demo)</GoldButton>
    </div>
  );
}

// ── painel de técnica (status + diário) — usado na coleção ──

function SpellPanel({ spell, hue, status, setStatus, entries, addEntry, removeEntry, onUntrack, isCustom, onDeleteCustom }) {
  const [draft, setDraft] = useState("");
  return (
    <div style={{ margin: "0 0 12px 20px", paddingLeft: 14, borderLeft: `2px solid ${hue}` }}>
      {/* seletor de status */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {Object.keys(STATUS).map((st) => (
          <button key={st} onClick={() => setStatus(st)} style={{
            fontSize: 11, padding: "5px 11px", borderRadius: 20, font: "inherit",
            border: `1px solid ${status === st ? STATUS[st].dot : "rgba(255,255,255,.14)"}`,
            background: status === st ? "rgba(255,255,255,.05)" : "transparent",
            color: status === st ? STATUS[st].dot : MUTED, cursor: "pointer",
          }}>
            {STATUS[st].label}
          </button>
        ))}
      </div>

      {/* diário */}
      <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
        Diário de práticas
      </div>
      <textarea
        value={draft} onChange={(e) => setDraft(e.target.value)}
        placeholder="O que a prática de hoje revelou?"
        rows={2}
        style={{
          width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(201,150,46,.25)", borderRadius: 8, color: INK,
          font: "inherit", fontSize: 13, padding: 10, resize: "vertical",
        }}
      />
      <div style={{ margin: "8px 0 12px" }}>
        <GoldButton small disabled={!draft.trim()} onClick={() => { addEntry(draft.trim()); setDraft(""); }}>
          Registrar
        </GoldButton>
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: 12, color: FAINT, margin: "0 0 10px" }}>
          Nenhum registro ainda. Cada entrada é um marco da tua jornada com esta técnica.
        </p>
      ) : (
        entries.map((e) => (
          <div key={e.id} style={{ padding: "9px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 10, color: FAINT, flexShrink: 0 }}>{e.date}</span>
              <span style={{ flex: 1 }} />
              <button onClick={() => removeEntry(e.id)} style={{
                background: "none", border: "none", color: FAINT, fontSize: 10,
                cursor: "pointer", font: "inherit",
              }}>apagar</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 3, opacity: 0.9 }}>{e.text}</div>
          </div>
        ))
      )}

      {/* rodapé do painel: sair da coleção */}
      <div style={{ paddingTop: 10, borderTop: "1px solid rgba(255,255,255,.05)" }}>
        {isCustom ? (
          <button onClick={onDeleteCustom} style={{
            background: "none", border: "none", color: RED, fontSize: 11,
            cursor: "pointer", font: "inherit",
          }}>
            apagar prática pessoal (o diário se perde junto)
          </button>
        ) : (
          <button onClick={onUntrack} style={{
            background: "none", border: "none", color: FAINT, fontSize: 11,
            cursor: "pointer", font: "inherit",
          }}>
            deixar de rastrear (progresso e diário ficam guardados)
          </button>
        )}
      </div>
    </div>
  );
}

// ── aba: grimórios (coleção curada) ──────────────────────────

function GrimoiresTab({ tracked, setTracked, custom, setCustom, journal, addJournal, removeJournal, paid }) {
  const [view, setView] = useState("colecao");     // colecao | adicionar
  const [spellOpen, setSpellOpen] = useState(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const allCatalogSpells = CATALOG.flatMap((g) => g.spells.map((s) => ({ ...s, g })));

  function setStatus(spellId, status) {
    setTracked((prev) => ({ ...prev, [spellId]: status }));
  }
  function track(spellId) {
    setTracked((prev) => ({ ...prev, [spellId]: prev[spellId] ?? "novo" }));
    setView("colecao");
  }
  function untrack(spellId) {
    setTracked((prev) => {
      const { [spellId]: _, ...rest } = prev;
      return { ...rest, [`_saved_${spellId}`]: prev[spellId] }; // demo: guarda progresso
    });
    setSpellOpen(null);
  }
  function retrieveSaved(spellId, prev) {
    return prev[`_saved_${spellId}`] ?? "novo";
  }
  function forge() {
    const id = `c${Date.now()}`;
    setCustom((prev) => [...prev, { id, name: newName.trim(), desc: newDesc.trim() }]);
    setTracked((prev) => ({ ...prev, [id]: "novo" }));
    setNewName(""); setNewDesc(""); setView("colecao");
  }
  function deleteCustom(id) {
    setCustom((prev) => prev.filter((c) => c.id !== id));
    setTracked((prev) => { const { [id]: _, ...rest } = prev; return rest; });
    setSpellOpen(null);
  }

  // ── tela ADICIONAR ──
  if (view === "adicionar") {
    return (
      <>
        <button onClick={() => setView("colecao")} style={{
          background: "none", border: "none", color: GOLD, font: "inherit",
          fontSize: 13, cursor: "pointer", padding: "0 0 14px",
        }}>← Minha coleção</button>

        <SectionLabel>Forjar prática pessoal</SectionLabel>
        <Card style={{ padding: 16 }}>
          <input
            value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da técnica (ex.: Escaneamento etérico matinal)"
            style={{
              width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(201,150,46,.25)", borderRadius: 8, color: INK,
              font: "inherit", fontSize: 14, padding: 10, marginBottom: 8,
            }}
          />
          <textarea
            value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descrição (opcional)" rows={2}
            style={{
              width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(201,150,46,.25)", borderRadius: 8, color: INK,
              font: "inherit", fontSize: 13, padding: 10, resize: "vertical",
            }}
          />
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <GoldButton small disabled={newName.trim().length < 3} onClick={forge}>Forjar ⚒</GoldButton>
            <span style={{ fontSize: 11, color: FAINT }}>Práticas pessoais não concedem XP.</span>
          </div>
        </Card>

        <SectionLabel>Do catálogo Baltazar</SectionLabel>
        {CATALOG.map((g) => {
          const locked = g.premium && !paid;
          const untracked = g.spells.filter((s) => !(s.id in tracked));
          if (untracked.length === 0) return null;
          return (
            <Card key={g.id} style={{ opacity: locked ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 6px" }}>
                <span style={{ width: 4, height: 26, borderRadius: 4, background: g.hue }} />
                <span style={{ fontSize: 15, flex: 1 }}>{g.title}</span>
                {locked && <span style={{ fontSize: 12, color: GOLD }}>🗝 Círculo</span>}
              </div>
              <div style={{ padding: "0 16px 10px" }}>
                {untracked.map((s) => (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "11px 8px",
                    borderTop: "1px solid rgba(255,255,255,.05)",
                  }}>
                    <span style={{ flex: 1 }}>
                      <div style={{ fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{s.desc} · {s.xp} XP</div>
                    </span>
                    {locked
                      ? <span style={{ fontSize: 11, color: FAINT }}>selada</span>
                      : <GhostButton hue={g.hue} onClick={() => track(s.id)}>+ Rastrear</GhostButton>}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </>
    );
  }

  // ── tela COLEÇÃO ──
  const sections = CATALOG.map((g) => ({
    ...g,
    trackedSpells: g.spells.filter((s) => s.id in tracked),
  })).filter((g) => g.trackedSpells.length > 0);

  const renderSpellRow = (s, hue, isCustom = false) => {
    const detail = spellOpen === s.id;
    const entries = journal[s.id] || [];
    const status = tracked[s.id];
    return (
      <div key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <button onClick={() => setSpellOpen(detail ? null : s.id)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "12px 8px", background: "transparent", border: "none",
          color: "inherit", cursor: "pointer", textAlign: "left", font: "inherit",
        }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS[status].dot, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 15 }}>{s.name}</span>
          <span style={{ fontSize: 11, color: STATUS[status].dot }}>{STATUS[status].label}</span>
          <span style={{ fontSize: 11, color: FAINT }}>
            {entries.length > 0 && `✎${entries.length} `}{detail ? "▾" : "▸"}
          </span>
        </button>
        {detail && (
          <SpellPanel
            spell={s} hue={hue} status={status}
            setStatus={(st) => setStatus(s.id, st)}
            entries={entries}
            addEntry={(t) => addJournal(s.id, t)}
            removeEntry={(eid) => removeJournal(s.id, eid)}
            onUntrack={() => untrack(s.id)}
            isCustom={isCustom}
            onDeleteCustom={() => deleteCustom(s.id)}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <SectionLabel>Teus grimórios</SectionLabel>
        <div style={{ flex: 1 }} />
        <GhostButton onClick={() => setView("adicionar")}>+ Adicionar técnica</GhostButton>
      </div>

      {sections.length === 0 && custom.length === 0 && (
        <p style={{ fontSize: 13, color: FAINT, textAlign: "center", padding: "36px 20px", lineHeight: 1.7 }}>
          Tua coleção está vazia.<br />Adiciona técnicas do catálogo ou forja as tuas.
        </p>
      )}

      {sections.map((g) => (
        <Card key={g.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 6px" }}>
            <span style={{ width: 4, height: 30, borderRadius: 4, background: g.hue }} />
            <span style={{ flex: 1 }}>
              <div style={{ fontSize: 16 }}>{g.title}</div>
              <div style={{ fontSize: 11, color: MUTED }}>
                {g.trackedSpells.filter((s) => tracked[s.id] === "dominado").length}/{g.trackedSpells.length} dominadas
              </div>
            </span>
          </div>
          <div style={{ padding: "0 16px 8px" }}>
            {g.trackedSpells.map((s) => renderSpellRow(s, g.hue))}
          </div>
        </Card>
      ))}

      {custom.length > 0 && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 6px" }}>
            <span style={{ width: 4, height: 30, borderRadius: 4, background: MUTED }} />
            <span style={{ flex: 1 }}>
              <div style={{ fontSize: 16 }}>Práticas Pessoais</div>
              <div style={{ fontSize: 11, color: MUTED }}>forjadas por ti · sem XP</div>
            </span>
            <span style={{ fontSize: 18 }}>⚒</span>
          </div>
          <div style={{ padding: "0 16px 8px" }}>
            {custom.map((c) => renderSpellRow(c, MUTED, true))}
          </div>
        </Card>
      )}

      <p style={{ fontSize: 11, color: FAINT, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
        Toca numa técnica para ajustar o estado e registrar tua prática.
      </p>
    </>
  );
}

// ── aba: quests ──────────────────────────────────────────────

function QuestsTab({ quests, submit }) {
  const [proofFor, setProofFor] = useState(null);
  const [text, setText] = useState("");
  const STATE_UI = {
    disponivel: { label: null, color: null },
    pendente: { label: "Aguardando o Conselho", color: GOLD },
    aprovada: { label: "Aprovada ✦", color: GREEN },
    rejeitada: { label: "Rejeitada — tente no próximo ciclo", color: RED },
  };
  return (
    <>
      <SectionLabel>Tarefas do ciclo</SectionLabel>
      {quests.map((q) => {
        const ui = STATE_UI[q.state];
        const open = proofFor === q.id;
        return (
          <Card key={q.id} style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <span style={{
                fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase",
                color: q.freq === "semanal" ? PURPLE : MUTED,
                border: `1px solid ${q.freq === "semanal" ? PURPLE : "rgba(255,255,255,.15)"}`,
                borderRadius: 20, padding: "2px 8px",
              }}>{q.freq}</span>
              <span style={{ fontSize: 12, color: GOLD }}>+{q.coins} ✦</span>
            </div>
            <div style={{ fontSize: 16 }}>{q.title}</div>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginTop: 3 }}>{q.desc}</div>

            {ui.label ? (
              <div style={{ fontSize: 12, color: ui.color, marginTop: 10, letterSpacing: 0.5 }}>{ui.label}</div>
            ) : open ? (
              <div style={{ marginTop: 12 }}>
                {q.proof === "relato" && (
                  <textarea value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Descreve tua experiência com detalhes..." rows={3}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.04)", border: "1px solid rgba(201,150,46,.25)", borderRadius: 8, color: INK, font: "inherit", fontSize: 13, padding: 10, resize: "vertical" }}
                  />
                )}
                {q.proof === "foto" && (
                  <div style={{ border: "1px dashed rgba(201,150,46,.4)", borderRadius: 8, padding: "22px 12px", textAlign: "center", color: MUTED, fontSize: 13 }}>
                    📷 Toca para enviar a foto do sigilo<br />
                    <span style={{ fontSize: 11, color: FAINT }}>(no app real: upload pro bucket 'provas')</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <GoldButton small onClick={() => { submit(q.id); setProofFor(null); setText(""); }}>Enviar ao Conselho</GoldButton>
                  <button onClick={() => setProofFor(null)} style={{ background: "none", border: "none", color: FAINT, font: "inherit", fontSize: 12, cursor: "pointer" }}>cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <GoldButton small onClick={() => {
                  if (q.proof === "nenhuma") submit(q.id, true);
                  else setProofFor(q.id);
                }}>
                  {q.proof === "nenhuma" ? "Concluir" : q.proof === "foto" ? "Enviar foto" : "Escrever relato"}
                </GoldButton>
              </div>
            )}
          </Card>
        );
      })}
      <p style={{ fontSize: 11, color: FAINT, textAlign: "center", marginTop: 16, lineHeight: 1.7 }}>
        Tarefas com prova passam pelo Conselho antes das moedas caírem.<br />
        Diárias renovam à meia-noite; semanais, a cada segunda.
      </p>
    </>
  );
}

// ── aba: tesouro ─────────────────────────────────────────────

function TreasureTab({ coins, owned, equipped, cosmeticTitle, buy, equip, setTitle }) {
  const [view, setView] = useState("loja");
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <SectionLabel>Tesouro do Mago</SectionLabel>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {["loja", "inventario"].map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              fontSize: 11, padding: "5px 12px", borderRadius: 20, font: "inherit",
              border: `1px solid ${view === v ? GOLD : "rgba(255,255,255,.15)"}`,
              background: "transparent", color: view === v ? GOLD : MUTED, cursor: "pointer",
              letterSpacing: 0.5,
            }}>{v === "inventario" ? "Inventário" : "Loja"}</button>
          ))}
        </div>
      </div>

      {SHOP_INIT.filter((i) => view === "loja" || owned.includes(i.id)).map((i) => {
        const has = owned.includes(i.id);
        const isEquipped = equipped.includes(i.id);
        const isTitle = i.kind === "titulo_especial";
        const isActiveTitle = cosmeticTitle === i.id;
        return (
          <Card key={i.id} style={{ padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 54, height: 54, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0, border: "1px solid rgba(201,150,46,.3)", background: "radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)" }}>{i.glyph}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: MUTED }}>{KIND_LABEL[i.kind]}</div>
              <div style={{ fontSize: 15, marginTop: 2 }}>{i.name}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>{i.desc}</div>
              <div style={{ marginTop: 8 }}>
                {!has ? (
                  <GoldButton small disabled={coins < i.price} onClick={() => buy(i.id, i.price)}>
                    {coins < i.price ? `Faltam ${i.price - coins} ✦` : `Adquirir · ${i.price} ✦`}
                  </GoldButton>
                ) : isTitle ? (
                  <GoldButton small onClick={() => setTitle(isActiveTitle ? null : i.id)}>
                    {isActiveTitle ? "Título em uso · remover" : "Usar título"}
                  </GoldButton>
                ) : (
                  <GoldButton small onClick={() => equip(i.id)}>
                    {isEquipped ? "Equipado · guardar" : "Equipar"}
                  </GoldButton>
                )}
              </div>
            </div>
          </Card>
        );
      })}
      {view === "inventario" && owned.length === 0 && (
        <p style={{ fontSize: 13, color: FAINT, textAlign: "center", padding: "30px 0" }}>
          Teu cofre está vazio. Completa tarefas para acumular ✦.
        </p>
      )}
      <p style={{ fontSize: 11, color: FAINT, textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
        Itens do Tesouro são cerimoniais: não alteram XP, grau nem ranking.
      </p>
    </>
  );
}

// ── abas premium (iguais às versões anteriores) ──────────────

function BestiaryTab() {
  const [sel, setSel] = useState(null);
  if (sel) return (
    <>
      <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: GOLD, font: "inherit", fontSize: 13, cursor: "pointer", padding: "0 0 14px" }}>← Bestiário</button>
      <div style={{ textAlign: "center", padding: "8px 0 18px" }}>
        <div style={{ width: 110, height: 110, margin: "0 auto 14px", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 48, border: "1px solid rgba(201,150,46,.35)", background: "radial-gradient(circle at 40% 30%, rgba(201,150,46,.15), transparent 70%)" }}>{sel.glyph}</div>
        <div style={{ fontSize: 24 }}>{sel.name}</div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{sel.kind} · panteão {sel.pantheon}</div>
        <span style={{ display: "inline-block", marginTop: 10, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, border: `1px solid ${EPI_COLORS[sel.epi]}`, color: EPI_COLORS[sel.epi] }}>{sel.epi}</span>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.9 }}>{sel.summary} Aqui entra o corpo longo do verbete — tua ilustração substituirá o glifo.</p>
    </>
  );
  return (
    <>
      <SectionLabel>Bestiário Astral</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {BESTIARY.map((b) => (
          <button key={b.id} onClick={() => setSel(b)} style={{ border: "1px solid rgba(201,150,46,.18)", borderRadius: 12, background: "rgba(255,255,255,.02)", color: "inherit", font: "inherit", padding: "20px 12px 16px", cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>{b.glyph}</div>
            <div style={{ fontSize: 15 }}>{b.name}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{b.pantheon}</div>
            <div style={{ marginTop: 8, fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase", color: EPI_COLORS[b.epi] }}>{b.epi}</div>
          </button>
        ))}
      </div>
    </>
  );
}

function LibraryTab() {
  const [openId, setOpenId] = useState(null);
  return (
    <>
      <SectionLabel>Arquivo Proibido</SectionLabel>
      {LIBRARY.map((w) => {
        const open = openId === w.id;
        return (
          <Card key={w.id}>
            <button onClick={() => setOpenId(open ? null : w.id)} style={{ width: "100%", padding: 16, background: "transparent", border: "none", color: "inherit", cursor: "pointer", textAlign: "left", font: "inherit" }}>
              <div style={{ fontSize: 16 }}>{w.title}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{w.author} · {w.era} · {w.tradition}</div>
            </button>
            {open && (
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ borderLeft: `2px solid ${GOLD}`, paddingLeft: 14, fontStyle: "italic", fontSize: 15, lineHeight: 1.7, opacity: 0.9 }}>“{w.excerpt}”</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginTop: 12 }}>
                  <span style={{ color: GOLD, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Nota de estudo · </span>
                  {w.commentary}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </>
  );
}

function ForumTab() {
  const [accepted, setAccepted] = useState(false);
  const [filter, setFilter] = useState(null);
  if (!accepted) return (
    <>
      <SectionLabel>Fórum dos Magos</SectionLabel>
      <Card style={{ padding: 18 }}>
        <div style={{ fontSize: 16, marginBottom: 10 }}>Diretrizes do Círculo</div>
        <ul style={{ fontSize: 13, color: MUTED, lineHeight: 1.9, paddingLeft: 18, margin: 0 }}>
          <li>Saúde em primeiro lugar — nada de práticas de risco.</li>
          <li>Magia não substitui medicina.</li>
          <li>Nenhum trabalho contra terceiros.</li>
          <li>Respeito entre tradições; debata ideias, não pessoas.</li>
          <li>Sem dados pessoais. Sem comércio.</li>
          <li>Honestidade epistêmica: distinga relato, tradição e fato.</li>
        </ul>
        <div style={{ marginTop: 16 }}>
          <GoldButton onClick={() => setAccepted(true)}>Aceito as diretrizes</GoldButton>
        </div>
      </Card>
    </>
  );
  const posts = filter ? FORUM_INIT.filter((p) => p.cat === filter) : FORUM_INIT;
  return (
    <>
      <SectionLabel>Fórum dos Magos</SectionLabel>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {Object.keys(CAT_LABEL).map((c) => (
          <button key={c} onClick={() => setFilter(filter === c ? null : c)} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 20, border: `1px solid ${filter === c ? CAT_HUE[c] : "rgba(255,255,255,.15)"}`, background: "transparent", color: filter === c ? CAT_HUE[c] : MUTED, cursor: "pointer", font: "inherit" }}>
            {CAT_LABEL[c]}
          </button>
        ))}
      </div>
      {posts.map((p) => (
        <Card key={p.id} style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase", color: CAT_HUE[p.cat], border: `1px solid ${CAT_HUE[p.cat]}`, borderRadius: 20, padding: "3px 9px" }}>{CAT_LABEL[p.cat]}</span>
            <span style={{ fontSize: 12, color: FAINT }}>{p.author}</span>
          </div>
          <div style={{ fontSize: 15, marginBottom: 6 }}>{p.title}</div>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{p.body}</div>
          <div style={{ fontSize: 11, color: FAINT, marginTop: 10 }}>{p.comments} respostas · denunciar</div>
        </Card>
      ))}
    </>
  );
}

function RankingTab() {
  return (
    <>
      <SectionLabel>Ranking da Lua 🌒 · Liga dos Neófitos</SectionLabel>
      {RANKING.map((r) => (
        <div key={r.nick} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", marginBottom: 8, borderRadius: 10, border: r.me ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,.07)", background: r.me ? "rgba(201,150,46,.07)" : "rgba(255,255,255,.02)" }}>
          <span style={{ width: 28, textAlign: "center", fontSize: r.pos <= 3 ? 18 : 13, color: r.pos === 1 ? GOLD_LIGHT : r.pos <= 3 ? GOLD : FAINT }}>
            {r.pos <= 3 ? ["Ⅰ", "Ⅱ", "Ⅲ"][r.pos - 1] : r.pos}
          </span>
          <span style={{ flex: 1, fontSize: 15 }}>{r.nick}</span>
          <span style={{ fontSize: 13, color: MUTED }}>{r.xp} ✦</span>
        </div>
      ))}
      <p style={{ fontSize: 11, color: FAINT, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
        O placar renova a cada lua. Práticas pessoais e itens do Tesouro não influenciam o ranking.
      </p>
    </>
  );
}

// ── app ──────────────────────────────────────────────────────

const TABS = [
  { id: "grimoires", label: "Grimórios", icon: "📖", premium: false },
  { id: "quests", label: "Quests", icon: "🕯", premium: false },
  { id: "treasure", label: "Tesouro", icon: "🜚", premium: false },
  { id: "bestiary", label: "Bestiário", icon: "🜏", premium: true },
  { id: "library", label: "Acervo", icon: "📜", premium: true },
  { id: "forum", label: "Fórum", icon: "🗣", premium: true },
  { id: "ranking", label: "Ranking", icon: "☽", premium: true },
];

export default function GrimorioDeBolso() {
  // tracked: spellId → status (linha em user_spells no app real)
  const [tracked, setTracked] = useState({ f1: "dominado", f2: "praticando", s1: "dominado" });
  const [custom, setCustom] = useState([
    { id: "c1", name: "Escaneamento etérico matinal", desc: "Varredura corporal em estado hipnagógico." },
  ]);
  const [quests, setQuests] = useState(QUESTS_INIT);
  const [coins, setCoins] = useState(120);
  const [owned, setOwned] = useState([]);
  const [equippedItems, setEquippedItems] = useState([]);
  const [cosmeticTitle, setCosmeticTitle] = useState(null);
  const [tab, setTab] = useState("grimoires");
  const [paid, setPaid] = useState(false);
  const [journal, setJournal] = useState({
    f1: [{ id: "j1", date: "08 jul", text: "Sustentei o ritmo 4-4-8 por dez minutos sem dispersão. O calor no plexo apareceu no sexto minuto." }],
  });

  // trava demo: c1 precisa existir em tracked para renderizar
  if (!("c1" in tracked)) tracked["c1"] = "praticando";

  // XP: só técnicas do CATÁLOGO dominadas (práticas pessoais valem 0)
  const xp = useMemo(() => {
    return CATALOG.flatMap((g) => g.spells)
      .filter((s) => tracked[s.id] === "dominado")
      .reduce((a, s) => a + s.xp, 0);
  }, [tracked]);

  const titleIdx = useMemo(() => {
    let i = 0;
    TITLES.forEach((t, k) => { if (xp >= t.min) i = k; });
    return i;
  }, [xp]);
  const current = TITLES[titleIdx];
  const next = TITLES[titleIdx + 1];
  const progress = next ? ((xp - current.min) / (next.min - current.min)) * 100 : 100;
  const activeCosmetic = SHOP_INIT.find((i) => i.id === cosmeticTitle);

  function addJournal(spellId, text) {
    const entry = {
      id: `j${Date.now()}`,
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""),
      text,
    };
    setJournal((prev) => ({ ...prev, [spellId]: [entry, ...(prev[spellId] || [])] }));
  }
  function removeJournal(spellId, entryId) {
    setJournal((prev) => ({
      ...prev,
      [spellId]: (prev[spellId] || []).filter((e) => e.id !== entryId),
    }));
  }

  function submitQuest(qid, instant = false) {
    const q = quests.find((x) => x.id === qid);
    if (instant) {
      setQuests((p) => p.map((x) => x.id === qid ? { ...x, state: "aprovada" } : x));
      setCoins((c) => c + q.coins);
    } else {
      setQuests((p) => p.map((x) => x.id === qid ? { ...x, state: "pendente" } : x));
      setTimeout(() => {
        setQuests((p) => p.map((x) => x.id === qid ? { ...x, state: "aprovada" } : x));
        setCoins((c) => c + q.coins);
      }, 2500);
    }
  }

  function buyItem(id, price) {
    if (coins < price) return;
    setCoins((c) => c - price);
    setOwned((o) => [...o, id]);
  }
  function equipItem(id) {
    setEquippedItems((e) => e.includes(id) ? e.filter((x) => x !== id) : [...e, id]);
  }

  const activeTab = TABS.find((t) => t.id === tab);
  const gated = activeTab.premium && !paid;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(120% 80% at 50% -10%, #14213d 0%, #0a1024 55%, #060814 100%)",
      color: INK, fontFamily: "'Iowan Old Style', 'Palatino', Georgia, serif",
      paddingBottom: 92,
    }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px" }}>

        <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "26px 0 20px" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center",
            fontSize: 24, color: "#0a1024", flexShrink: 0,
            background: `radial-gradient(circle at 35% 30%, ${GOLD_LIGHT}, ${GOLD} 70%)`,
            boxShadow: equippedItems.length ? "0 0 26px rgba(201,150,46,.55)" : "0 0 22px rgba(201,150,46,.3)",
          }}>{current.glyph}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {current.name}
              {activeCosmetic && (
                <span style={{ fontSize: 12, color: GOLD, marginLeft: 8 }}>· {activeCosmetic.name}</span>
              )}
            </div>
            <div style={{ height: 5, borderRadius: 5, background: "rgba(255,255,255,.08)", margin: "6px 0 4px", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, transition: "width .4s" }} />
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>
              {xp} XP {next ? `· ${next.min - xp} até ${next.name}` : "· grau máximo"}
              <span style={{ color: GOLD, marginLeft: 10 }}>{coins} ✦</span>
            </div>
          </div>
          <button onClick={() => setPaid(!paid)} title="alternar modo pagante (demo)" style={{
            fontSize: 10, letterSpacing: 1, padding: "5px 10px", borderRadius: 20,
            border: `1px solid ${paid ? GOLD : "rgba(255,255,255,.2)"}`,
            background: "transparent", color: paid ? GOLD : FAINT, cursor: "pointer", font: "inherit",
          }}>
            {paid ? "CÍRCULO ✦" : "GRATUITO"}
          </button>
        </header>

        {gated ? <PremiumGate onUnlock={() => setPaid(true)} /> : (
          <>
            {tab === "grimoires" && (
              <GrimoiresTab
                tracked={tracked} setTracked={setTracked}
                custom={custom} setCustom={setCustom}
                journal={journal} addJournal={addJournal} removeJournal={removeJournal}
                paid={paid}
              />
            )}
            {tab === "quests" && <QuestsTab quests={quests} submit={submitQuest} />}
            {tab === "treasure" && (
              <TreasureTab
                coins={coins} owned={owned} equipped={equippedItems}
                cosmeticTitle={cosmeticTitle} buy={buyItem} equip={equipItem}
                setTitle={setCosmeticTitle}
              />
            )}
            {tab === "bestiary" && <BestiaryTab />}
            {tab === "library" && <LibraryTab />}
            {tab === "forum" && <ForumTab />}
            {tab === "ranking" && <RankingTab />}
          </>
        )}
      </div>

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(6,8,20,.92)", backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(201,150,46,.15)",
      }}>
        <div style={{ maxWidth: 440, margin: "0 auto", display: "flex" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "9px 0 11px", background: "transparent", border: "none",
              color: tab === t.id ? GOLD : FAINT, cursor: "pointer", font: "inherit", minWidth: 0,
            }}>
              <div style={{ fontSize: 17 }}>{t.icon}</div>
              <div style={{ fontSize: 8, letterSpacing: 0.5, marginTop: 3, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                {t.label}{t.premium && !paid ? " 🗝" : ""}
              </div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
