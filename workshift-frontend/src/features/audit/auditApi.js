import { apiFetch } from '../../api/apiClient'

function toQueryString(params) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params || {})) {
    if (value === null || value === undefined || value === '') continue
    searchParams.set(key, String(value))
  }
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

export function getAuditLogs(groupId, params) {
  return apiFetch(`/groups/${groupId}/audit-logs${toQueryString(params)}`)
}

export function getDailySummary(groupId, params) {
  return apiFetch(`/groups/${groupId}/audit-logs/summary/daily${toQueryString(params)}`)
}

export function getMonthlySummary(groupId, params) {
  return apiFetch(`/groups/${groupId}/audit-logs/summary/monthly${toQueryString(params)}`)
}

