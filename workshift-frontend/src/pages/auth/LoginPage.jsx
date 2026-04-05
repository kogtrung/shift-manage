import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { unwrapApiResponse } from '../../api/apiClient'
import { login } from '../../features/auth/authApi'
import { useAuth } from '../../features/auth/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { setTokens } = useAuth()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => {
    return usernameOrEmail.trim().length > 0 && password.length > 0 && !isSubmitting
  }, [usernameOrEmail, password, isSubmitting])

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setError('')
    setIsSubmitting(true)
    try {
      const payload = await login({ usernameOrEmail: usernameOrEmail.trim(), password })
      const data = unwrapApiResponse(payload)
      setTokens({ accessToken: data.token, refreshToken: data.refreshToken, remember })
      navigate('/app/groups', { replace: true })
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-[calc(100vh-32px)] flex items-center justify-center p-6 selection:bg-primary-container selection:text-on-primary-container">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary-container/20 blur-[120px]" />
        <div className="absolute bottom-[5%] right-[0%] w-[30%] h-[30%] rounded-full bg-tertiary-container/30 blur-[100px]" />
      </div>

      <main className="relative z-10 w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-12 h-12 mb-4 rounded-xl primary-gradient flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-2xl">coffee</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface">WorkShift</h1>
          <p className="text-on-surface-variant text-sm mt-1 font-medium tracking-wide">Quản lý lịch làm việc của bạn.</p>
        </div>

        <div className="glass-panel rounded-xl p-8 shadow-2xl shadow-on-surface/5 border border-white/50">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-on-surface mb-1">Chào mừng bạn trở lại</h2>
            <p className="text-on-surface-variant text-sm">Nhập thông tin để quản lý ca làm việc hôm nay.</p>
          </div>

          {error ? (
            <div className="mb-6 bg-error-container/20 text-on-error-container rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-1.5 group">
              <label
                className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-0.5"
                htmlFor="usernameOrEmail"
              >
                Email / Tên đăng nhập
              </label>
              <div className="soft-inset bg-surface-container-low flex items-center px-1">
                <span className="material-symbols-outlined text-on-surface-variant/60 px-2 text-xl">
                  alternate_email
                </span>
                <input
                  className="w-full bg-transparent border-none focus:ring-0 py-3 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                  id="usernameOrEmail"
                  placeholder="name@domain.com"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <div className="flex justify-between items-end">
                <label
                  className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-0.5"
                  htmlFor="password"
                >
                Mật khẩu
                </label>
                <button
                  className="text-xs font-bold text-primary hover:text-primary-dim transition-colors"
                  type="button"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="soft-inset bg-surface-container-low flex items-center px-1">
                <span className="material-symbols-outlined text-on-surface-variant/60 px-2 text-xl">lock_open</span>
                <input
                  className="w-full bg-transparent border-none focus:ring-0 py-3 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  className="px-2 text-on-surface-variant/60 hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 px-0.5">
              <input
                className="w-4 h-4 rounded text-primary border-outline/30 focus:ring-primary/20 bg-surface"
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className="text-sm font-medium text-on-surface-variant cursor-pointer" htmlFor="remember">
                Duy trì đăng nhập
              </label>
            </div>

            <button
              className="w-full primary-gradient text-on-primary py-3.5 rounded-lg font-bold text-sm tracking-wide shadow-md shadow-primary/30 active:scale-[0.98] transition-all hover:shadow-lg hover:shadow-primary/40 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={!canSubmit}
            >
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-tighter">
              <span className="bg-surface-container-lowest px-4 text-on-surface-variant font-bold">Hoặc tạo tài khoản mới</span>
            </div>
          </div>

          <Link
            className="w-full bg-surface-container-low text-on-surface-variant py-3 rounded-lg font-bold text-sm tracking-wide border border-outline/5 hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
            to="/auth/register"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Tạo tài khoản nhân viên
          </Link>
        </div>

        <div className="mt-10 text-center text-[11px] text-on-surface-variant/60">
          Chưa có tài khoản? <Link className="font-bold text-primary" to="/auth/register">Đăng ký</Link>
        </div>
      </main>
    </div>
  )
}
