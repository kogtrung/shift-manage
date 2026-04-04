import { apiFetch } from '../../api/apiClient'

export function getMyAvailability() {
  return apiFetch('/availability')
}

/** Backend `putAvailabilitySchema`: body `{ slots: [{ dayOfWeek, startTime, endTime }] }` — dayOfWeek 1=Thứ 2 … 7=CN */
export function updateMyAvailability(slots) {
  return apiFetch('/availability', {
    method: 'PUT',
    body: JSON.stringify({ slots }),
  })
}
