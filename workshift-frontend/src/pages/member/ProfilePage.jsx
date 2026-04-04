import { useEffect, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { unwrapApiResponse } from '../../api/apiClient'
import { useAuth } from '../../features/auth/AuthContext'
import { getGroupMembers } from '../../features/groups/groupApi'
import { getMyAvailability } from '../../features/availability/availabilityApi'
import { getMyCalendar } from '../../features/calendar/calendarApi'
import { getPositions } from '../../features/positions/positionApi'
import { getMyPositions, updateMyPositions } from '../../features/memberPosition/memberPositionApi'

/** Backend Availability: dayOfWeek 1 = Thứ 2 … 7 = Chủ nhật */
const DAY_NUM_LABEL = [null, 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

function fmtTime(t) { return t ? String(t).substring(0, 5) : '—' }

function asArrayFromApi(res) {
  try {
    const u = unwrapApiResponse(res)
    return Array.isArray(u) ? u : []
  } catch {
    return []
  }
}

function mapCalendarItems(rawItems) {
  return (Array.isArray(rawItems) ? rawItems : []).map((item) => ({
    ...item,
    registrationStatus: item.registrationStatus ?? item.status ?? 'PENDING',
    shiftName: item.shiftName ?? item.name ?? null,
  }))
}

export function ProfilePage() {
  const { groupId } = useParams()
  const { isManager, groupInfo } = useOutletContext() || {}
  const { user } = useAuth()

  const [memberInfo, setMemberInfo] = useState(null)
  const [availability, setAvailability] = useState([])
  const [recentShifts, setRecentShifts] = useState([])
  const [allPositions, setAllPositions] = useState([])
  const [myPositionIds, setMyPositionIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingPos, setSavingPos] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)

    Promise.all([
      getGroupMembers(groupId).catch(() => []),
      getMyAvailability().catch(() => []),
      getMyCalendar({ range: 'month' }).catch(() => []),
      getPositions(groupId).catch(() => []),
      getMyPositions(groupId).catch(() => []),
    ]).then(([membersRes, availRes, calRes, posRes, myPosRes]) => {
      if (cancelled) return
      const members = asArrayFromApi(membersRes)
      const me = members.find(m => String(m.userId) === String(user?.id))
      setMemberInfo(me || null)

      setAvailability(asArrayFromApi(availRes))

      let calItems = []
      try {
        const inner = unwrapApiResponse(calRes)
        const raw = Array.isArray(inner) ? inner : (inner?.items ?? [])
        calItems = mapCalendarItems(raw)
      } catch {
        calItems = []
      }
      setRecentShifts(calItems.filter(c => (c.registrationStatus ?? c.status) === 'APPROVED'))

      setAllPositions(asArrayFromApi(posRes))

      const myPos = asArrayFromApi(myPosRes)
      setMyPositionIds(myPos.map(p => p.id ?? p.positionId).filter((id) => id != null))
    }).catch(err => {
      if (!cancelled) setError(err?.message || 'Không thể tải thông tin')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [groupId, user?.id])

  function togglePosition(posId) {
    setMyPositionIds(prev =>
      prev.includes(posId)
        ? prev.filter(id => id !== posId)
        : [...prev, posId]
    )
  }

  async function handleSavePositions() {
    setSavingPos(true); setError(null)
    try {
      await updateMyPositions(groupId, myPositionIds)
      setToast('Cập nhật vị trí thành công!')
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      setError(err?.message || 'Không thể lưu vị trí')
    } finally { setSavingPos(false) }
  }

  const approvedShifts = recentShifts

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Cá nhân</p>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Thông tin cá nhân</h2>
        <p className="text-on-surface-variant font-medium">Thông tin tài khoản, vị trí và hoạt động trong nhóm</p>
      </div>

      {loading && <div className="text-center py-12"><p className="text-on-surface-variant animate-pulse">Đang tải...</p></div>}
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

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ═══ Left Column: Profile Card ═══ */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-lg overflow-hidden">
              <div className="h-28 bg-gradient-to-br from-primary via-primary/80 to-tertiary relative">
                <div className="absolute -bottom-12 left-6">
                  <div className="w-24 h-24 rounded-2xl bg-surface flex items-center justify-center text-4xl font-black text-primary border-4 border-surface shadow-lg">
                    {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="pt-16 px-6 pb-6">
                <h3 className="text-2xl font-black text-on-surface">{user?.fullName || 'Chưa cập nhật'}</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">@{user?.username || '—'}</p>

                <div className="mt-5 space-y-3">
                  {/* Email */}
                  <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-lg">mail</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Email</p>
                      <p className="text-sm text-on-surface truncate">{user?.email || '—'}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-lg">phone</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Số điện thoại</p>
                      <p className="text-sm text-on-surface">{user?.phone || '—'}</p>
                    </div>
                  </div>

                  {/* Role in group */}
                  <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-lg">badge</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Vai trò trong nhóm</p>
                      <span className={`inline-block mt-1 px-3 py-1 text-xs font-bold rounded-full ${
                        isManager ? 'bg-primary-container text-on-primary-container' : 'bg-tertiary-container text-on-tertiary-container'
                      }`}>
                        {isManager ? 'Quản lý' : 'Nhân viên'}
                      </span>
                    </div>
                  </div>

                  {/* Group */}
                  <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-lg">group</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Nhóm</p>
                      <p className="text-sm text-on-surface font-medium">{groupInfo?.groupName || `Nhóm #${groupId}`}</p>
                    </div>
                  </div>

                  {/* Joined date */}
                  <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Ngày tham gia</p>
                      <p className="text-sm text-on-surface">
                        {memberInfo?.joinedAt
                          ? new Date(memberInfo.joinedAt).toLocaleDateString('vi-VN', {
                              timeZone: 'Asia/Ho_Chi_Minh',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Account status */}
                  <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-lg">shield</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Trạng thái tài khoản</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <p className="text-sm text-on-surface">{memberInfo?.status === 'APPROVED' ? 'Hoạt động' : (memberInfo?.status || 'Đang hoạt động')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Global role */}
                  {user?.globalRole && user.globalRole !== 'USER' && (
                    <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                      <span className="material-symbols-outlined text-amber-600 text-lg">admin_panel_settings</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Quyền hệ thống</p>
                        <span className="inline-block mt-1 px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700">{user.globalRole}</span>
                      </div>
                    </div>
                  )}


                </div>
              </div>
            </div>
          </div>

          {/* ═══ Right Column ═══ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
                <p className="text-3xl font-black text-primary">{approvedShifts.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Ca tháng này</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
                <p className="text-3xl font-black text-emerald-600">{myPositionIds.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Vị trí</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
                <p className="text-3xl font-black text-on-surface">{availability.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Khung giờ rảnh</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
                <p className="text-3xl font-black text-amber-600">
                  {(() => {
                    let total = 0
                    approvedShifts.forEach(s => {
                      if (s.startTime && s.endTime) {
                        const [sh, sm] = String(s.startTime).split(':').map(Number)
                        const [eh, em] = String(s.endTime).split(':').map(Number)
                        total += (eh * 60 + em - sh * 60 - sm) / 60
                      }
                    })
                    return total.toFixed(1)
                  })()}h
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Giờ làm tháng</p>
              </div>
            </div>

            {/* ═══ Vị trí của tôi (Position Selection) ═══ */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low border-b border-outline/10 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">work</span>
                    Vị trí của tôi
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Chọn vị trí mà bạn đảm nhận trong nhóm</p>
                </div>
                <button onClick={handleSavePositions} disabled={savingPos}
                  className="px-4 py-2 text-xs font-bold text-primary bg-primary-container/20 hover:bg-primary-container/40 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">{savingPos ? 'hourglass_empty' : 'save'}</span>
                  {savingPos ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
              <div className="p-5">
                {allPositions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allPositions.map(pos => {
                      const selected = myPositionIds.includes(pos.id)
                      return (
                        <button key={pos.id} onClick={() => togglePosition(pos.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                            selected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-outline/10 bg-surface-container hover:border-outline/30'
                          }`}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: pos.colorCode || '#6366f1' }}>
                            {pos.name?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-on-surface">{pos.name}</p>
                            <p className="text-[10px] text-on-surface-variant">{pos.colorCode || '—'}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            selected
                              ? 'border-primary bg-primary'
                              : 'border-outline/30'
                          }`}>
                            {selected && <span className="material-symbols-outlined text-on-primary text-sm">check</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant opacity-20 mb-2">work_off</span>
                    <p className="text-sm text-on-surface-variant">Chưa có vị trí nào trong nhóm. Quản lý cần tạo vị trí trước.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ Lịch rảnh hiện tại ═══ */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low border-b border-outline/10">
                <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">event_available</span>
                  Lịch rảnh hàng tuần
                </h4>
              </div>
              <div className="p-5">
                {availability.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(
                      availability.reduce((acc, item) => {
                        const key = item.dayOfWeek
                        if (!acc[key]) acc[key] = []
                        acc[key].push(item)
                        return acc
                      }, {})
                    ).map(([day, slots]) => (
                      <div key={day} className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary flex-shrink-0">
                          {(DAY_NUM_LABEL[Number(day)] || `T${day}`).substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-on-surface">{DAY_NUM_LABEL[Number(day)] || `Ngày ${day}`}</p>
                          <p className="text-[11px] text-on-surface-variant">
                            {slots.map(s => `${fmtTime(s.startTime)}–${fmtTime(s.endTime)}`).join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant opacity-20 mb-2">event_busy</span>
                    <p className="text-sm text-on-surface-variant">Chưa khai báo lịch rảnh</p>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ Ca gần đây ═══ */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low border-b border-outline/10">
                <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">history</span>
                  Ca đã duyệt tháng này
                </h4>
              </div>
              <div className="p-5">
                {approvedShifts.length > 0 ? (
                  <div className="space-y-2">
                    {approvedShifts.slice(0, 10).map(item => (
                      <div key={item.registrationId} className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-3 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: item.positionColorCode || '#6366f1' }}>
                            {(item.positionName || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{item.shiftName || 'Ca'}</p>
                            <p className="text-xs text-on-surface-variant">{item.date} · {fmtTime(item.startTime)} – {fmtTime(item.endTime)}</p>
                          </div>
                        </div>
                        {item.positionName && (
                          <span className="text-xs font-medium text-on-surface-variant bg-surface-container-lowest px-2 py-1 rounded-lg">{item.positionName}</span>
                        )}
                      </div>
                    ))}
                    {approvedShifts.length > 10 && (
                      <p className="text-xs text-on-surface-variant text-center opacity-50 pt-2">+{approvedShifts.length - 10} ca khác</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant opacity-20 mb-2">event_busy</span>
                    <p className="text-sm text-on-surface-variant">Chưa có ca nào được duyệt</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
