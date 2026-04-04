import { useEffect, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { getPayroll } from '../../features/payroll/payrollApi'

function fmtCurrency(val) {
  return Number(val).toLocaleString('vi-VN') + 'đ'
}

export function PayrollPage() {
  const { groupId } = useParams()
  const { isManager } = useOutletContext() || {}

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [payroll, setPayroll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadPayroll() {
    setLoading(true); setError(null)
    try {
      const res = await getPayroll(groupId, month, year)
      setPayroll(res?.data ?? res ?? null)
    } catch (err) {
      setError(err?.message || 'Không thể tải bảng lương')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadPayroll() }, [groupId, month, year])

  const entries = payroll?.entries || []
  const totalShifts = entries.reduce((s, e) => s + (e.totalShifts || 0), 0)
  const totalHours = entries.reduce((s, e) => s + Number(e.totalHours || 0), 0)
  const totalPay = entries.reduce((s, e) => s + Number(e.totalPay || 0), 0)

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  if (!isManager) {
    return (
      <div className="w-full text-center py-20">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">lock</span>
        <h3 className="text-xl font-bold text-on-surface mb-2">Không có quyền truy cập</h3>
        <p className="text-on-surface-variant">Chỉ quản lý mới có thể xem bảng lương.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Quản lý</p>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Bảng lương</h2>
        <p className="text-on-surface-variant font-medium">Tổng hợp lương nhân viên theo tháng</p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between bg-surface-container-lowest rounded-2xl border border-outline/10 px-5 py-3 shadow-sm">
        <button onClick={prevMonth} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="text-lg font-bold text-on-surface">
          Tháng {String(month).padStart(2, '0')} / {year}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {error && <div className="bg-error-container/20 text-on-error-container rounded-xl p-4 text-center">{error}</div>}
      {loading && <div className="text-center py-12"><p className="text-on-surface-variant animate-pulse">Đang tải...</p></div>}

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-on-surface">{entries.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Nhân viên</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-primary">{totalShifts}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng ca</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-amber-600">{totalHours.toFixed(1)}h</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng giờ</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-2xl font-black text-emerald-600">{fmtCurrency(totalPay)}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng lương</p>
          </div>
        </div>
      )}

      {/* Payroll Table */}
      {!loading && !error && entries.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-surface-container-low border-b border-outline/10">
            <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
              Chi tiết bảng lương — Tháng {month}/{year}
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline/10 bg-surface-container/30">
                  <th className="text-left px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">#</th>
                  <th className="text-left px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Nhân viên</th>
                  <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Số ca</th>
                  <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Tổng giờ</th>
                  <th className="text-right px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Lương/giờ</th>
                  <th className="text-right px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Tổng lương</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/5">
                {entries.map((entry, idx) => (
                  <tr key={entry.userId} className="hover:bg-surface-container/20 transition-colors">
                    <td className="px-6 py-4 text-on-surface-variant font-medium">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold">
                          {(entry.fullName || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-on-surface">{entry.fullName || `NV #${entry.userId}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-on-surface">{entry.totalShifts}</td>
                    <td className="px-4 py-4 text-center font-medium text-on-surface">{Number(entry.totalHours).toFixed(1)}h</td>
                    <td className="px-4 py-4 text-right text-on-surface-variant font-medium">{fmtCurrency(entry.hourlyRate)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-emerald-600">{fmtCurrency(entry.totalPay)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-outline/20 bg-primary-container/5">
                  <td colSpan={2} className="px-6 py-4 font-black text-on-surface uppercase text-xs tracking-widest">Tổng cộng</td>
                  <td className="px-4 py-4 text-center font-black text-on-surface">{totalShifts}</td>
                  <td className="px-4 py-4 text-center font-black text-on-surface">{totalHours.toFixed(1)}h</td>
                  <td className="px-4 py-4"></td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600 text-lg">{fmtCurrency(totalPay)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline/10 border-dashed">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">receipt_long</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">Chưa có dữ liệu lương</h3>
          <p className="text-on-surface-variant font-medium">Không có ca nào được duyệt trong tháng {month}/{year}.</p>
        </div>
      )}
    </div>
  )
}
