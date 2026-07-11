// Replica em JS o cálculo de period_key feito em my_quests_today() (004_quests_tesouro.sql):
//   diária  -> 'D' || to_char(now(), 'YYYY-MM-DD')
//   semanal -> 'W' || to_char(now(), 'IYYY-IW')   (ano e semana ISO)
// Usa UTC porque o Postgres roda em UTC por padrão no Supabase.
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
  const now = new Date()
  if (frequency === 'diaria') {
    const y = now.getUTCFullYear()
    const m = String(now.getUTCMonth() + 1).padStart(2, '0')
    const d = String(now.getUTCDate()).padStart(2, '0')
    return `D${y}-${m}-${d}`
  }
  if (frequency === 'semanal') {
    const { isoYear, weekNo } = isoWeekInfo(now)
    return `W${isoYear}-${String(weekNo).padStart(2, '0')}`
  }
  return 'U'
}
