import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div><h1 className="text-4xl font-bold">404</h1><Link className="text-blue-600" to="/login">Về đăng nhập</Link></div>
    </main>
  )
}
