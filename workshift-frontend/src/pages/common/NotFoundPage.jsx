import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div style={{ padding: 16 }}>
      <h2>Không tìm thấy trang</h2>
      <p>
        <Link to="/">Về trang chính</Link>
      </p>
    </div>
  )
}

