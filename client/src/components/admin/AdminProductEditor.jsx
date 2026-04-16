import { useEffect, useRef, useState } from 'react';
import { mediaUrl } from '../../lib/mediaUrl';
import {
  updateAdminProduct,
  uploadAdminProductImage,
  deleteAdminProductImage,
  reorderAdminProductImages,
  getAdminProduct,
} from '../../services/adminProducts';

const inputClass =
  'w-full bg-[#0b0b0b] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30';

const labelClass = 'text-[0.7rem] tracking-[0.24em] uppercase text-white/50 mb-1 block';

function splitImagesByRole(images) {
  const store = { default: null, hover: null };
  const gallery = [];
  for (const img of images || []) {
    if (img.role === 'store_default') store.default = img;
    else if (img.role === 'store_hover') store.hover = img;
    else if (img.role === 'gallery') gallery.push(img);
  }
  gallery.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return { store, gallery };
}

export default function AdminProductEditor({ product, onProductUpdated }) {
  const [form, setForm] = useState(() => ({
    name: product.name || '',
    tagline: product.tagline || '',
    short_description: product.short_description || '',
    price_retail: product.price_retail ?? '',
    price_wholesale: product.price_wholesale ?? '',
    is_active: !!product.is_active,
  }));
  const [images, setImages] = useState(product.product_images || []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm({
      name: product.name || '',
      tagline: product.tagline || '',
      short_description: product.short_description || '',
      price_retail: product.price_retail ?? '',
      price_wholesale: product.price_wholesale ?? '',
      is_active: !!product.is_active,
    });
    setImages(product.product_images || []);
  }, [product.id]);

  const { store, gallery } = splitImagesByRole(images);

  async function refreshFromServer() {
    const fresh = await getAdminProduct(product.id);
    setImages(fresh.product_images || []);
    if (onProductUpdated) onProductUpdated(fresh);
  }

  const handleChange = (field) => (e) => {
    const val = field === 'is_active' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        tagline: form.tagline,
        short_description: form.short_description,
        price_retail: form.price_retail === '' ? 0 : Number(form.price_retail),
        price_wholesale: form.price_wholesale === '' ? 0 : Number(form.price_wholesale),
        is_active: form.is_active,
      };
      const updated = await updateAdminProduct(product.id, payload);
      setImages(updated.product_images || []);
      setSavedAt(new Date());
      if (onProductUpdated) onProductUpdated(updated);
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* === Datos básicos === */}
      <form onSubmit={handleSave} className="space-y-5">
        <h3 className="font-heading tracking-widest text-sm text-white/70 uppercase">Datos básicos</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre</label>
            <input className={inputClass} value={form.name} onChange={handleChange('name')} maxLength={120} />
          </div>
          <div>
            <label className={labelClass}>Tagline</label>
            <input className={inputClass} value={form.tagline} onChange={handleChange('tagline')} maxLength={200} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Descripción corta</label>
            <textarea
              className={`${inputClass} min-h-[96px] resize-y`}
              value={form.short_description}
              onChange={handleChange('short_description')}
              maxLength={2000}
            />
          </div>
          <div>
            <label className={labelClass}>Precio retail (ARS)</label>
            <input
              className={inputClass}
              type="number"
              min="0"
              step="1"
              value={form.price_retail}
              onChange={handleChange('price_retail')}
            />
          </div>
          <div>
            <label className={labelClass}>Precio mayorista (ARS)</label>
            <input
              className={inputClass}
              type="number"
              min="0"
              step="1"
              value={form.price_wholesale}
              onChange={handleChange('price_wholesale')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={handleChange('is_active')}
                className="w-4 h-4 accent-[rgb(0,255,255)]"
              />
              <span className="text-sm text-white/80">
                Producto activo <span className="text-white/50">(aparece en /tienda)</span>
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="border border-red-400/40 bg-red-400/10 text-red-300 text-sm rounded px-3 py-2">{error}</div>
        )}

        <div className="flex items-center gap-4">
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

      {/* === Imágenes de tienda === */}
      <section className="space-y-4 border-t border-white/10 pt-8">
        <h3 className="font-heading tracking-widest text-sm text-white/70 uppercase">Imágenes de tienda</h3>
        <p className="text-xs text-white/50">
          Se muestran en /tienda. Imagen principal (fija) y alternativa (visible al rotar).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StoreSlot
            productId={product.id}
            role="store_default"
            image={store.default}
            label="Imagen principal"
            onChanged={refreshFromServer}
          />
          <StoreSlot
            productId={product.id}
            role="store_hover"
            image={store.hover}
            label="Imagen alternativa"
            onChanged={refreshFromServer}
          />
        </div>
      </section>

      {/* === Galería === */}
      <section className="space-y-4 border-t border-white/10 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading tracking-widest text-sm text-white/70 uppercase">Galería del detalle</h3>
            <p className="text-xs text-white/50 mt-1">
              Carrusel en /producto/{product.slug}. Arrastrá o usá las flechas para reordenar.
            </p>
          </div>
          <GalleryAddButton productId={product.id} onAdded={refreshFromServer} />
        </div>

        <GalleryGrid
          productId={product.id}
          images={gallery}
          onChanged={refreshFromServer}
        />
      </section>
    </div>
  );
}

