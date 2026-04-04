import { apiFetch } from '../../api/apiClient'

export function createGroup(payload) {
  return apiFetch('/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function joinGroupById(groupId) {
  return apiFetch(`/groups/${groupId}/join`, { method: 'POST' })
}

export function joinGroupByCode(payload) {
  return apiFetch('/groups/join-by-code', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getPendingMembers(groupId) {
  return apiFetch(`/groups/${groupId}/members/pending`)
}

export function reviewMember(groupId, memberId, payload) {
  return apiFetch(`/groups/${groupId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getMyGroups() {
  return apiFetch('/groups/my-groups')
}

export function getGroupMembers(groupId) {
  return apiFetch(`/groups/${groupId}/members`)
}

export function leaveGroup(groupId) {
  return apiFetch(`/groups/${groupId}/leave`, { method: 'DELETE' })
}

export function updateGroup(groupId, payload) {
  return apiFetch(`/groups/${groupId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function toggleGroupStatus(groupId) {
  return apiFetch(`/groups/${groupId}/status`, { method: 'PATCH' })
}

export function deleteGroup(groupId) {
  return apiFetch(`/groups/${groupId}`, { method: 'DELETE' })
}
