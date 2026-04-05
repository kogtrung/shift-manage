import { useEffect, useState } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { updateGroup, deleteGroup, toggleGroupStatus } from '../../features/groups/groupApi'

export function GroupSettingsPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { isManager, groupInfo } = useOutletContext() || {}

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [saveErr, setSaveErr] = useState(null)

  // close/reopen
  const [toggling, setToggling] = useState(false)
  const [toggleMsg, setToggleMsg] = useState(null)

  // permanent delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState(null)

  const isActive = groupInfo?.groupStatus === 'ACTIVE'

  useEffect(() => {
    if (groupInfo) {
      setName(groupInfo.groupName || '')
      setDescription(groupInfo.description || '')
    }
  }, [groupInfo])

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) { setSaveErr('Tên group không được để trống'); return }
    setSaving(true); setSaveErr(null); setSaveMsg(null)
    try {
      await updateGroup(groupId, { name: name.trim(), description: description.trim() || null })
      setSaveMsg('Cập nhật thành công! Tải lại trang để thấy thay đổi.')
    } catch (err) {
      setSaveErr(err?.message || 'Không thể cập nhật')
    } finally { setSaving(false) }
  }

  async function handleToggle() {
    setToggling(true); setToggleMsg(null)
    try {
      await toggleGroupStatus(groupId)
      setToggleMsg(isActive ? 'Đã đóng group. Tải lại trang để cập nhật.' : 'Đã mở lại group. Tải lại trang để cập nhật.')
    } catch (err) { alert(err?.message || 'Lỗi') }
    finally { setToggling(false) }
  }

  async function handleDelete() {
    setDeleting(true); setDeleteErr(null)
    try {
      await deleteGroup(groupId)
      navigate('/app/groups', { replace: true })
    } catch (err) {
      setDeleteErr(err?.message || 'Không thể xóa group')
    } finally { setDeleting(false) }
  }

  /* ───── Staff read-only view ───── */
  if (!isManager) {
    return (
      <div className="w-full">
        <div className="space-y-1 mb-6">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Cài đặt</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Thông tin Group</h2>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Tên group</label>
            <p className="text-lg font-bold text-on-surface">{groupInfo?.groupName || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Mô tả</label>
            <p className="text-on-surface">{groupInfo?.description || 'Không có mô tả'}</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Trạng thái</label>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {isActive ? 'Đang hoạt động' : 'Đã đóng'}
            </span>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Mã tham gia</label>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-bold text-primary bg-primary-container/10 px-4 py-2 rounded-lg tracking-[0.2em]">
                {groupInfo?.joinCode || '——'}
              </code>
              <button onClick={() => navigator.clipboard?.writeText(groupInfo?.joinCode || '')}
                className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors" title="Sao chép">
                <span className="material-symbols-outlined text-lg">content_copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ───── Manager view ───── */
  return (
    <div className="w-full space-y-8">
      <div className="space-y-1">
        <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Quản lý</p>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Cài đặt Group</h2>
        <p className="text-on-surface-variant font-medium">Chỉnh sửa thông tin và quản lý group</p>
      </div>

      {/* ═══ General Info ═══ */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline/10">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit</span>
            Thông tin chung
          </h3>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {saveMsg && (
            <div className="bg-emerald-50 text-emerald-700 rounded-xl p-3 text-sm flex items-center gap-2 border border-emerald-200">
              <span className="material-symbols-outlined text-lg">check_circle</span>{saveMsg}
            </div>
          )}
          {saveErr && (
            <div className="bg-error-container/20 text-on-error-container rounded-xl p-3 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>{saveErr}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Tên group <span className="text-error">*</span>
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên group"
              className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg font-semibold" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Mô tả</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả ngắn về nhóm làm việc..." rows={3}
              className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">save</span>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      {/* ═══ Join Code ═══ */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline/10">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">vpn_key</span>
            Mã tham gia
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-on-surface-variant mb-4">Chia sẻ mã này để thành viên mới gửi yêu cầu tham gia.</p>
          <div className="flex items-center gap-3">
            <code className="text-2xl font-mono font-black text-primary bg-primary-container/10 px-6 py-3 rounded-xl tracking-[0.3em] border border-primary/10">
              {groupInfo?.joinCode || '——————'}
            </code>
            <button onClick={() => navigator.clipboard?.writeText(groupInfo?.joinCode || '')}
              className="flex items-center gap-2 px-4 py-3 bg-surface-container hover:bg-surface-container-high rounded-xl text-on-surface font-semibold transition-colors">
              <span className="material-symbols-outlined">content_copy</span>Sao chép
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Danger Zone ═══ */}
      <div className="bg-surface-container-lowest rounded-2xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span>
            Vùng nguy hiểm
          </h3>
        </div>
        <div className="p-6 space-y-6">

          {/* ─── Close / Reopen ─── */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface flex items-center gap-2">
                {isActive ? (
                  <><span className="material-symbols-outlined text-amber-500 text-lg">lock</span> Đóng group</>
                ) : (
                  <><span className="material-symbols-outlined text-emerald-500 text-lg">lock_open</span> Mở lại group</>
                )}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {isActive
                  ? 'Đóng group sẽ ngăn thành viên mới tham gia. Bạn có thể mở lại bất cứ lúc nào.'
                  : 'Mở lại group để cho phép hoạt động bình thường trở lại.'
                }
              </p>
              {toggleMsg && (
                <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>{toggleMsg}
                </p>
              )}
            </div>
            <button onClick={handleToggle} disabled={toggling}
              className={`px-5 py-2.5 font-semibold rounded-lg transition-colors flex items-center gap-2 flex-shrink-0 disabled:opacity-50 ${
                isActive
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}>
              <span className="material-symbols-outlined text-lg">{isActive ? 'lock' : 'lock_open'}</span>
              {toggling ? 'Đang xử lý...' : (isActive ? 'Đóng group' : 'Mở lại group')}
            </button>
          </div>

          <hr className="border-red-100" />

          {/* ─── Permanent Delete ─── */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-lg">delete_forever</span>
                Xóa vĩnh viễn
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Xóa hoàn toàn group khỏi hệ thống. Tất cả dữ liệu (ca, vị trí, thành viên) sẽ bị mất vĩnh viễn và <strong>không thể khôi phục</strong>.
              </p>
            </div>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 flex-shrink-0">
              <span className="material-symbols-outlined text-lg">delete_forever</span>
              Xóa vĩnh viễn
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-[fadeIn_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-outline/10">
              <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <span className="material-symbols-outlined">delete_forever</span>
                Xác nhận xóa vĩnh viễn
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm border border-red-200">
                <p className="font-bold mb-1">⚠️ Hành động này KHÔNG THỂ hoàn tác!</p>
                <p>Group <strong>"{groupInfo?.groupName}"</strong> và toàn bộ dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Nhập <strong className="text-red-600">"{groupInfo?.groupName}"</strong> để xác nhận
                </label>
                <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                  placeholder={groupInfo?.groupName}
                  className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-red-200 text-on-surface focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200 transition-all" />
              </div>
              {deleteErr && (
                <div className="bg-error-container/20 text-on-error-container rounded-lg p-3 text-sm">{deleteErr}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteErr(null) }}
                  className="px-5 py-2.5 text-on-surface-variant font-semibold rounded-lg hover:bg-surface-container-high transition-colors">Hủy</button>
                <button onClick={handleDelete}
                  disabled={deleting || deleteInput !== groupInfo?.groupName}
                  className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">delete_forever</span>
                  {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