function StoreSlot({ productId, role, image, label, onChanged }) {
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
      await uploadAdminProductImage(productId, file, role);
      await onChanged();
    } catch (err) {
      setErr(err.message || 'Error al subir');
    } finally {
      setUploading(false);
    }
  }

  const src = image?.storage_path ? mediaUrl(image.storage_path) : null;

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

function GalleryAddButton({ productId, onAdded }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await uploadAdminProductImage(productId, file, 'gallery');
      await onAdded();
    } catch (err) {
      alert(err.message || 'Error al subir');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="text-xs tracking-widest uppercase border border-[rgb(0,255,255)] rounded px-4 py-2 text-white hover:bg-[rgb(0,255,255)] hover:text-black transition disabled:opacity-50"
      >
        {uploading ? 'Subiendo…' : '+ Agregar imagen'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}

function GalleryGrid({ productId, images, onChanged }) {
  const [busyId, setBusyId] = useState(null);
  const [reordering, setReordering] = useState(false);

  async function move(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const next = images.slice();
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const items = next.map((img, i) => ({ id: img.id, sort_order: i }));
    setReordering(true);
    try {
      await reorderAdminProductImages(productId, items);
      await onChanged();
    } catch (err) {
      alert(err.message || 'Error al reordenar');
    } finally {
      setReordering(false);
    }
  }

  async function remove(image) {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    setBusyId(image.id);
    try {
      await deleteAdminProductImage(productId, image.id);
      await onChanged();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    } finally {
      setBusyId(null);
    }
  }

  if (images.length === 0) {
    return <p className="text-white/40 text-sm">Todavía no hay imágenes de galería.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {images.map((img, index) => (
        <div key={img.id} className="border border-white/10 rounded-lg overflow-hidden bg-[#080808]">
          <div className="aspect-[4/5] bg-[#050505]">
            <img src={mediaUrl(img.storage_path)} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="p-2 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={reordering || index === 0}
                className="w-7 h-7 text-xs border border-white/20 rounded text-white/70 hover:text-white disabled:opacity-30"
                aria-label="Mover arriba"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={reordering || index === images.length - 1}
                className="w-7 h-7 text-xs border border-white/20 rounded text-white/70 hover:text-white disabled:opacity-30"
                aria-label="Mover abajo"
              >
                →
              </button>
            </div>
            <button
              type="button"
              onClick={() => remove(img)}
              disabled={busyId === img.id}
              className="text-[0.65rem] tracking-widest uppercase text-red-300 hover:text-red-200 transition disabled:opacity-50"
            >
              {busyId === img.id ? '…' : 'Eliminar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
