import { apiFetch } from "../../api/apiClient"

// B18: Gợi ý nhân viên cho ca theo positionId
export function getShiftRecommendations(groupId, shiftId, positionId) {
  const qs = new URLSearchParams()
  qs.set("positionId", String(positionId))
  return apiFetch(`/groups/${groupId}/shifts/${shiftId}/recommendations?${qs.toString()}`)
}

