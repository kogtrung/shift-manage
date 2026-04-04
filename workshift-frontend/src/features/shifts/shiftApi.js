import { apiFetch } from '../../api/apiClient'

export function getShifts(groupId, from, to) {
  let path = `/groups/${groupId}/shifts`
  const params = []
  if (from) params.push(`from=${from}`)
  if (to) params.push(`to=${to}`)
  if (params.length > 0) path += '?' + params.join('&')
  return apiFetch(path)
}

export function createShift(groupId, payload) {
  return apiFetch(`/groups/${groupId}/shifts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createShiftsBulk(groupId, shifts) {
  return apiFetch(`/groups/${groupId}/shifts/bulk`, {
    method: 'POST',
    body: JSON.stringify({ shifts }),
  })
}

export function deleteShift(groupId, shiftId) {
  return apiFetch(`/groups/${groupId}/shifts/${shiftId}`, {
    method: 'DELETE',
  })
}
