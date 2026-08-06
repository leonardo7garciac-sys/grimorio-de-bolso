// Replica em JS o cálculo de period_key feito em my_quests_today()
// (033_quests_premium_visivel.sql):
//   diária  -> 'D' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')
//   semanal -> 'W' || to_char(now() at time zone 'America/Sao_Paulo', 'IYYY-IW')
// Usa o fuso de São Paulo pra bater com o banco: o dia (e a semana) vira
// à meia-noite local, não em UTC.
function saoPauloDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type) => Number(parts.find((p) => p.type === type).value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

function isoWeekInfo(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const isoYear = d.getUTCFullYear()
  const yearStart = new Date(Date.UTC(isoYear, 0, 1))
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return { isoYear, weekNo }
}

export function periodKey(frequency) {
  if (frequency !== 'diaria' && frequency !== 'semanal') return 'U'

  const { year, month, day } = saoPauloDateParts(new Date())

  if (frequency === 'diaria') {
    return `D${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const spDate = new Date(Date.UTC(year, month - 1, day))
  const { isoYear, weekNo } = isoWeekInfo(spDate)
  return `W${isoYear}-${String(weekNo).padStart(2, '0')}`
}
