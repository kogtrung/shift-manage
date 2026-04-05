import { useState, useEffect, useMemo } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { leaveGroup } from '../../features/groups/groupApi'
import { getShifts } from '../../features/shifts/shiftApi'
import { getSalaryConfigs } from '../../features/salary/salaryApi'
import { getPositions } from '../../features/positions/positionApi'
import { getUnderstaffedAlerts } from '../../features/alerts/alertApi'
import { formatLocalISODate } from '../../utils/dateUtils'
import { unwrapApiArray } from '../../api/apiClient'

/* ───── date helpers ───── */
function startOfWeek(d) {
  const dt = new Date(d)
  const day = dt.getDay()
  const diff = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diff)
  dt.setHours(0, 0, 0, 0)
  return dt
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function fmtISO(d) { return formatLocalISODate(d) }
function fmtTime(t) { return t ? String(t).substring(0, 5) : '—' }
function isToday(d) { return fmtISO(d) === fmtISO(new Date()) }
function parseDateOnly(d) {
  // Backend LocalDate -> "YYYY-MM-DD"
  if (!d) return null
  if (d instanceof Date) return d
  const parts = String(d).split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null
  const [y, m, day] = parts
  return new Date(y, m - 1, day)
}

function parseTime(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h + m / 60
}
function getDuration(s, e) {
  return Math.max(0, parseTime(e) - parseTime(s))
}
function fmtCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}

