import { useEffect, useMemo, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { getSalaryConfigs, createSalaryConfig, deleteSalaryConfig } from '../../features/salary/salaryApi'
import { getPositions } from '../../features/positions/positionApi'
import { getGroupMembers } from '../../features/groups/groupApi'
import { formatLocalISODate } from '../../utils/dateUtils'
import { unwrapApiArray } from '../../api/apiClient'

export function SalaryConfigPage() {
  const { groupId } = useParams()
  const { isManager } = useOutletContext() || {}

  const [configs, setConfigs] = useState([])
  const [positions, setPositions] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('position') // 'position' | 'user'
  const [formPosId, setFormPosId] = useState('')
  const [formUserId, setFormUserId] = useState('')
  const [formRate, setFormRate] = useState('')
  const [formDate, setFormDate] = useState(() => formatLocalISODate(new Date()))
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState(null)

  async function loadData() {
    setLoading(true); setError(null)
    try {
      const [cfgRes, posRes, memRes] = await Promise.all([
        getSalaryConfigs(groupId),
        getPositions(groupId),
        getGroupMembers(groupId).catch(() => []),
      ])
      setConfigs(unwrapApiArray(cfgRes))
      setPositions(unwrapApiArray(posRes))
      setMembers(unwrapApiArray(memRes).filter((m) => m.status === 'APPROVED'))
    } catch (err) {
      setError(err?.message || 'Không thể tải dữ liệu')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [groupId])

  const positionNameById = useMemo(() => {
    const m = new Map()
    for (const p of positions) m.set(Number(p.id), p.name ?? '')
    return m
  }, [positions])

  const memberLabelByUserId = useMemo(() => {
    const m = new Map()
    for (const mb of members) {
      const uid = Number(mb.userId)
      const label = (mb.fullName && String(mb.fullName).trim()) || mb.username || ''
      m.set(uid, label)
    }
    return m
  }, [members])

  function resolveConfigDisplayName(cfg) {
    if (cfg.userId != null && cfg.userId !== '') {
      const uid = Number(cfg.userId)
      return (cfg.userFullName && String(cfg.userFullName).trim())
        || memberLabelByUserId.get(uid)
        || `NV #${cfg.userId}`
    }
    const pid = cfg.positionId != null ? Number(cfg.positionId) : null
    return (cfg.positionName && String(cfg.positionName).trim())
      || (pid != null ? positionNameById.get(pid) : null)
      || (pid != null ? `Vị trí #${pid}` : '—')
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!formRate || Number(formRate) < 0) { setFormErr('Nhập mức lương hợp lệ'); return }
    if (formType === 'position' && !formPosId) { setFormErr('Chọn vị trí'); return }
    if (formType === 'user' && !formUserId) { setFormErr('Chọn nhân viên'); return }

    setSaving(true); setFormErr(null)
    try {
      const data = {
        hourlyRate: Number(formRate),
        effectiveDate: formDate,
      }
      if (formType === 'position') data.positionId = Number(formPosId)
      else data.userId = Number(formUserId)

      await createSalaryConfig(groupId, data)
      showToast('Tạo cấu hình lương thành công!')
      setShowForm(false)
      resetForm()
      await loadData()
    } catch (err) {
      setFormErr(err?.message || 'Không thể tạo cấu hình')
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa cấu hình lương này?')) return
    try {
      await deleteSalaryConfig(groupId, id)
      showToast('Đã xóa cấu hình lương')
      await loadData()
    } catch (err) {
      setError(err?.message || 'Không thể xóa')
    }
  }

  function resetForm() {
    setFormType('position'); setFormPosId(''); setFormUserId(''); setFormRate('')
    setFormDate(formatLocalISODate(new Date())); setFormErr(null)
  }

  function fmtCurrency(val) {
    return Number(val).toLocaleString('vi-VN') + 'đ'
  }

  if (!isManager) {
    return (
      <div className="w-full text-center py-20">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">lock</span>
        <h3 className="text-xl font-bold text-on-surface mb-2">Không có quyền truy cập</h3>
        <p className="text-on-surface-variant">Chỉ quản lý mới có thể quản lý cấu hình lương.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Quản lý</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Cấu hình lương</h2>
          <p className="text-on-surface-variant font-medium">Thiết lập mức lương theo giờ cho từng vị trí hoặc nhân viên</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 self-start shadow-md">
          <span className="material-symbols-outlined text-sm">add</span>
          Thêm cấu hình
        </button>
      </div>

      {error && <div className="bg-error-container/20 text-on-error-container rounded-xl p-4 text-center">{error}</div>}
      {toast && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-4 text-sm flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-medium">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-auto p-1 hover:bg-emerald-100 rounded-lg">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {loading && <div className="text-center py-12"><p className="text-on-surface-variant animate-pulse">Đang tải...</p></div>}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-on-surface">{configs.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng cấu hình</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-primary">{configs.filter(c => c.positionId && !c.userId).length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Theo vị trí</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-tertiary">{configs.filter(c => c.userId).length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Theo nhân viên</p>
          </div>
        </div>
      )}

      {/* Config List */}
      {!loading && configs.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-surface-container-low border-b border-outline/10">
            <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">payments</span>
              Danh sách cấu hình lương
            </h4>
          </div>
          <div className="divide-y divide-outline/5">
            {configs.map(cfg => (
              <div key={cfg.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm ${cfg.userId ? 'bg-tertiary' : 'bg-primary'}`}>
                    <span className="material-symbols-outlined text-lg">{cfg.userId ? 'person' : 'work'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {resolveConfigDisplayName(cfg)}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-on-surface-variant">
                        {cfg.userId ? '👤 Nhân viên' : '📋 Vị trí'}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        📅 Áp dụng: {cfg.effectiveDate}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">{fmtCurrency(cfg.hourlyRate)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">/giờ</p>
                  </div>
                  <button onClick={() => handleDelete(cfg.id)}
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && configs.length === 0 && (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline/10 border-dashed">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">payments</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">Chưa có cấu hình lương</h3>
          <p className="text-on-surface-variant font-medium">Nhấn "Thêm cấu hình" để thiết lập mức lương theo giờ.</p>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay" onClick={() => setShowForm(false)}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-[fadeIn_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-outline/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Thêm cấu hình lương
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {formErr && <div className="bg-error-container/20 text-on-error-container rounded-lg p-3 text-sm">{formErr}</div>}

              {/* Type toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Loại cấu hình</label>
                <div className="flex bg-surface-container rounded-xl p-1">
                  <button type="button" onClick={() => setFormType('position')}
                    className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all ${formType === 'position' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}>
                    Theo vị trí
                  </button>
                  <button type="button" onClick={() => setFormType('user')}
                    className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all ${formType === 'user' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}>
                    Theo nhân viên
                  </button>
                </div>
              </div>

              {/* Position or User select */}
              {formType === 'position' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Vị trí <span className="text-error">*</span>
                  </label>
                  <select value={formPosId} onChange={e => setFormPosId(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                    <option value="">— Chọn vị trí —</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Nhân viên <span className="text-error">*</span>
                  </label>
                  <select value={formUserId} onChange={e => setFormUserId(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                    <option value="">— Chọn nhân viên —</option>
                    {members.map(m => <option key={m.userId} value={m.userId}>{m.fullName || m.username}</option>)}
                  </select>
                </div>
              )}

              {/* Hourly rate */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Mức lương / giờ (VNĐ) <span className="text-error">*</span>
                </label>
                <input type="number" min="0" step="1000" value={formRate} onChange={e => setFormRate(e.target.value)}
                  placeholder="VD: 50000"
                  className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>

              {/* Effective date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Ngày áp dụng <span className="text-error">*</span>
                </label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-on-surface-variant font-semibold rounded-lg hover:bg-surface-container-high transition-colors">Hủy</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50">
                  {saving ? 'Đang lưu...' : 'Tạo cấu hình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
