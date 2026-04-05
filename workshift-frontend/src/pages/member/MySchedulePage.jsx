import { useEffect, useState, useMemo } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { unwrapApiResponse, unwrapApiArray } from '../../api/apiClient'
import { formatLocalISODate } from '../../utils/dateUtils'
import { getMyCalendar } from '../../features/calendar/calendarApi'
import { cancelRegistration } from '../../features/registrations/registrationApi'
import { getShifts } from '../../features/shifts/shiftApi'
import { getMyPositions } from '../../features/memberPosition/memberPositionApi'
import { getMyAvailability } from '../../features/availability/availabilityApi'
import { ShiftChangeRequestModal } from '../../features/shiftChange/components/ShiftChangeRequestModal'

/* ───── helpers ───── */
function startOfWeek(d) {
  const dt = new Date(d); const day = dt.getDay()
  const diff = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diff); dt.setHours(0, 0, 0, 0)
  return dt
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function fmtISO(d) { return formatLocalISODate(d) }
function fmtTime(t) { return t ? String(t).substring(0, 5) : '—' }

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
const MONTH_NAMES = ['Th01', 'Th02', 'Th03', 'Th04', 'Th05', 'Th06', 'Th07', 'Th08', 'Th09', 'Th10', 'Th11', 'Th12']

