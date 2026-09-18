import { Link } from 'react-router-dom'

export function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Sports Center</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Đăng nhập</h1>
        <p className="mt-2 text-slate-500">Skeleton giao diện đã sẵn sàng để kết nối API.</p>
        <form className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" type="email" placeholder="manager@sports.local" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Mật khẩu
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" type="password" placeholder="••••••••" />
          </label>
          <Link className="block rounded-lg bg-blue-600 px-4 py-2.5 text-center font-semibold text-white" to="/manager">
            Vào dashboard demo
          </Link>
        </form>
      </section>
    </main>
  )
}
