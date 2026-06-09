import { Link } from 'react-router-dom';

export default function AdminOverview() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="w-16 h-0.5 bg-[rgb(255,0,255)] mb-6" />
      <h1 className="text-3xl sm:text-4xl font-heading tracking-wider mb-4">Dashboard</h1>
      <p className="text-white/70 mb-10">Vista general del panel de administración.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Métricas', desc: 'Facturación y ventas', to: '/admin/metricas' },
          { title: 'Usuarios', desc: 'Registros y actividad', to: '/admin/usuarios' },
          { title: 'Pedidos', desc: 'Resumen por canal', to: '/admin/pedidos' },
        ].map(({ title, desc, to }) => (
          <Link
            key={title}
            to={to}
            className="border border-white/20 rounded-lg p-6 bg-white/[0.02] transition-colors hover:border-[rgb(255,0,255)]/50 hover:bg-white/[0.04]"
          >
            <h2 className="text-lg font-heading tracking-wider text-white/90 mb-2">{title}</h2>
            <p className="text-white/50 text-sm">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
