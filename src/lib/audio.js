// src/lib/audio.js
// Áudio do Portal de Entrada. Sintetizado na hora, sem arquivo.
// O AudioContext precisa nascer dentro de um gesto do usuário (o toque em
// "Confirmar código"), por isso unlockAudio() é chamado no handleVerifyCode
// e o contexto vive aqui, num singleton de módulo, até o Portal usá-lo.

const PREF_KEY = 'grimorio.somNaEntrada'

let ctx = null
let conv = null
let wet = null
let dry = null
let noiseBuf = null
let vivos = []

export function somLigado() {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSomLigado(ligado) {
  try {
    localStorage.setItem(PREF_KEY, ligado ? 'on' : 'off')
  } catch {
    // modo privado / storage bloqueado: preferência não persiste, sem erro
  }
}

// Chamar DENTRO do handler do toque que valida o código.
export function unlockAudio() {
  if (!somLigado()) return null
  try {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext
      if (!C) return null
      ctx = new C()

      // Impulso sintético: ruído com decaimento exponencial. Dá a cauda de
      // sala que separa "bipe de sistema" de "interface de vidro".
      const n = Math.floor(ctx.sampleRate * 2.4)
      const ir = ctx.createBuffer(2, n, ctx.sampleRate)
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch)
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6)
      }
      conv = ctx.createConvolver()
      conv.buffer = ir
      wet = ctx.createGain()
      wet.gain.value = 0.5
      dry = ctx.createGain()
      dry.gain.value = 1
      conv.connect(wet)
      wet.connect(ctx.destination)
      dry.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    ctx = null
    return null
  }
}

const G = 0.1 // ganho base; nada aqui passa de ~0.15 no pico

function pronto() {
  return ctx && somLigado() && ctx.state === 'running'
}

function bus(node) {
  node.connect(dry)
  node.connect(conv)
}

function registra(...nodes) {
  vivos.push(...nodes)
}

function sub(at = 0) {
  if (!pronto()) return
  const t = ctx.currentTime + at
  const o = ctx.createOscillator()
  const gn = ctx.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(58, t)
  o.frequency.exponentialRampToValueAtTime(38, t + 0.5)
  gn.gain.setValueAtTime(0.0001, t)
  gn.gain.exponentialRampToValueAtTime(G * 1.4, t + 0.03)
  gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
  o.connect(gn)
  bus(gn)
  o.start(t)
  o.stop(t + 0.9)
  registra(o)
}

function sweep(at = 0) {
  if (!pronto()) return
  const t = ctx.currentTime + at
  if (!noiseBuf) {
    const n = ctx.sampleRate * 2
    noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  }
  const s = ctx.createBufferSource()
  const f = ctx.createBiquadFilter()
  const hp = ctx.createBiquadFilter()
  const gn = ctx.createGain()
  s.buffer = noiseBuf
  s.loop = true
  f.type = 'bandpass'
  f.Q.value = 1.6
  f.frequency.setValueAtTime(320, t)
  f.frequency.exponentialRampToValueAtTime(6200, t + 1.3)
  hp.type = 'highpass'
  hp.frequency.value = 500
  gn.gain.setValueAtTime(0.0001, t)
  gn.gain.exponentialRampToValueAtTime(G * 0.55, t + 0.9)
  gn.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
  s.connect(f)
  f.connect(hp)
  hp.connect(gn)
  bus(gn)
  s.start(t)
  s.stop(t + 1.7)
  registra(s)
}

function blips(at = 0) {
  if (!pronto()) return
  const base = ctx.currentTime + at
  ;[1046, 1568, 2093].forEach((fr, i) => {
    const t = base + i * 0.13
    const o = ctx.createOscillator()
    const gn = ctx.createGain()
    o.type = 'triangle'
    o.frequency.value = fr
    gn.gain.setValueAtTime(0.0001, t)
    gn.gain.exponentialRampToValueAtTime(G * 0.5, t + 0.004)
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    o.connect(gn)
    bus(gn)
    o.start(t)
    o.stop(t + 0.18)
    registra(o)
  })
}

