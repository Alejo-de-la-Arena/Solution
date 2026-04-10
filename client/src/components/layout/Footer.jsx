import { Link } from "react-router-dom";
import { CONTACT_EMAIL, WHATSAPP_NUMBER } from "../../lib/contact";

const NAV_LINKS = [
  { label: "Inicio", to: "/" },
  { label: "Tienda", to: "/tienda" },
  { label: "Programa mayorista", to: "/programa-mayorista" },
  { label: "Aplicar mayorista", to: "/aplicar-mayorista" },
  { label: "Portal mayorista", to: "/mayorista" },
];

function FooterRowLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group relative inline-flex w-full items-center justify-between py-1.5 text-sm text-white/60 transition-colors duration-200 hover:text-white/95"
    >
      <span className="min-w-0 truncate pr-3">{children}</span>
      <span className="text-white/30 transition-transform duration-200 group-hover:translate-x-1" aria-hidden>
        →
      </span>
      <span
        className="absolute left-0 right-0 bottom-0 h-[1px] origin-left scale-x-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transition-transform duration-300 group-hover:scale-x-100"
        aria-hidden
      />
    </Link>
  );
}

function InstagramIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.172.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-black text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[70vw] max-w-4xl h-[45vh] bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.12)_0%,transparent_60%)] opacity-70" />
        <div className="absolute right-0 top-0 w-[35vw] max-w-[420px] h-[30vh] bg-[radial-gradient(circle_at_left,rgba(255,0,255,0.10)_0%,transparent_65%)] opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <h3 className="text-xl tracking-[0.2em]">SOLUTION</h3>
            <p className="text-sm opacity-60 leading-relaxed">
              Fragancias premium diseñadas para el hombre contemporáneo argentino.
            </p>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden />
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.28em] opacity-60 mb-4">Contacto</h4>
            <p className="text-sm opacity-70">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 hover:text-white transition-colors duration-200"
              >
                {CONTACT_EMAIL}
                <span className="text-white/30" aria-hidden>
                  →
                </span>
              </a>
            </p>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent mt-8" aria-hidden />
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.28em] opacity-60 mb-4">Navegación</h4>
            <div className="space-y-1">
              {NAV_LINKS.map((l) => (
                <FooterRowLink key={l.to} to={l.to}>
                  {l.label}
                </FooterRowLink>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end md:items-start">
            <div className="inline-flex items-center gap-2.5">
              <a
                href="https://www.instagram.com/solution.ar/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.preventDefault()}
                aria-label="Instagram"
                className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] transition-all duration-300 hover:border-white/25 hover:bg-white/[0.06] hover:text-white hover:shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
              >
                <InstagramIcon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-[1.06]" />
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] transition-all duration-300 hover:border-white/25 hover:bg-white/[0.06] hover:text-white hover:shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
              >
                <WhatsAppIcon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-[1.06]" />
              </a>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent mt-8" aria-hidden />
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center sm:text-left">
          <p className="text-xs opacity-40">© 2026 SOLUTION. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
