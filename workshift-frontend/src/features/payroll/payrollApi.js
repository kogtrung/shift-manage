import { apiFetch } from '../../api/apiClient'

export function getPayroll(groupId, month, year) {
  return apiFetch(`/groups/${groupId}/payroll?month=${month}&year=${year}`)
}
