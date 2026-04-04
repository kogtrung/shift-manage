import { apiFetch } from '../../api/apiClient'

export function getUnderstaffedAlerts(groupId) {
  return apiFetch(`/groups/${groupId}/alerts/understaffed`)
}
