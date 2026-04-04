import { apiFetch } from '../../api/apiClient'

// ─── Member APIs (B12, B13) ───
export function registerShift(shiftId, positionId, note) {
  return apiFetch(`/shifts/${shiftId}/register`, {
    method: 'POST',
    body: JSON.stringify({ positionId, note: note || null }),
  })
}

export function cancelRegistration(registrationId, reason) {
  return apiFetch(`/registrations/${registrationId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason: reason || null }),
  })
}

// ─── Manager APIs (B14, B15, B16) ───
export function getPendingRegistrations(shiftId) {
  return apiFetch(`/shifts/${shiftId}/registrations/pending`)
}

export function approveRegistration(registrationId, managerNote) {
  return apiFetch(`/registrations/${registrationId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ managerNote: managerNote || null }),
  })
}

export function rejectRegistration(registrationId, reason) {
  return apiFetch(`/registrations/${registrationId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

export function assignShift(shiftId, userId, positionId, note) {
  return apiFetch(`/shifts/${shiftId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ userId, positionId, note: note || null }),
  })
}
