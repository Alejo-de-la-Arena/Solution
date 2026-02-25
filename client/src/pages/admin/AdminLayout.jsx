import { Outlet, NavLink, Link } from 'react-router-dom';

const navItems = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/usuarios', end: false, label: 'Usuarios' },
  { to: '/admin/mayoristas', end: false, label: 'Mayoristas' },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className="w-52 border-r border-white/10 flex-shrink-0 py-8 px-4">
        <div className="w-12 h-0.5 bg-[rgb(255,0,255)] mb-6" />
        <nav className="space-y-1">
          {navItems.map(({ to, end, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `block px-3 py-2 text-sm uppercase tracking-widest border-l-2 transition-colors ${isActive
                  ? 'border-[rgb(255,0,255)] text-white bg-white/5'
                  : 'border-transparent text-white/60 hover:text-white/80 hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-12 pt-6 border-t border-white/10">
          <Link to="/" className="text-white/50 hover:text-white/80 text-sm tracking-wide">
            ← Volver al sitio
          </Link>
        </div>
      </aside>
      <main className="flex-1 px-4 md:px-8 py-20 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
