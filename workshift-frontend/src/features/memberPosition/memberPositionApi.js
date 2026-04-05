import { apiFetch } from '../../api/apiClient'

export function getMyPositions(groupId) {
  return apiFetch(`/groups/${groupId}/my-positions`)
}

export function updateMyPositions(groupId, positionIds) {
  return apiFetch(`/groups/${groupId}/my-positions`, {
    method: 'PUT',
    body: JSON.stringify({ positionIds }),
  })
}
