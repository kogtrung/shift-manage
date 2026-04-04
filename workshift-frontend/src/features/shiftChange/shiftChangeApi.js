import { apiFetch } from "../../api/apiClient"

// B21/B22: Đổi ca
export function createShiftChangeRequest(groupId, payload) {
  return apiFetch(`/groups/${groupId}/shift-change-requests`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function listPendingShiftChangeRequests(groupId) {
  return apiFetch(`/groups/${groupId}/shift-change-requests/pending`)
}

export function approveShiftChangeRequest(groupId, requestId) {
  return apiFetch(`/groups/${groupId}/shift-change-requests/${requestId}/approve`, {
    method: "PATCH",
  })
}

export function rejectShiftChangeRequest(groupId, requestId, managerNote) {
  return apiFetch(`/groups/${groupId}/shift-change-requests/${requestId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ managerNote: managerNote || null }),
  })
}

