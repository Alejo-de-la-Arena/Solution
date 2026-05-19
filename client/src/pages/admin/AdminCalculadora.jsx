import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/admin/calculadora', end: true, label: 'Reporte' },
  { to: '/admin/calculadora/costos', end: false, label: 'Costos' },
  { to: '/admin/calculadora/gastos', end: false, label: 'Gastos fijos' },
];

export default function AdminCalculadora() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl tracking-widest mb-1">Calculadora</h1>
        <p className="text-white/50 text-sm">
          Cálculo de ganancia neta: ingresos, comisiones, impuestos, costo de producto, envío y gastos fijos.
        </p>
      </div>

      <nav className="flex gap-1 border-b border-white/10 mb-8">
        {tabs.map(({ to, end, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `px-4 py-3 text-xs uppercase tracking-widest border-b-2 transition-colors ${
                isActive
                  ? 'border-[rgb(255,0,255)] text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
