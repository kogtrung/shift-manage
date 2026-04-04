import { apiFetch } from "../../api/apiClient"

function toQueryString(params) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params || {})) {
    if (value === null || value === undefined || value === "") continue
    searchParams.set(key, String(value))
  }
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ""
}

// B23 - Admin governance
export function getAdminUsers({ page = 0, size = 10, search } = {}) {
  return apiFetch(`/admin/users${toQueryString({ page, size, search })}`)
}

export function toggleAdminUserStatus(userId) {
  return apiFetch(`/admin/users/${userId}/toggle-status`, {
    method: "PATCH",
  })
}

export function getAdminGroups({ page = 0, size = 10, search } = {}) {
  return apiFetch(`/admin/groups${toQueryString({ page, size, search })}`)
}

export function toggleAdminGroupStatus(groupId) {
  return apiFetch(`/admin/groups/${groupId}/toggle-status`, {
    method: "PATCH",
  })
}

export function getAdminMetrics() {
  return apiFetch(`/admin/metrics`)
}

export function getAdminAuditLogs({ page = 0, size = 20 } = {}) {
  return apiFetch(`/admin/audit-logs${toQueryString({ page, size })}`)
}

