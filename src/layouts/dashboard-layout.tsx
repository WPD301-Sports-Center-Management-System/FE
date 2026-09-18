import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/manager', label: 'Manager' },
  { to: '/receptionist', label: 'Receptionist' },
  { to: '/coach', label: 'Coach' },
]

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <strong className="text-lg text-blue-700">Sports Center</strong>
          <nav className="flex gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6"><Outlet /></main>
    </div>
  )
}
