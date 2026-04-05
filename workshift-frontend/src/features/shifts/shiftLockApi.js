import { apiFetch } from "../../api/apiClient"

// B20: Khóa ca (OPEN -> LOCKED)
export function lockShift(groupId, shiftId) {
  return apiFetch(`/groups/${groupId}/shifts/${shiftId}/lock`, {
    method: "PATCH",
  })
}