const REG_STATUS_CFG = {
  PENDING:  { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700', icon: 'hourglass_top' },
  APPROVED: { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700', icon: 'check_circle' },
  REJECTED: { label: 'Từ chối', cls: 'bg-red-100 text-red-700', icon: 'cancel' },
  CANCELLED:{ label: 'Đã hủy', cls: 'bg-slate-100 text-slate-600', icon: 'block' },
}

export function MySchedulePage() {
  const { groupId } = useParams()

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))

  // Calendar data (B19)
  const [calendarItems, setCalendarItems] = useState([])
  const [loadingCal, setLoadingCal] = useState(true)

  /* Ca trong tuần — chỉ tải khi mở modal đổi ca */
  const [shifts, setShifts] = useState([])
  const [myPositions, setMyPositions] = useState([])

  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  // Cancel modal (B13)
  const [cancelItem, setCancelItem] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  // Shift change request modal (B21/B22)
  const [changeFromItem, setChangeFromItem] = useState(null)
  const [preparingChange, setPreparingChange] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState([])

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  /* ───── Load my calendar (B19) ───── */
  async function loadCalendar() {
    setLoadingCal(true); setError(null)
    try {
      const res = await getMyCalendar({ from: fmtISO(weekStart), to: fmtISO(weekEnd) })
      const unwrapped = unwrapApiResponse(res)
      const rawItems = Array.isArray(unwrapped) ? unwrapped : (unwrapped?.items ?? [])
      const list = (Array.isArray(rawItems) ? rawItems : []).map((item) => ({
        ...item,
        registrationStatus: item.registrationStatus ?? item.status ?? 'PENDING',
        shiftName: item.shiftName ?? item.name ?? null,
      }))
      setCalendarItems(list)
    } catch (err) {
      setError(err?.message || 'Không thể tải lịch cá nhân')
    } finally { setLoadingCal(false) }
  }

  async function loadShiftsForChangeModal() {
    const [sRes, mpRes] = await Promise.all([
      getShifts(groupId, fmtISO(weekStart), fmtISO(weekEnd)),
      getMyPositions(groupId).catch(() => null),
    ])
    setShifts(unwrapApiArray(sRes))
    setMyPositions(mpRes ? unwrapApiArray(mpRes) : [])
  }

  useEffect(() => {
    loadCalendar()
  }, [groupId, weekStart])

  /* ───── Calendar by date ───── */
  const calByDate = useMemo(() => {
    const items = Array.isArray(calendarItems) ? calendarItems : []
    const map = {}
    weekDays.forEach(d => { map[fmtISO(d)] = [] })
    items.forEach(item => {
      const key = item.date
      if (map[key]) map[key].push(item)
      else map[key] = [item]
    })
    return map
  }, [calendarItems, weekDays])

  function prevWeek() { setWeekStart(addDays(weekStart, -7)) }
  function nextWeek() { setWeekStart(addDays(weekStart, 7)) }
  function goToday() { setWeekStart(startOfWeek(new Date())) }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  /* ───── Cancel registration (B13) ───── */
  async function handleCancel(e) {
    e.preventDefault()
    setCancelling(true); setError(null)
    try {
      await cancelRegistration(cancelItem.registrationId, cancelReason.trim() || null)
      showToast('Đã hủy đăng ký thành công.')
      setCancelItem(null); setCancelReason('')
      await loadCalendar()
    } catch (err) {
      setError(err?.message || 'Không thể hủy đăng ký')
    } finally { setCancelling(false) }
  }

  /* ───── Shift change request (B21) ───── */
  async function handleOpenShiftChange(item) {
    setError(null)
    setPreparingChange(true)
    try {
      await Promise.all([
        loadShiftsForChangeModal(),
        getMyAvailability()
          .then((res) => setAvailabilitySlots(unwrapApiArray(res)))
          .catch(() => setAvailabilitySlots([])),
      ])
      setChangeFromItem(item)
    } catch (err) {
      setError(err?.message || 'Không thể chuẩn bị dữ liệu đổi ca')
    } finally {
      setPreparingChange(false)
    }
  }

  async function handleShiftChangeCreated() {
    setChangeFromItem(null)
    showToast('Đã gửi yêu cầu đổi ca thành công! Chờ duyệt.')
    await loadCalendar()
  }

  const loading = loadingCal

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Cá nhân</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Lịch làm việc</h2>
          <p className="text-on-surface-variant font-medium">
            Xem lịch ca đã đăng ký và trạng thái duyệt. Đăng ký ca mở tại mục <strong>Lịch ca</strong>.
          </p>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between bg-surface-container-lowest rounded-2xl border border-outline/10 px-5 py-3 shadow-sm">
        <button onClick={prevWeek} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={goToday}
            className="px-3 py-1.5 text-xs font-bold text-primary bg-primary-container/30 rounded-lg hover:bg-primary-container/50 transition-colors">
            Hôm nay
          </button>
          <span className="text-base font-bold text-on-surface">
            {MONTH_NAMES[weekStart.getMonth()]} {weekStart.getDate()} — {MONTH_NAMES[weekEnd.getMonth()]} {weekEnd.getDate()}, {weekEnd.getFullYear()}
          </span>
        </div>
        <button onClick={nextWeek} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {error && <div className="bg-error-container/20 text-on-error-container rounded-xl p-4 text-center">{error}</div>}
      {loading && <div className="text-center py-12"><p className="text-on-surface-variant animate-pulse">Đang tải...</p></div>}

      {/* ═══ My Calendar (B19) ═══ */}
      {!loading && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-on-surface">{calendarItems.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng đăng ký</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-emerald-600">{calendarItems.filter(i => i.registrationStatus === 'APPROVED').length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Đã duyệt</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-amber-600">{calendarItems.filter(i => i.registrationStatus === 'PENDING').length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Chờ duyệt</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-red-600">{calendarItems.filter(i => i.registrationStatus === 'REJECTED').length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Từ chối</p>
            </div>
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDays.map((day, idx) => {
              const key = fmtISO(day)
              const items = calByDate[key] || []
              const isToday = key === fmtISO(new Date())
              return (
                <div key={key}
                  className={`rounded-2xl border transition-all flex flex-col ${
                    isToday ? 'bg-primary-container/10 border-primary/20 shadow-md ring-1 ring-primary/10'
                    : 'bg-surface-container-lowest border-outline/10 shadow-sm'
                  }`}>
                  <div className={`px-3 py-3 border-b flex items-center gap-2 ${isToday ? 'border-primary/10' : 'border-outline/5'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${isToday ? 'bg-primary text-on-primary' : 'text-on-surface'}`}>
                      {day.getDate()}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{DAY_LABELS[idx]}</span>
                  </div>
                  <div className="flex-1 p-2 space-y-2 min-h-[100px]">
                    {items.length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[10px] text-on-surface-variant opacity-30">Trống</p>
                      </div>
                    )}
                    {items.map(item => {
                      const st = REG_STATUS_CFG[item.registrationStatus] || REG_STATUS_CFG.PENDING
                      return (
                        <div key={item.registrationId}
                          className="rounded-xl border border-outline/10 p-2.5 bg-white/50 hover:shadow-sm transition-all">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-3 h-3 rounded flex-shrink-0"
                              style={{ backgroundColor: item.positionColorCode || '#6366f1' }} />
                            <span className="text-xs font-bold text-on-surface truncate">{item.shiftName || 'Ca'}</span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant font-medium mb-1.5 pl-[18px]">
                            {fmtTime(item.startTime)} – {fmtTime(item.endTime)}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${st.cls}`}>
                              <span className="material-symbols-outlined text-[10px]">{st.icon}</span>
                              {st.label}
                            </span>
                            {(item.registrationStatus === 'PENDING' || item.registrationStatus === 'APPROVED') && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setCancelItem(item)
                                    setCancelReason('')
                                  }}
                                  className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded transition-all"
                                  title="Hủy đăng ký"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                                {item.registrationStatus === 'APPROVED' && (
                                  <button
                                    onClick={() => handleOpenShiftChange(item)}
                                    disabled={preparingChange}
                                    className="p-1 text-on-surface-variant hover:text-primary hover:bg-primary-container/30 rounded transition-all disabled:opacity-60"
                                    title="Xin đổi ca"
                                  >
                                    <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {item.positionName && (
                            <p className="text-[9px] text-on-surface-variant mt-1 pl-[18px] truncate">📋 {item.positionName}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {calendarItems.length === 0 && (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-outline/10 border-dashed">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">event_busy</span>
              <h3 className="text-xl font-bold text-on-surface mb-2">Chưa có lịch</h3>
              <p className="text-on-surface-variant font-medium">Vào <strong>Lịch ca</strong> trên menu để xem ca đang mở và đăng ký.</p>
            </div>
          )}
        </>
      )}

      {/* ═══ Cancel Registration Modal (B13) ═══ */}
      {cancelItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay" onClick={() => setCancelItem(null)}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-[fadeIn_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-outline/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-error">event_busy</span>
                Hủy đăng ký ca
              </h3>
              <button onClick={() => setCancelItem(null)} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCancel} className="p-6 space-y-5">
              <div className="bg-error-container/10 border border-error/20 rounded-xl p-4">
                <p className="text-sm font-bold text-on-surface">{cancelItem.shiftName || 'Ca'}</p>
                <p className="text-xs text-on-surface-variant mt-1">{cancelItem.date} · {fmtTime(cancelItem.startTime)} – {fmtTime(cancelItem.endTime)}</p>
                {cancelItem.positionName && (
                  <p className="text-xs text-on-surface-variant mt-1">📋 {cancelItem.positionName}</p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex items-start gap-2">
                <span className="material-symbols-outlined text-base mt-0.5">warning</span>
                <span>Sau khi hủy, bạn có thể cần đăng ký lại và chờ duyệt.</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Lý do hủy</label>
                <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do (tùy chọn)..." rows={2}
                  className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCancelItem(null)}
                  className="px-5 py-2.5 text-on-surface-variant font-semibold rounded-lg hover:bg-surface-container-high transition-colors">Quay lại</button>
                <button type="submit" disabled={cancelling}
                  className="px-5 py-2.5 bg-error text-on-error font-semibold rounded-lg hover:bg-error/90 transition-colors shadow-md disabled:opacity-50">
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Shift Change Request Modal (B21/B22) ═══ */}
      {changeFromItem && (
        <ShiftChangeRequestModal
          open={!!changeFromItem}
          onClose={() => setChangeFromItem(null)}
          groupId={groupId}
          fromItem={changeFromItem}
          availableShifts={shifts}
          availabilitySlots={availabilitySlots}
          myPositions={myPositions}
          onCreated={handleShiftChangeCreated}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] shadow-2xl border rounded-2xl px-6 py-4 flex items-center gap-3 animate-[fadeIn_0.2s_ease-out] max-w-md ${
          toast.type === 'success' ? 'bg-surface border-emerald-200' : 'bg-surface border-error/20'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-100' : 'bg-error-container/30'
          }`}>
            <span className={`material-symbols-outlined ${
              toast.type === 'success' ? 'text-emerald-600' : 'text-error'
            }`}>{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          </div>
          <p className="text-sm font-medium text-on-surface">{toast.msg}</p>
          <button onClick={() => setToast(null)} className="p-1 text-on-surface-variant hover:text-on-surface flex-shrink-0">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}
    </div>
  )
}