function getHourlyRateForMember({ salaries, userId, positionId }) {
  const uId = userId == null ? null : Number(userId)
  const pId = positionId == null ? null : Number(positionId)
  if (!Array.isArray(salaries) || salaries.length === 0) return null

  const byUser = uId != null
    ? salaries.find(c => c.userId != null && Number(c.userId) === uId && c.hourlyRate != null)
    : null
  if (byUser?.hourlyRate != null) return Number(byUser.hourlyRate)

  const byPos = pId != null
    ? salaries.find(c => c.positionId != null && Number(c.positionId) === pId && c.hourlyRate != null)
    : null
  if (byPos?.hourlyRate != null) return Number(byPos.hourlyRate)

  return null
}

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
const STATUS_CFG = {
  OPEN: { label: 'Mở', cls: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  LOCKED: { label: 'Khóa', cls: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Xong', cls: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' },
}

// Chuyển màu HEX thành RGB dùng cho rgba opacity
function hexToRgba(hex, opacity) {
  let c = hex.replace('#', '')
  if (c.length === 3) c = c.split('').map(x => x + x).join('')
  if (c.length !== 6) return `rgba(200, 200, 200, ${opacity})`
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export function GroupHomePage() {
  const { groupId } = useParams()
  const { groupInfo, isManager } = useOutletContext() || {}
  const { user } = useAuth()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)

  // Calendar State
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [shifts, setShifts] = useState([])
  const [salaries, setSalaries] = useState([])
  const [positions, setPositions] = useState([])
  const [understaffAlerts, setUnderstaffAlerts] = useState([])
  const [loadingShifts, setLoadingShifts] = useState(false)

  useEffect(() => {
    if (!groupId) return
    async function fetchData() {
      setLoadingShifts(true)
      try {
        const from = fmtISO(weekStart)
        const to = fmtISO(addDays(weekStart, 6))
        
        const [shiftRes, posRes] = await Promise.all([
          getShifts(groupId, from, to),
          getPositions(groupId)
        ])
        setShifts(unwrapApiArray(shiftRes))
        setPositions(unwrapApiArray(posRes))
        
        try {
          const salRes = await getSalaryConfigs(groupId)
          setSalaries(Array.isArray(salRes) ? salRes : (salRes?.data ?? []))
        } catch (e) {
          // Có thể staff không có quyền xem salary configs; vẫn cho phép load trang.
          console.warn('Salary config fetch failed', e)
          setSalaries([])
        }

        if (isManager) {
          try {
            const alertRes = await getUnderstaffedAlerts(groupId)
            setUnderstaffAlerts(Array.isArray(alertRes) ? alertRes : (alertRes?.data ?? []))
          } catch (e) {
            setUnderstaffAlerts([])
          }
        } else {
          setUnderstaffAlerts([])
        }
      } catch (err) {
        console.error('Failed to load overview data', err)
      } finally {
        setLoadingShifts(false)
      }
    }
    fetchData()
  }, [groupId, isManager, weekStart])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const shiftsByDate = useMemo(() => {
    const map = {}
    shifts.forEach(s => {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    })
    return map
  }, [shifts])

  const weekStartDate = useMemo(() => {
    return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
  }, [weekStart])

  const weekEndDate = useMemo(() => {
    return addDays(weekStartDate, 6)
  }, [weekStartDate])

  // shiftId -> shortage (totalRequired - totalApproved) chỉ trong phạm vi 1 tuần hiển thị
  const shortageByShiftId = useMemo(() => {
    const map = {}
    if (!Array.isArray(understaffAlerts) || understaffAlerts.length === 0) return map

    understaffAlerts.forEach((a) => {
      const d = parseDateOnly(a.date)
      if (!d) return
      if (d < weekStartDate || d > weekEndDate) return
      const shiftId = a.shiftId == null ? null : String(a.shiftId)
      if (!shiftId) return
      const shortage = Math.max(0, (a.totalRequired || 0) - (a.totalApproved || 0))
      if (shortage > 0) map[shiftId] = shortage
    })

    return map
  }, [understaffAlerts, weekStartDate, weekEndDate])

  const displayPositions = useMemo(() => {
    if (isManager) return positions

    const myPosIds = new Set()
    shifts.forEach(s => {
      ;(s.assignedMembers || []).forEach(am => {
        if (String(am.userId) === String(user?.id) && am.positionId != null) {
          myPosIds.add(am.positionId)
        }
      })
    })

    if (myPosIds.size === 0) return []
    return positions.filter(p => myPosIds.has(p.id))
  }, [positions, shifts, isManager, user])

  const metrics = useMemo(() => {
    let totalHours = 0
    let totalSalary = 0
    let hasSalaryRate = false
    const shiftIds = new Set()

    shifts.forEach(s => {
      const dur = getDuration(s.startTime, s.endTime)
      const assigned = s.assignedMembers || []

      if (isManager) {
        shiftIds.add(s.id)
        assigned.forEach(am => {
          totalHours += dur
          // Một số API có thể không trả về `positionId` trong `assignedMembers`,
          // khi đó suy ra `positionId` từ `positionName` dựa trên danh sách `positions`.
          const resolvedPositionId =
            am?.positionId ??
            am?.position?.id ??
            (am?.positionName
              ? positions.find(p => String(p.name) === String(am.positionName))?.id
              : null)

          const rate = getHourlyRateForMember({
            salaries,
            userId: am.userId,
            positionId: resolvedPositionId,
          })
          if (rate != null) {
            hasSalaryRate = true
            totalSalary += dur * rate
          }
        })
      } else {
        // Staff: chỉ tính theo ca của chính mình
        const myAssigned = assigned.filter(am => String(am.userId) === String(user?.id))
        if (myAssigned.length > 0) {
          shiftIds.add(s.id)
          totalHours += dur
          const my = myAssigned[0]
          const resolvedPositionId =
            my?.positionId ??
            my?.position?.id ??
            (my?.positionName
              ? positions.find(p => String(p.name) === String(my.positionName))?.id
              : null)

          const rate = getHourlyRateForMember({
            salaries,
            userId: my.userId,
            positionId: resolvedPositionId,
          })
          if (rate != null) {
            hasSalaryRate = true
            totalSalary += dur * rate
          }
        }
      }
    })

    return {
      totalShifts: shiftIds.size,
      totalHours: totalHours.toFixed(1),
      totalSalary: hasSalaryRate ? totalSalary : null,
    }
  }, [shifts, salaries, isManager, user, positions])

  async function handleLeave() {
    if (!confirm('Bạn có chắc chắn muốn rời group này?')) return
    setLeaving(true)
    try {
      await leaveGroup(groupId)
      navigate('/app/groups', { replace: true })
    } catch (err) {
      alert(err?.message || 'Không thể rời group')
    } finally {
      setLeaving(false)
    }
  }

  // Staff chỉ xem lịch cá nhân của mình; Manager xem toàn bộ ca của nhóm.
  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">
            {isManager ? 'Bảng điều khiển quản lý' : 'Bảng điều khiển nhân viên'}
          </p>
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Tổng quan Tuần
          </h2>
          <p className="text-sm text-on-surface-variant font-medium">Lịch làm việc và thống kê {isManager ? 'nhóm' : 'cá nhân'} của tuần hiện tại.</p>
        </div>

        {/* Leave group button for Staff */}
        {!isManager && groupInfo && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="px-4 py-2 bg-surface-container-lowest text-error font-semibold rounded-lg border border-error/20 hover:bg-error/5 transition-colors flex items-center gap-2 self-start"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-sm">{leaving ? 'Đang rời...' : 'Rời group'}</span>
          </button>
        )}
      </div>

      {/* Weekly Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.03)] border border-outline/10 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-sm">event_note</span>
            Số ca {isManager ? 'của tuần' : 'đã đăng ký'}
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-black text-on-surface tracking-tighter">{metrics.totalShifts}</div>
            <div className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-widest">Ca</div>
          </div>
        </div>
        
        <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.03)] border border-outline/10 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-tertiary/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-tertiary text-sm">schedule</span>
            Tổng giờ làm
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-black text-on-surface tracking-tighter">{metrics.totalHours}</div>
            <div className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-widest">Giờ</div>
          </div>
        </div>
        
        {true && (
          <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.03)] border border-outline/10 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-sm">payments</span>
              {isManager ? 'Chi phí ước tính' : 'Lương dự kiến'}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-black text-emerald-700 tracking-tighter">
                {metrics.totalSalary == null ? '—' : fmtCurrency(metrics.totalSalary)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Weekly Overview Calendar ═══ */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">calendar_view_week</span>
            Làm việc trong tuần
          </h3>
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl p-1 border border-outline/10">
            <button onClick={() => setWeekStart(d => addDays(d, -7))} className="p-1 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <div className="px-3 text-xs font-bold text-on-surface">
              {fmtISO(weekStart)} – {fmtISO(addDays(weekStart, 6))}
            </div>
            <button onClick={() => setWeekStart(d => addDays(d, 7))} className="p-1 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        {displayPositions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 py-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mr-1">Vị trí:</span>
            {displayPositions.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-1 border border-outline/10 rounded-md shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.colorCode || '#ccc' }}></div>
                <span className="text-[10px] font-bold text-on-surface">{p.name}</span>
              </div>
            ))}
          </div>
        )}

        {loadingShifts ? (
          <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-outline/10"><p className="text-on-surface-variant animate-pulse font-bold tracking-widest uppercase text-xs">Đang tải lịch tuần...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
              const key = fmtISO(day)
              const dayShiftsAll = shiftsByDate[key] || []
              const dayShifts = isManager
                ? dayShiftsAll
                : dayShiftsAll.filter(shift => (shift.assignedMembers || []).some(am => String(am.userId) === String(user?.id)))
              const today = isToday(day)
              return (
                <div key={key} className={`rounded-lg border transition-all flex flex-col ${today ? 'bg-primary-container/10 border-primary/30 ring-1 ring-primary/20' : 'bg-surface-container-lowest border-outline/5 hover:border-outline/20'}`}>
                  <div className={`px-2 py-1.5 border-b flex items-center justify-between ${today ? 'border-primary/20' : 'border-outline/5'}`}>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${today ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface'}`}>
                        {day.getDate()}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {DAY_LABELS[idx]}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-1.5 space-y-1.5">
                    {dayShifts.length === 0 && (
                      <div className="flex items-center justify-center py-4">
                        <p className="text-[9px] text-on-surface-variant opacity-30 uppercase tracking-widest font-bold">Trống</p>
                      </div>
                    )}
                    
                    {dayShifts.map(shift => {
                      const st = STATUS_CFG[shift.status] || STATUS_CFG.OPEN
                      const assignedAll = shift.assignedMembers || []
                      const isMyShift = assignedAll.some(am => String(am.userId) === String(user?.id))
                      const assigned = isManager
                        ? assignedAll
                        : assignedAll.filter(am => String(am.userId) === String(user?.id))
                      const shortage = isManager ? (shortageByShiftId[String(shift.id)] || 0) : 0
                      
                      return (
                        <div key={shift.id} className={`rounded border p-2 transition-colors ${st.cls} ${!isManager && !isMyShift ? 'opacity-50 grayscale flex-shrink-0' : 'shadow-sm'}`}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                            <span className="min-w-0 flex-1 text-[10px] font-extrabold text-on-surface truncate" title={shift.name}>
                              {shift.name || 'Ca'}
                            </span>
                            {isManager && shortage > 0 && (
                              <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error/10 border border-error/20 text-error text-[9px] font-bold flex-shrink-0">
                                <span className="material-symbols-outlined text-[12px]">warning</span>
                                Thiếu {shortage}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-on-surface-variant font-black tracking-widest mb-1.5 pl-2.5">
                            {fmtTime(shift.startTime)}-{fmtTime(shift.endTime)}
                          </p>
                          
                          {/* Colored Badges for Assigned Members */}
                          {assigned.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {assigned.map(am => {
                                const color = am.colorCode || '#888888'
                                const bgColor = hexToRgba(color, 0.15)
                                return (
                                  <div key={am.userId} 
                                       className="flex items-center px-1.5 py-0.5 rounded-[4px] border"
                                       style={{ backgroundColor: bgColor, borderColor: hexToRgba(color, 0.3) }}
                                       title={am.positionName}>
                                    <span className="truncate text-[9px] font-bold w-full" style={{ color: color }}>
                                      {am.fullName}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="pl-2.5">
                              <span className="text-[9px] text-on-surface-variant opacity-60 font-medium italic">Chưa xếp người</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
