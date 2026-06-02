import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getComboSettingsAdmin,
  updateComboSettings,
  uploadComboImage,
  resolveComboImage,
} from '../../services/combo';

const inputClass =
  'w-full bg-[#0b0b0b] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30';
const labelClass = 'text-[0.7rem] tracking-[0.24em] uppercase text-white/50 mb-1 block';

// Orden de slugs para editar nombre/referencia de cada opción del select.
const OPTION_SLUGS = ['red-desire', 'yellow-bloom', 'black-code', 'white-ice', 'deep-blue'];

function linesToArray(text) {
  return (text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}
function arrayToLines(arr) {
  return Array.isArray(arr) ? arr.join('\n') : '';
}

export default function AdminCombos() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const [form, setForm] = useState(null);
  const [badgesText, setBadgesText] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [options, setOptions] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const row = await getComboSettingsAdmin();
      const r = row || {};
      setForm({
        title: r.title || '',
        subtitle: r.subtitle || '',
        description: r.description || '',
        showcase_title: r.showcase_title || '',
        showcase_subtitle: r.showcase_subtitle || '',
        image_1_url: r.image_1_url || '',
        image_2_url: r.image_2_url || '',
        select_label_1: r.select_label_1 || '',
        select_label_2: r.select_label_2 || '',
        cta_text: r.cta_text || '',
        is_active: r.is_active !== false,
      });
      setBadgesText(arrayToLines(r.badges_json));
      setFeaturesText(arrayToLines(r.features_json));
      const opts = {};
      const src = r.options_json && typeof r.options_json === 'object' ? r.options_json : {};
      for (const slug of OPTION_SLUGS) {
        opts[slug] = {
          name: src[slug]?.name || '',
          reference: src[slug]?.reference || '',
        };
      }
      setOptions(opts);
    } catch (e) {
      setError(e.message || 'Error al cargar el combo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (field) => (e) => {
    const val = field === 'is_active' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const setOption = (slug, key) => (e) => {
    const val = e.target.value;
    setOptions((prev) => ({ ...prev, [slug]: { ...prev[slug], [key]: val } }));
  };

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const optionsJson = {};
      for (const slug of OPTION_SLUGS) {
        const o = options[slug] || {};
        if ((o.name || '').trim() || (o.reference || '').trim()) {
          optionsJson[slug] = { name: (o.name || '').trim(), reference: (o.reference || '').trim() };
        }
      }
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        showcase_title: form.showcase_title,
        showcase_subtitle: form.showcase_subtitle,
        image_1_url: form.image_1_url || '',
        image_2_url: form.image_2_url || '',
        select_label_1: form.select_label_1,
        select_label_2: form.select_label_2,
        cta_text: form.cta_text,
        is_active: form.is_active,
        badges_json: linesToArray(badgesText),
        features_json: linesToArray(featuresText),
        options_json: optionsJson,
      };
      await updateComboSettings(payload);
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="font-heading text-3xl tracking-widest mb-1">Combos</h1>
          <p className="text-white/50 text-sm">Editá la sección de combo de /tienda.</p>
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
          {/* === Título y beneficios === */}
          <section className="space-y-5">
            <h3 className="font-heading tracking-widest text-sm text-white/70 uppercase">
              Título y beneficios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Título principal</label>
                <input className={inputClass} value={form.title} onChange={setField('title')} maxLength={120} />
              </div>
              <div>
                <label className={labelClass}>Subtítulo (énfasis)</label>
                <input
                  className={inputClass}
                  value={form.subtitle}
                  onChange={setField('subtitle')}
                  maxLength={120}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Descripción</label>
                <textarea
                  className={`${inputClass} min-h-[80px] resize-y`}
                  value={form.description}
                  onChange={setField('description')}
                  maxLength={400}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Badges (uno por línea)</label>
                <textarea
                  className={`${inputClass} min-h-[80px] resize-y`}
                  value={badgesText}
                  onChange={(e) => setBadgesText(e.target.value)}
                  placeholder={'Perfumero de regalo\nEnvío gratis\n30% OFF'}
                />
              </div>
            </div>
          </section>

          {/* === Showcase (imágenes) === */}
          <section className="space-y-4 border-t border-white/10 pt-8">
            <h3 className="font-heading tracking-widest text-sm text-white/70 uppercase">
              Showcase
            </h3>
            <p className="text-xs text-white/50">
              Imagen 1 (principal). Imagen 2 opcional: si está vacía, el showcase queda estático sin rotación.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Eyebrow del showcase</label>
                <input
                  className={inputClass}
                  value={form.showcase_title}
                  onChange={setField('showcase_title')}
                  maxLength={80}
                />
              </div>
              <div>
                <label className={labelClass}>Badge del showcase</label>
                <input
                  className={inputClass}
                  value={form.showcase_subtitle}
                  onChange={setField('showcase_subtitle')}
                  maxLength={80}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageSlot
                label="Imagen 1"
                value={form.image_1_url}
                onUploaded={(path) => setForm((p) => ({ ...p, image_1_url: path }))}
                onClear={() => setForm((p) => ({ ...p, image_1_url: '' }))}
              />
              <ImageSlot
                label="Imagen 2 (opcional)"
                value={form.image_2_url}
                onUploaded={(path) => setForm((p) => ({ ...p, image_2_url: path }))}
                onClear={() => setForm((p) => ({ ...p, image_2_url: '' }))}
              />
            </div>
          </section>

          {/* === Selectores === */}
          <section className="space-y-4 border-t border-white/10 pt-8">
            <h3 className="font-heading tracking-widest text-sm text-white/70 uppercase">
              Selectores de fragancia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Label select 1</label>
                <input
                  className={inputClass}
                  value={form.select_label_1}
                  onChange={setField('select_label_1')}
                  maxLength={80}
                />
              </div>
              <div>
                <label className={labelClass}>Label select 2</label>
                <input
                  className={inputClass}
                  value={form.select_label_2}
                  onChange={setField('select_label_2')}
                  maxLength={80}
                />
              </div>
            </div>
            <p className="text-xs text-white/50 mt-2">
              Texto de cada opción (nombre / referencia). El value real es el id del producto.
            </p>
            <div className="space-y-3">
              {OPTION_SLUGS.map((slug) => (
                <div key={slug} className="border border-white/10 rounded-lg p-3 bg-[#080808]">
                  <div className="text-[0.65rem] tracking-[0.24em] uppercase text-white/40 mb-2">{slug}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Nombre</label>
                      <input
                        className={inputClass}
                        value={options[slug]?.name || ''}
                        onChange={setOption(slug, 'name')}
                        maxLength={60}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Referencia</label>
                      <input
                        className={inputClass}
                        value={options[slug]?.reference || ''}
                        onChange={setOption(slug, 'reference')}
                        maxLength={60}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* === Precio / CTA === */}
          <section className="space-y-4 border-t border-white/10 pt-8">
            <h3 className="font-heading tracking-widest text-sm text-white/70 uppercase">
              Features y CTA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Features (uno por línea)</label>
                <textarea
                  className={`${inputClass} min-h-[96px] resize-y`}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder={'X2 perfumes a elección\nEnvío gratis a todo el país\n2 cuotas sin interés'}
                />
              </div>
              <div>
                <label className={labelClass}>Texto del botón (CTA)</label>
                <input className={inputClass} value={form.cta_text} onChange={setField('cta_text')} maxLength={80} />
                <label className="flex items-center gap-3 cursor-pointer select-none mt-5">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={setField('is_active')}
                    className="w-4 h-4 accent-[rgb(0,255,255)]"
                  />
                  <span className="text-sm text-white/80">
                    Combo activo <span className="text-white/50">(visible en /tienda)</span>
                  </span>
                </label>
              </div>
            </div>
          </section>

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

function ImageSlot({ label, value, onUploaded, onClear }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const { path } = await uploadComboImage(file);
      onUploaded(path);
    } catch (er) {
      setErr(er.message || 'Error al subir');
    } finally {
      setUploading(false);
    }
  }

  const src = resolveComboImage(value);

  return (
    <div className="border border-white/10 rounded-lg p-3 bg-[#080808]">
      <div className="text-[0.7rem] tracking-[0.24em] uppercase text-white/60 mb-2">{label}</div>
      <div className="aspect-[4/5] rounded bg-[#050505] border border-white/10 overflow-hidden flex items-center justify-center">
        {src ? (
          <img src={src} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/30 text-xs">Sin imagen</span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-1 text-xs tracking-widest uppercase border border-white/20 rounded px-3 py-2 text-white/80 hover:text-white hover:border-white/40 transition disabled:opacity-50"
        >
          {uploading ? 'Subiendo…' : src ? 'Reemplazar' : 'Subir'}
        </button>
        {src && (
          <button
            type="button"
            onClick={onClear}
            className="text-[0.65rem] tracking-widest uppercase text-red-300 hover:text-red-200 transition px-2"
          >
            Quitar
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {err && <p className="text-red-300 text-xs mt-2">{err}</p>}
    </div>
  );
}
