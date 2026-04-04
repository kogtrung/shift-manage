import { apiFetch } from '../../api/apiClient'

function parseDateInput(val) {
  if (!val) return null
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d
}

function getISOWeekYearAndWeek(date) {
  // Tính ISO week theo UTC để tránh lệch timezone do parse date (YYYY-MM-DD)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7 // Mon=1 .. Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum) // đưa về Thursday của ISO week
  const year = d.getUTCFullYear()
  const week = Math.ceil((((d - Date.UTC(year, 0, 1)) / 86400000) + 1) / 7)
  return { year, week }
}

export function getPerformance(groupId, { range, from } = {}) {
  const base = parseDateInput(from) || new Date()

  if (range === 'week') {
    const { year, week } = getISOWeekYearAndWeek(base)
    return apiFetch(`/groups/${groupId}/reports/weekly?year=${year}&week=${week}`)
  }

  // default: month
  const year = base.getFullYear()
  const month = base.getMonth() + 1
  return apiFetch(`/groups/${groupId}/reports/monthly?year=${year}&month=${month}`)
}

