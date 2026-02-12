import { Link } from 'react-router-dom';

export default function WholesaleAccess() {
  return (
    <section className="bg-black text-white py-16 md:py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="border border-white/10 rounded-lg p-6 md:p-8 mb-12">
          <p className="text-white/70 text-sm md:text-base leading-relaxed">
            <strong className="text-white/90">Importante:</strong> Ambos tipos de revendedor tienen acceso al mismo descuento del 40% sobre precios al público. La diferencia radica en el período de vigencia del acceso, los beneficios adicionales y los requisitos de permanencia. Nuestro equipo está disponible para ayudarte a elegir el programa que mejor se adapte a tus necesidades.
          </p>
        </div>

        <div className="border-t border-white/10 my-12" />

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg className="w-6 h-6 text-white/90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="font-heading text-xl md:text-2xl font-semibold tracking-wider text-white">
              Acceso Mayorista
            </h3>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="wholesale-email" className="block text-xs uppercase tracking-widest text-white/60 mb-2">
                Email
              </label>
              <input
                id="wholesale-email"
                type="email"
                placeholder=""
                className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="wholesale-password" className="block text-xs uppercase tracking-widest text-white/60 mb-2">
                Contraseña
              </label>
              <input
                id="wholesale-password"
                type="password"
                placeholder=""
                className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white text-black font-body text-sm font-semibold uppercase tracking-widest py-4 rounded hover:bg-white/90 transition-colors"
            >
              Ingresar
            </button>
          </form>

          <p className="text-center text-white/60 text-sm mt-6">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-[rgb(0,255,255)] hover:underline">
              Registrate aquí
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
