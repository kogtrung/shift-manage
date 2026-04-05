import { useEffect, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { getPositions, createPosition, updatePosition, deletePosition } from '../../features/positions/positionApi'
import { unwrapApiArray } from '../../api/apiClient'

/** Figma modal palette (6×3) */
const PRESET_COLORS = [
  '#003d9b', '#0052cc', '#6200ee', '#9c27b0', '#e91e63', '#f44336',
  '#ff5722', '#ff9800', '#ffc107', '#ffeb3b', '#cddc39', '#8bc34a',
  '#4caf50', '#009688', '#00bcd4', '#03a9f4', '#607d8b', '#9e9e9e',
]

function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return '#003d9b'
  let h = hex.trim()
  if (!h.startsWith('#')) h = `#${h}`
  if (h.length === 4) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`.toUpperCase()
  }
  return h.length === 7 ? h.toUpperCase() : '#003d9b'
}

function hexToTint(hex) {
  const h = normalizeHex(hex).slice(1)
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if (Number.isNaN(r + g + b)) return { tint: 'rgba(99,102,241,0.12)', color: '#6366F1' }
  return { tint: `rgba(${r},${g},${b},0.14)`, color: normalizeHex(hex) }
}

export function PositionsPage() {
  const { groupId } = useParams()
  const { isManager } = useOutletContext() || {}
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState(PRESET_COLORS[0])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)

  async function loadPositions() {
    setLoading(true)
    setError(null)
    try {
      const res = await getPositions(groupId)
      setPositions(unwrapApiArray(res))
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách vị trí')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPositions() }, [groupId])

  useEffect(() => {
    if (menuOpenId == null) return
    const close = () => setMenuOpenId(null)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpenId])

  function openCreate() {
    setEditingId(null)
    setFormName('')
    setFormColor(PRESET_COLORS[0])
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(pos) {
    setEditingId(pos.id)
    setFormName(pos.name)
    setFormColor(normalizeHex(pos.colorCode || PRESET_COLORS[0]))
    setFormError(null)
    setShowForm(true)
    setMenuOpenId(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setFormName('')
    setFormColor(PRESET_COLORS[0])
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formName.trim()) { setFormError('Tên vị trí không được để trống'); return }
    setSubmitting(true)
    setFormError(null)
    try {
      const payload = { name: formName.trim(), colorCode: normalizeHex(formColor) }
      if (editingId) {
        await updatePosition(groupId, editingId, payload)
      } else {
        await createPosition(groupId, payload)
      }
      closeForm()
      await loadPositions()
    } catch (err) {
      setFormError(err?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(pos) {
    if (!confirm(`Xóa vị trí "${pos.name}"?`)) return
    try {
      await deletePosition(groupId, pos.id)
      setMenuOpenId(null)
      await loadPositions()
    } catch (err) {
      alert(err?.message || 'Không thể xóa vị trí')
    }
  }

  return (
    <div className="w-full space-y-10 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:py-0 bg-[#f7f9fb] min-h-[60vh] rounded-none md:rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <h2 className="text-[28px] sm:text-[30px] font-extrabold text-[#1e3a8a] tracking-[-0.02em] leading-9">
            Vị trí làm việc
          </h2>
          <p className="text-sm text-[#64748b] leading-5 font-normal">
            Quản lý danh sách các bộ phận, chức danh công việc trong tổ chức của bạn.
            Phân quyền và định danh theo mã vị trí.
          </p>
        </div>
        {isManager && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-[#00288e] px-6 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-3px_rgba(30,58,138,0.12),0px_4px_6px_-4px_rgba(30,58,138,0.12)] hover:bg-[#002078] transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Thêm vị trí
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

      {!loading && !error && positions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {positions.map((pos) => {
            const { tint, color } = hexToTint(pos.colorCode || '#6366f1')
            const code = normalizeHex(pos.colorCode || '#6366f1')
            return (
              <div
                key={pos.id}
                className="relative flex min-h-[192px] flex-col justify-between overflow-hidden rounded-xl bg-white p-6 shadow-[0px_0px_0px_1px_#f1f5f9]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl font-bold"
                    style={{ backgroundColor: tint, color }}
                  >
                    {pos.name?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  {isManager && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        aria-label="Tùy chọn"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(menuOpenId === pos.id ? null : pos.id)
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] hover:bg-slate-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">more_vert</span>
                      </button>
                      {menuOpenId === pos.id && (
                        <div
                          className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => openEdit(pos)}
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(pos)}
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-auto space-y-1 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color }}>
                    MÃ: {code}
                  </p>
                  <h3 className="text-lg font-extrabold text-[#191c1e] leading-7">{pos.name}</h3>
                </div>
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: color, opacity: 0.85 }}
                />
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && positions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 py-16 text-center">
          <span className="material-symbols-outlined mb-4 text-5xl text-slate-300">work</span>
          <h3 className="mb-2 text-lg font-bold text-[#191c1e]">Chưa có vị trí nào</h3>
          <p className="text-sm font-medium text-[#64748b]">Tạo các vị trí làm việc để bắt đầu cấu hình ca.</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay px-4" onClick={closeForm}>
          <div
            className="w-full max-w-[480px] rounded-xl bg-white p-8 shadow-[0px_20px_50px_0px_rgba(25,27,35,0.08)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 space-y-1">
              <h3 className="text-2xl font-extrabold text-[#191b23] leading-8">
                {editingId ? 'Chỉnh sửa vị trí' : 'Thêm vị trí mới'}
              </h3>
              <p className="text-sm leading-5 text-[#434654]">
                {editingId
                  ? 'Cập nhật thông tin vị trí làm việc.'
                  : 'Tạo một vị trí công việc mới để quản lý lịch làm việc hiệu quả hơn.'}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && (
                <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800">{formError}</div>
              )}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                  Tên vị trí <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Pha chế, Thu ngân, Phục vụ..."
                  className="w-full rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-base text-[#191b23] placeholder:text-[rgba(67,70,84,0.4)] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                  autoFocus
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                  Màu hiển thị
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {PRESET_COLORS.map((c) => {
                    const sel = normalizeHex(formColor) === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormColor(c)}
                        className={`aspect-square rounded-full border-2 border-white shadow-sm transition-transform hover:scale-105 ${sel ? 'ring-2 ring-[#003d9b] ring-offset-2 ring-offset-white scale-105' : ''}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Màu ${c}`}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div
                    className="h-12 w-12 shrink-0 rounded-lg border-2 border-white shadow-sm"
                    style={{ backgroundColor: normalizeHex(formColor) }}
                  />
                  <input
                    type="text"
                    value={normalizeHex(formColor)}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-32 rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#ededf8] px-[17px] py-2 font-mono text-sm font-bold text-[#434654] focus:border-[#003d9b] focus:outline-none"
                  />
                  <input
                    type="color"
                    value={normalizeHex(formColor)}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent"
                    aria-label="Chọn màu tùy chỉnh"
                  />
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
                  className="relative rounded-lg px-8 py-2.5 text-sm font-semibold text-white shadow-[0px_4px_6px_-1px_rgba(0,61,155,0.2),0px_2px_4px_-2px_rgba(0,61,155,0.2)] disabled:opacity-50 transition-opacity"
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
