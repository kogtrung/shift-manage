import { apiFetch } from '../../api/apiClient'

export function getRequirements(shiftId) {
  return apiFetch(`/shifts/${shiftId}/requirements`)
}

export function createRequirement(shiftId, payload) {
  return apiFetch(`/shifts/${shiftId}/requirements`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateRequirement(shiftId, requirementId, payload) {
  return apiFetch(`/shifts/${shiftId}/requirements/${requirementId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteRequirement(shiftId, requirementId) {
  return apiFetch(`/shifts/${shiftId}/requirements/${requirementId}`, {
    method: 'DELETE',
  })
}
