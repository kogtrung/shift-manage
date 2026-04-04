import { useEffect, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../features/shifts/shiftTemplateApi'
import { getPositions } from '../../features/positions/positionApi'
import { unwrapApiArray } from '../../api/apiClient'

const CARD_BY_ICON = {
  light_mode: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    editBg: 'bg-orange-50',
    editText: 'text-orange-600',
  },
  wb_sunny: {
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
    editBg: 'bg-orange-50',
    editText: 'text-orange-600',
  },
  wb_twilight: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-700',
    editBg: 'bg-blue-50',
    editText: 'text-blue-600',
  },
  dark_mode: {
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
    editBg: 'bg-slate-100',
    editText: 'text-slate-600',
  },
  schedule: {
    iconBg: 'bg-sky-50',
    iconText: 'text-sky-600',
    editBg: 'bg-blue-50',
    editText: 'text-blue-600',
  },
}

function durationHoursLabel(start, end) {
  if (!start || !end) return '—'
  const s = String(start).substring(0, 5)
  const e = String(end).substring(0, 5)
  const [sh, sm] = s.split(':').map(Number)
  const [eh, em] = e.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return '—'
  const h = Math.round(mins / 60)
  return `${Math.max(1, h)}H LÀM VIỆC`
}

export function ShiftTemplatesPage() {
  const { groupId } = useParams()
  const { isManager } = useOutletContext() || {}
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const [positions, setPositions] = useState([])
  const [formReqs, setFormReqs] = useState([])

  async function loadTemplates() {
    setLoading(true)
    setError(null)
    try {
      const res = await getTemplates(groupId)
      setTemplates(unwrapApiArray(res))
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách ca mẫu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTemplates() }, [groupId])

  useEffect(() => {
    if (!groupId) return
    getPositions(groupId).then(res => {
      setPositions(unwrapApiArray(res))
    }).catch(() => {})
  }, [groupId])

  function formatTime(t) {
    if (!t) return '—'
    return String(t).substring(0, 5)
  }

  function getShiftIcon(name) {
    const lower = (name || '').toLowerCase()
    if (lower.includes('sáng') || lower.includes('sang') || lower.includes('morning')) return 'light_mode'
    if (lower.includes('trưa') || lower.includes('trua') || lower.includes('noon')) return 'wb_sunny'
    if (lower.includes('chiều') || lower.includes('chieu') || lower.includes('afternoon')) return 'wb_twilight'
    if (lower.includes('tối') || lower.includes('toi') || lower.includes('night') || lower.includes('đêm')) return 'dark_mode'
    return 'schedule'
  }

  function openCreate() {
    setEditingId(null)
    setFormName('')
    setFormStart('')
    setFormEnd('')
    setFormDesc('')
    setFormError(null)
    setFormReqs([])
    setShowForm(true)
  }

  function openEdit(tpl) {
    setEditingId(tpl.id)
    setFormName(tpl.name)
    setFormStart(formatTime(tpl.startTime))
    setFormEnd(formatTime(tpl.endTime))
    setFormDesc(tpl.description || '')
    setFormError(null)
    setFormReqs((tpl.requirements || []).map(r => ({ positionId: r.positionId, quantity: r.quantity })))
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formName.trim()) { setFormError('Tên ca mẫu không được để trống'); return }
    if (!formStart || !formEnd) { setFormError('Giờ bắt đầu và kết thúc là bắt buộc'); return }
    setSubmitting(true)
    setFormError(null)
    try {
      const payload = {
        name: formName.trim(),
        startTime: formStart + ':00',
        endTime: formEnd + ':00',
        description: formDesc.trim() || null,
        requirements: formReqs.filter(r => r.positionId && r.quantity > 0),
      }
      if (editingId) {
        await updateTemplate(groupId, editingId, payload)
      } else {
        await createTemplate(groupId, payload)
      }
      closeForm()
      await loadTemplates()
    } catch (err) {
      setFormError(err?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(tpl) {
    if (!confirm(`Xóa ca mẫu "${tpl.name}"?`)) return
    try {
      await deleteTemplate(groupId, tpl.id)
      await loadTemplates()
    } catch (err) {
      alert(err?.message || 'Không thể xóa')
    }
  }

  return (
    <div className="w-full space-y-10 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:py-0 bg-[#f7f9fb] min-h-[60vh] rounded-none md:rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <h2 className="text-2xl font-bold text-[#191c1e] tracking-[-0.025em] leading-8">
            Cấu hình Ca mẫu
          </h2>
          <p className="text-sm text-[#57657a] leading-5">
            Tạo các khung giờ mẫu để tạo ca nhanh hơn (Ca Sáng, Ca Chiều...)
          </p>
        </div>
        {isManager && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 self-start rounded bg-[#00288e] px-6 py-2.5 text-sm font-semibold text-white shadow-[0px_10px_15px_-3px_rgba(30,58,138,0.1),0px_4px_6px_-4px_rgba(30,58,138,0.1)] hover:bg-[#002078] transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Thêm ca mẫu
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-[#64748b] animate-pulse text-sm">Đang tải...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 text-red-800 border border-red-100 p-4 text-center text-sm">{error}</div>
      )}

      {!loading && !error && templates.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => {
              const icon = getShiftIcon(tpl.name)
              const style = CARD_BY_ICON[icon] || CARD_BY_ICON.schedule
              const dur = durationHoursLabel(tpl.startTime, tpl.endTime)
              return (
                <div
                  key={tpl.id}
                  className="flex min-h-[258px] flex-col justify-between rounded-lg border border-transparent bg-white p-[25px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-6">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}>
                        <span className={`material-symbols-outlined text-[22px] ${style.iconText}`}>{icon}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="rounded-sm bg-slate-100 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-600">
                          {dur}
                        </span>
                        {isManager && (
                          <button
                            type="button"
                            title="Xóa ca mẫu"
                            onClick={() => handleDelete(tpl)}
                            className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 pb-2">
                      <h3 className="text-lg font-bold text-[#191c1e] leading-7">{tpl.name}</h3>
                      <div className="flex flex-wrap items-baseline gap-1 text-2xl font-semibold tracking-[-0.025em] text-slate-800">
                        <span>{formatTime(tpl.startTime)}</span>
                        <span className="text-xl font-bold text-slate-300">→</span>
                        <span>{formatTime(tpl.endTime)}</span>
                      </div>
                      {tpl.description && (
                        <p className="pt-2 text-sm text-slate-500 line-clamp-2 leading-5">{tpl.description}</p>
                      )}
                      {(tpl.requirements && tpl.requirements.length > 0) && (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                          {tpl.requirements.map(req => (
                            <span
                              key={req.id}
                              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-700"
                            >
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: req.positionColorCode || '#6366f1' }} />
                              {req.positionName} ×{req.quantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => openEdit(tpl)}
                      className={`mt-2 w-full rounded py-2.5 text-sm font-bold transition-colors ${style.editBg} ${style.editText} hover:opacity-90`}
                    >
                      Sửa
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 px-6 text-center">
            <span className="material-symbols-outlined mb-2 text-2xl text-slate-300">more_horiz</span>
            <p className="text-sm font-medium text-slate-400">
              Thêm nhiều ca mẫu hơn để tối ưu quy trình quản lý
            </p>
          </div>
        </>
      )}

      {!loading && !error && templates.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 py-16 text-center">
          <span className="material-symbols-outlined mb-4 text-5xl text-slate-300">schedule</span>
          <h3 className="mb-2 text-lg font-bold text-[#191c1e]">Chưa có ca mẫu nào</h3>
          <p className="text-sm font-medium text-[#64748b]">Tạo khung giờ mẫu để tạo ca làm việc nhanh hơn.</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay px-4" onClick={closeForm}>
          <div
            className="w-full max-w-[480px] rounded-xl bg-white p-8 shadow-[0px_20px_50px_0px_rgba(25,27,35,0.08)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 space-y-1">
              <h3 className="text-2xl font-extrabold text-[#191b23] leading-8">
                {editingId ? 'Chỉnh sửa ca mẫu' : 'Thêm ca mẫu mới'}
              </h3>
              <p className="text-sm leading-5 text-[#434654]">
                Đặt khung giờ và nhu cầu nhân sự mặc định cho ca mẫu.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800">{formError}</div>
              )}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                  Tên ca mẫu <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Ca Sáng, Ca Chiều, Ca Tối..."
                  className="w-full rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-base text-[#191b23] placeholder:text-[rgba(67,70,84,0.4)] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                    Bắt đầu <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-[#191b23] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                    Kết thúc <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-[#191b23] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                  Mô tả
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Mô tả ca mẫu (tùy chọn)..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-[#191b23] placeholder:text-[rgba(67,70,84,0.4)] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                  Nhu cầu nhân sự mặc định
                </label>
                <div className="space-y-2">
                  {formReqs.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={req.positionId}
                        onChange={e => {
                          const updated = [...formReqs]
                          updated[idx].positionId = Number(e.target.value)
                          setFormReqs(updated)
                        }}
                        className="flex-1 rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-3 py-2.5 text-sm text-[#191b23] focus:border-[#003d9b] focus:outline-none"
                      >
                        <option value="">Chọn vị trí</option>
                        {positions.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={req.quantity}
                        onChange={e => {
                          const updated = [...formReqs]
                          updated[idx].quantity = Number(e.target.value)
                          setFormReqs(updated)
                        }}
                        className="w-16 rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-2 py-2.5 text-center text-sm focus:border-[#003d9b] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setFormReqs(formReqs.filter((_, i) => i !== idx))}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormReqs([...formReqs, { positionId: '', quantity: 1 }])}
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2.5 text-xs font-bold text-[#003d9b] hover:bg-blue-50/50"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Thêm nhu cầu
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg px-6 py-2.5 text-sm font-semibold text-[#586579] hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="relative rounded-lg px-8 py-2.5 text-sm font-semibold text-white shadow-[0px_4px_6px_-1px_rgba(0,61,155,0.2),0px_2px_4px_-2px_rgba(0,61,155,0.2)] disabled:opacity-50"
                  style={{ background: 'linear-gradient(161deg, #003d9b 0%, #0052cc 100%)' }}
                >
                  {submitting ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