function confirma(at = 0) {
  if (!pronto()) return
  const t = ctx.currentTime + at
  const gn = ctx.createGain()
  ;[880, 1320].forEach((fr) => {
    const o = ctx.createOscillator()
    const og = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(fr * 0.985, t)
    o.frequency.exponentialRampToValueAtTime(fr, t + 0.12)
    og.gain.value = 0.5
    o.connect(og)
    og.connect(gn)
    o.start(t)
    o.stop(t + 0.9)
    registra(o)
  })
  gn.gain.setValueAtTime(0.0001, t)
  gn.gain.exponentialRampToValueAtTime(G * 0.7, t + 0.02)
  gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.85)
  bus(gn)
}

// Núcleo do reator: três serras desafinadas com o filtro abrindo devagar,
// sob um tremolo que começa rápido e vai desacelerando. Diferente dos
// outros eventos, ele NÃO marca um instante — ele cobre toda a duração da
// segunda frase, terminando junto com a saída da tela.
function reator(at = 0) {
  if (!pronto()) return
  const t = ctx.currentTime + at
  const gn = ctx.createGain()
  const f = ctx.createBiquadFilter()
  const lfo = ctx.createOscillator()
  const lg = ctx.createGain()
  const trem = ctx.createGain()

  f.type = 'lowpass'
  f.Q.value = 8
  f.frequency.setValueAtTime(200, t)
  f.frequency.exponentialRampToValueAtTime(3000, t + 1.1)
  ;[82.4, 82.81, 123.5].forEach((fr) => {
    const o = ctx.createOscillator()
    const og = ctx.createGain()
    o.type = 'sawtooth'
    o.frequency.value = fr
    og.gain.value = 0.33
    o.connect(og)
    og.connect(f)
    o.start(t)
    o.stop(t + 2.4)
    registra(o)
  })

  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(11, t)
  lfo.frequency.exponentialRampToValueAtTime(2, t + 1.6)
  lg.gain.value = 0.4
  lfo.connect(lg)
  lg.connect(trem.gain)
  trem.gain.value = 0.6
  lfo.start(t)
  lfo.stop(t + 2.4)
  registra(lfo)

  gn.gain.setValueAtTime(0.0001, t)
  gn.gain.exponentialRampToValueAtTime(G * 0.95, t + 1.15)
  gn.gain.exponentialRampToValueAtTime(0.0001, t + 2.3)
  f.connect(trem)
  trem.connect(gn)
  bus(gn)
}

// Entre o código de 6 dígitos e o Portal pode passar tempo suficiente
// (aceite de termos, definição de apelido) para o celular suspender o
// AudioContext por inatividade. Por isso, antes de agendar, tenta
// religar -- e só agenda quando confirma que voltou a rodar. Sem isso,
// os nós ainda seriam criados e cada função individualmente descartada
// por pronto(), tocando a sequência pela metade.
export function tocarSequenciaPortal() {
  if (!ctx || !somLigado()) return
  if (ctx.state !== 'running') {
    ctx
      .resume()
      .then(() => {
        if (ctx && ctx.state === 'running') agendarSequencia()
      })
      .catch(() => {
        // não voltou a rodar -- tela muda, sem som pela metade
      })
    return
  }
  agendarSequencia()
}

// Dispara a trilha inteira de uma vez, agendada no relógio do próprio
// AudioContext — não depende de setTimeout e por isso não desalinha se a
// aba engasgar.
function agendarSequencia() {
  vivos = []
  sub(0)
  sweep(0.05)
  blips(0.35)
  confirma(1.35)
  reator(3.6)
}

// Chamado quando o usuário toca para pular.
export function pararSom() {
  vivos.forEach((n) => {
    try {
      n.stop()
    } catch {
      // já parou sozinho
    }
  })
  vivos = []
}
