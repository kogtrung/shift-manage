import { apiFetch } from '../../api/apiClient'

export function getTemplates(groupId) {
  return apiFetch(`/groups/${groupId}/shift-templates`)
}

export function createTemplate(groupId, payload) {
  return apiFetch(`/groups/${groupId}/shift-templates`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTemplate(groupId, templateId, payload) {
  return apiFetch(`/groups/${groupId}/shift-templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteTemplate(groupId, templateId) {
  return apiFetch(`/groups/${groupId}/shift-templates/${templateId}`, {
    method: 'DELETE',
  })
}
