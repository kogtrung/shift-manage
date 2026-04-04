import { apiFetch } from '../../api/apiClient'

export function getMyCalendar({ from, to, range } = {}) {
  const params = []
  if (from) params.push(`from=${from}`)
  if (to) params.push(`to=${to}`)
  if (range) params.push(`range=${range}`)
  const qs = params.length > 0 ? '?' + params.join('&') : ''
  return apiFetch(`/me/calendar${qs}`)
}
