import { apiFetch } from '../../api/apiClient'

export function getPositions(groupId) {
  return apiFetch(`/groups/${groupId}/positions`)
}

export function createPosition(groupId, payload) {
  return apiFetch(`/groups/${groupId}/positions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePosition(groupId, positionId, payload) {
  return apiFetch(`/groups/${groupId}/positions/${positionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deletePosition(groupId, positionId) {
  return apiFetch(`/groups/${groupId}/positions/${positionId}`, {
    method: 'DELETE',
  })
}
