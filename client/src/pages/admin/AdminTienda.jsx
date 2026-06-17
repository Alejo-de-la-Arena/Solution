import { useCallback, useEffect, useState } from 'react';
import { getTiendaSettingsAdmin, updateTiendaSettings } from '../../services/tiendaSettings';

const inputClass =
  'w-full bg-[#0b0b0b] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30';
const labelClass = 'text-[0.7rem] tracking-[0.24em] uppercase text-white/50 mb-1 block';

const SECTIONS = [
  {
    key: 'hero',
    title: 'Hero',
    desc: 'Títulos grandes al inicio de la página.',
    fields: [
      { key: 'hero_title',    label: 'Título principal',          maxLen: 120 },
      { key: 'hero_subtitle', label: 'Subtítulo (parte en cursiva)', maxLen: 120 },
    ],
  },
  {
    key: 'coleccion',
    title: 'Colección',
    desc: 'Sección de sliders de productos.',
    fields: [
      { key: 'coleccion_eyebrow',      label: 'Eyebrow (texto pequeño)', maxLen: 80 },
      { key: 'coleccion_title',        label: 'Título de sección',        maxLen: 120 },
      { key: 'coleccion_row1_label',   label: 'Fila 1 — Label',          maxLen: 80 },
      { key: 'coleccion_row1_subtitle',label: 'Fila 1 — Subtítulo (opcional)', maxLen: 160 },
      { key: 'coleccion_row2_label',   label: 'Fila 2 — Label',          maxLen: 80 },
      { key: 'coleccion_row2_subtitle',label: 'Fila 2 — Subtítulo (opcional)', maxLen: 160 },
    ],
  },
  {
    key: 'videos',
    title: 'Videos',
    desc: 'Sección "Lo que dicen ellos".',
    fields: [
      { key: 'videos_eyebrow',     label: 'Eyebrow',                  maxLen: 80 },
      { key: 'videos_title',       label: 'Título (parte normal)',     maxLen: 120 },
      { key: 'videos_title_em',    label: 'Título (parte en cursiva)', maxLen: 80 },
      { key: 'videos_subtitle',    label: 'Subtítulo (opcional)',      maxLen: 160 },
      { key: 'videos_description', label: 'Descripción (opcional)',    maxLen: 400, isTextarea: true },
    ],
  },
  {
    key: 'testimonios',
    title: 'Testimonios',
    desc: 'Encabezado de la sección de reseñas.',
    fields: [
      { key: 'testimonios_eyebrow', label: 'Eyebrow', maxLen: 80 },
      { key: 'testimonios_title',   label: 'Título',  maxLen: 200 },
    ],
  },
  {
    key: 'cta',
    title: '¿Cuál es tu momento? (CTA final)',
    desc: 'Sección final con las 5 filas de perfumes.',
    fields: [
      { key: 'cta_eyebrow',     label: 'Eyebrow',     maxLen: 80 },
      { key: 'cta_title',       label: 'Título',       maxLen: 160 },
      { key: 'cta_description', label: 'Descripción',  maxLen: 400, isTextarea: true },
    ],
  },
];

const ALL_KEYS = SECTIONS.flatMap((s) => s.fields.map((f) => f.key));

export default function AdminTienda() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const row = await getTiendaSettingsAdmin();
      const r = row || {};
      const f = {};
      for (const k of ALL_KEYS) f[k] = r[k] ?? '';
      setForm(f);
    } catch (e) {
      setError(e.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {};
      for (const k of ALL_KEYS) payload[k] = (form[k] || '').trim() || null;
      await updateTiendaSettings(payload);
      setSavedAt(new Date());
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="font-heading text-3xl tracking-widest mb-1">Tienda</h1>
          <p className="text-white/50 text-sm">Editá los textos de las secciones de /tienda.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="text-xs tracking-widest uppercase border border-white/20 rounded px-4 py-2 text-white/70 hover:text-white hover:border-white/40 transition flex-shrink-0"
        >
          Refrescar
        </button>
      </div>

      {error && (
        <div className="border border-red-400/40 bg-red-400/10 text-red-300 text-sm rounded px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {form && (
        <form onSubmit={handleSave} className="space-y-10">
          {SECTIONS.map((sec, si) => (
            <div key={sec.key} className={`space-y-4${si > 0 ? ' border-t border-white/10 pt-8' : ''}`}>
              <div>
                <h3 className="font-heading tracking-widest text-sm text-white/70 uppercase">
                  {sec.title}
                </h3>
                {sec.desc && <p className="text-xs text-white/40 mt-1">{sec.desc}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sec.fields.map((field) => (
                  <div key={field.key} className={field.isTextarea ? 'md:col-span-2' : ''}>
                    <label className={labelClass}>{field.label}</label>
                    {field.isTextarea ? (
                      <textarea
                        className={`${inputClass} min-h-[72px] resize-y`}
                        value={form[field.key]}
                        onChange={setField(field.key)}
                        maxLength={field.maxLen}
                      />
                    ) : (
                      <input
                        className={inputClass}
                        value={form[field.key]}
                        onChange={setField(field.key)}
                        maxLength={field.maxLen}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-4 border-t border-white/10 pt-8">
            <button
              type="submit"
              disabled={saving}
              className="border border-[rgb(0,255,255)] px-6 py-2.5 text-xs tracking-widest uppercase text-white hover:bg-[rgb(0,255,255)] hover:text-black transition disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {savedAt && !saving && (
              <span className="text-xs text-emerald-400/80">
                Guardado {savedAt.toLocaleTimeString('es-AR')}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
