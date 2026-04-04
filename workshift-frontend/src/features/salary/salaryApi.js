import { apiFetch } from '../../api/apiClient'

export function getSalaryConfigs(groupId) {
  return apiFetch(`/groups/${groupId}/salary-configs`)
}

export function createSalaryConfig(groupId, data) {
  return apiFetch(`/groups/${groupId}/salary-configs`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteSalaryConfig(groupId, configId) {
  return apiFetch(`/groups/${groupId}/salary-configs/${configId}`, {
    method: 'DELETE',
  })
}
