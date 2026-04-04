import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { unwrapApiResponse } from '../../api/apiClient'
import { register } from '../../features/auth/authApi'

export function RegisterPage() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      username.trim().length >= 3 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      confirmPassword.length > 0 &&
      !isSubmitting
    )
  }, [fullName, username, email, password, confirmPassword, isSubmitting])

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setError('')
    setSuccess('')
    setIsSubmitting(true)
    try {
      const payload = await register({
        username: username.trim(),
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      })
      unwrapApiResponse(payload)
      setSuccess('Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.')
      navigate('/auth/login', { replace: true })
    } catch (err) {
      setError(err?.message || 'Đăng ký thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-background text-on-background min-h-[calc(100vh-32px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-8 shadow-[0_24px_48px_rgba(0,52,94,0.06)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10 text-center mb-8">
          <span className="inline-block px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[11px] font-bold uppercase tracking-[0.1em] rounded-full mb-4">
            Tham gia đội
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">Đăng ký tài khoản nhân viên</h1>
          <p className="text-on-surface-variant mt-2 text-sm">Tạo tài khoản để bắt đầu quản lý ca làm việc.</p>
        </div>

        {error ? (
          <div className="relative z-10 mb-6 bg-error-container/20 text-on-error-container rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="relative z-10 mb-6 bg-primary-container/60 text-on-primary-container rounded-xl px-4 py-3 text-sm font-medium">
            {success}
          </div>
        ) : null}

        <form className="space-y-6 relative z-10" onSubmit={onSubmit}>
          <div className="group">
            <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">
              Họ và tên
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                person
              </span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-b border-outline/20 rounded-xl focus:outline-none focus:border-primary transition-all duration-300 placeholder:text-outline/50 text-on-surface"
                placeholder="Nguyễn Văn A"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">
              Tên đăng nhập
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                badge
              </span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-b border-outline/20 rounded-xl focus:outline-none focus:border-primary transition-all duration-300 placeholder:text-outline/50 text-on-surface"
                placeholder="ten.dang.nhap"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">
              Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                mail
              </span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-b border-outline/20 rounded-xl focus:outline-none focus:border-primary transition-all duration-300 placeholder:text-outline/50 text-on-surface"
                placeholder="name@domain.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">
              Số điện thoại (tuỳ chọn)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                call
              </span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-b border-outline/20 rounded-xl focus:outline-none focus:border-primary transition-all duration-300 placeholder:text-outline/50 text-on-surface"
                placeholder="0123456789"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                lock
              </span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-b border-outline/20 rounded-xl focus:outline-none focus:border-primary transition-all duration-300 placeholder:text-outline/50 text-on-surface"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">
              Nhập lại mật khẩu
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                verified_user
              </span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-b border-outline/20 rounded-xl focus:outline-none focus:border-primary transition-all duration-300 placeholder:text-outline/50 text-on-surface"
                placeholder="••••••••"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold rounded-xl shadow-[0_8px_16px_rgba(0,83,219,0.2)] hover:shadow-[0_12px_24px_rgba(0,83,219,0.3)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={!canSubmit}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-on-surface-variant text-sm">
              Bạn đã có tài khoản?
              <Link className="text-primary font-semibold hover:underline decoration-2 underline-offset-4 ml-1" to="/auth/login">
                Đăng nhập
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
