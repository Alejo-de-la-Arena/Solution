import { Outlet, NavLink, Link } from 'react-router-dom';

const ChartIcon = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <line x1="3" y1="21" x2="21" y2="21" />
    <rect x="5" y="11" width="3.2" height="7" />
    <rect x="10.4" y="7" width="3.2" height="11" />
    <rect x="15.8" y="13" width="3.2" height="5" />
  </svg>
);

const navItems = [
  { to: '/admin/metricas', end: false, label: 'Métricas', icon: ChartIcon },
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/pedidos', end: false, label: 'Pedidos' },
  { to: '/admin/productos', end: false, label: 'Productos' },
  { to: '/admin/combos', end: false, label: 'Combos' },
  { to: '/admin/usuarios', end: false, label: 'Usuarios' },
  { to: '/admin/mayoristas', end: false, label: 'Mayoristas' },
  { to: '/admin/gestionar', end: false, label: 'Gestionar' },
  { to: '/admin/calculadora', end: false, label: 'Calculadora' },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className="w-52 border-r border-white/10 flex-shrink-0 py-8 px-4">
        <div className="w-12 h-0.5 bg-[rgb(255,0,255)] mb-6" />
        <nav className="space-y-1">
          {navItems.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 text-sm uppercase tracking-widest border-l-2 transition-colors ${isActive
                  ? 'border-[rgb(255,0,255)] text-white bg-white/5'
                  : 'border-transparent text-white/60 hover:text-white/80 hover:bg-white/5'
                }`
              }
            >
              {Icon ? <Icon className="flex-shrink-0" /> : null}
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
