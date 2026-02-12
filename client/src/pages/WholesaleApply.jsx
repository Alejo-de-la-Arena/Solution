import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const DEFAULT_ANSWERS = {
  business_name: '',
  tax_id: '',
  address: '',
  expected_volume: '',
  comments: '',
};

export default function WholesaleApply() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState(DEFAULT_ANSWERS);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { error: insertErr } = await supabase.from('wholesale_applications').insert({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        answers,
        status: 'pending',
      });
      if (insertErr) throw insertErr;
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-0.5 bg-[rgb(0,255,255)] mb-6 mx-auto" />
          <h1 className="text-2xl font-heading tracking-wider mb-4">Recibimos tu solicitud</h1>
          <p className="text-white/70 mb-8">
            Está siendo analizada. Te avisaremos por email cuando tengamos novedades.
          </p>
          <button
            type="button"
            onClick={() => navigate('/programa-mayorista')}
            className="border border-white/30 px-6 py-2 text-sm tracking-widest hover:bg-white/5"
          >
            Volver al programa mayorista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="w-16 h-0.5 bg-[rgb(0,255,255)] mb-8 mx-auto" />
        <h1 className="text-3xl sm:text-4xl font-heading tracking-wider text-center mb-2">Aplicar a mayorista</h1>
        <p className="text-white/60 text-center text-sm mb-10">Completá el formulario para solicitar el programa mayorista.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded border border-red-500/50 bg-red-500/10 text-red-200 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="full_name" className="block text-sm tracking-wide text-white/80 mb-1">
              Nombre completo *
            </label>
            <input
              id="full_name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm tracking-wide text-white/80 mb-1">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm tracking-wide text-white/80 mb-1">
              Teléfono
            </label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none"
              placeholder="+54 11 1234-5678"
            />
          </div>
          {[
            { key: 'business_name', label: 'Nombre del negocio', placeholder: 'Ej. Mi Perfumería' },
            { key: 'tax_id', label: 'CUIT / CUIL (opcional)', placeholder: '20-12345678-9' },
            { key: 'address', label: 'Dirección', placeholder: 'Ciudad, dirección' },
            { key: 'expected_volume', label: 'Volumen estimado (opcional)', placeholder: 'Ej. 10 unidades/mes' },
            { key: 'comments', label: 'Comentarios (opcional)', placeholder: '', as: 'textarea' },
          ].map(({ key, label, placeholder, as }) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm tracking-wide text-white/80 mb-1">
                {label}
              </label>
              {as === 'textarea' ? (
                <textarea
                  id={key}
                  value={answers[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none resize-none"
                  placeholder={placeholder}
                />
              ) : (
                <input
                  id={key}
                  type="text"
                  value={answers[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none"
                  placeholder={placeholder}
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-[rgb(0,255,255)] text-white py-3 px-6 tracking-widest text-sm uppercase hover:bg-[rgb(0,255,255)]/10 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
}
