# Informe: origen del egress de imágenes/assets (Supabase Storage)

> Investigación de solo lectura. No se modificó ningún archivo existente del proyecto.
> Fecha: 2026-07-22. Proyecto Supabase: `tpyzgrcqregtzmuirfny`, bucket `solution-products`.

---

## 1. Origen de las imágenes

Todas las imágenes/videos de producto salen **directo del bucket público de Supabase Storage**, sin capa intermedia propia.

- Cliente construye URLs con un helper simple que concatena el path a una base fija:

  `client/src/lib/mediaUrl.js`
  ```js
  const SUPABASE_STORAGE_BASE = import.meta.env.VITE_SUPABASE_STORAGE_BASE;
  export function mediaUrl(path) {
    return `${SUPABASE_STORAGE_BASE}/${path}`;
  }
  ```

- Esa env var apunta al endpoint público de Storage (`client/.env`, `client/.env.production`):
  ```
  VITE_SUPABASE_STORAGE_BASE=https://tpyzgrcqregtzmuirfny.supabase.co/storage/v1/object/public/solution-products
  ```

- Además hay **URLs hardcodeadas** al mismo dominio (no pasan por `mediaUrl()`), en varias secciones del Home y en el catálogo:
  - `client/src/components/home/CtaColeccionSection.jsx:73`
  - `client/src/components/home/ElProcesoSection.jsx:107`
  - `client/src/components/home/DelReventaSection.jsx:123`
  - `client/src/components/home/ElResultadoSection.jsx:101`
  - `client/src/components/home/WholesaleSection.jsx:191`
  - `client/src/pages/Tienda.jsx:79` (`VIDEO_BASE`, usado para los 4 videos de reseñas + posters)
  - `client/src/components/home/_unused/HeroSection.jsx:5` (componente no usado actualmente)

  Ejemplo:
  ```js
  src="https://tpyzgrcqregtzmuirfny.supabase.co/storage/v1/object/public/solution-products/Solution_edit/large/dsc03564.webp"
  ```

- En el server, `server/routes/admin.js:819` genera URLs públicas explícitamente:
  ```js
  const { data: pub } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(storagePath);
  ```
  No se usa `createSignedUrl` en ningún lado — todo el bucket de producto es público.

**Dominio único desde el que se sirven todas las imágenes y videos**: `tpyzgrcqregtzmuirfny.supabase.co` (Supabase Storage). No hay ningún otro dominio de imágenes en el código.

---

## 2. ¿Hay CDN adelante?

🔴 **No.** El navegador pega directo contra `supabase.co`, sin Cloudflare, sin CDN propio, sin proxy.

- `client/vercel.json` solo define `Cache-Control` para los assets propios del build de Vite (`/assets/(.*)` → `max-age=31536000, immutable`), que es contenido servido desde el dominio de Vercel (JS/CSS del bundle), **no** las imágenes de producto — esas nunca tocan Vercel, van directo a Supabase.
- No hay ninguna variable de entorno ni referencia en el código a Cloudflare, Fastly, Bunny, imgix, ni a un dominio propio tipo `cdn.solution...`.
- Conclusión: cada visitante (y cada bot/crawler que sí ejecute JS, cada preview de link, etc.) genera una petición nueva contra el Storage de Supabase — no hay ninguna capa de caché de borde absorbiendo tráfico repetido antes de pegarle a origin.

---

## 3. ¿Originales o transformadas?

- No se encontró **ningún** uso del endpoint de transformación on-the-fly de Supabase (`/storage/v1/render/image/...`) ni parámetros `?width=`, `?height=`, `?quality=`, `?resize=`, `?format=` en ninguna URL del código.
- En su lugar existe un pipeline **offline** (no on-the-fly) que pre-genera 3 variantes estáticas por imagen antes de subirlas:

  `scripts/optimize-product-images.js`
  ```js
  const SIZES = {
      thumb:  { width: 700,  height: 900,  quality: 82 },
      medium: { width: 1200, height: 1600, quality: 84 },
      large:  { width: 1800, height: 2400, quality: 86 },
  };
  ...
  await sharp(inputFile)
      .rotate()
      .resize(config.width, config.height, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: config.quality })
      .toFile(outPath);
  ```
  Luego `scripts/upload-product-images.js` sube esos `.webp` ya generados al bucket (`Solution_edit/{thumb,medium,large}/archivo.webp`).

- 🔴 Varias secciones del Home usan explícitamente la variante **`large`** (1800×2400 @ q86) para imágenes decorativas/ilustrativas (`ElProcesoSection.jsx:107`, `DelReventaSection.jsx:123`), no solo para la vista de producto en detalle donde tendría sentido esa resolución.

- 🔴 **Camino paralelo sin optimizar**: las imágenes/videos subidos desde el panel admin (`server/routes/admin.js`, ver punto 4) **no pasan por este pipeline de `sharp`**. Se suben tal cual las sube el admin (JPEG/PNG/WEBP, hasta 5 MB por imagen, 50 MB por video), sin resize ni recompresión del lado servidor.

---

## 4. Subida de imágenes (panel admin)

Archivo: `server/routes/admin.js`

```js
const PRODUCTS_BUCKET = 'solution-products';
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_PRODUCT_VIDEO_BYTES = 50 * 1024 * 1024;  // 50 MB

const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PRODUCT_IMAGE_BYTES },
});
```

Tres puntos de subida (imagen de producto, video de producto, imagen de combo), todos con el mismo patrón — ejemplo línea 466-471:

```js
const { error: upErr } = await supabase.storage
  .from(PRODUCTS_BUCKET)
  .upload(storagePath, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false,
  });
```

- 🔴 **`cacheControl` nunca se especifica**, ni acá ni en `scripts/upload-product-images.js` (que tampoco lo setea). Al omitirlo, el SDK de Supabase Storage aplica el default de `"3600"` segundos (1 hora) de `Cache-Control` a **todos** los objetos del bucket, sean del pipeline optimizado o subidos manualmente desde el admin.
- No se comprime ni redimensiona nada del lado servidor ni del lado cliente antes de subir: no hay `sharp`, `browser-image-compression`, `canvas`, ni ninguna lib de compresión en `client/package.json` / `server/package.json` (solo existe `sharp-cli` como devDependency en el `package.json` raíz, usado manualmente para el script offline, no integrado al flujo de subida del admin).
- El input de archivo del admin (`client/src/components/admin/AdminProductEditor.jsx:290,332`) acepta `image/jpeg,image/png,image/webp` sin ningún procesamiento previo en el navegador — lo que el admin selecciona (hasta 5 MB) es exactamente lo que se sube y luego se sirve a cada visitante.

---

## 5. Formatos y peso

- Pipeline offline (`scripts/optimize-product-images.js` → `upload-product-images.js`): siempre produce y sube **WEBP**, en 3 resoluciones (thumb/medium/large).
- Camino admin (`admin.js`): acepta y sube **JPEG, PNG o WEBP tal cual**, sin normalizar a un formato más liviano ni límite de resolución — solo límite de peso (5 MB imagen / 50 MB video).
- Videos de reseñas (`Tienda.jsx` `VIDEO_BASE`) son `.mp4` servidos también desde el mismo bucket público de Storage — el egress de video puede pesar más que el de imágenes dependiendo de cuántas reproducciones haya (aunque con `preload="none"`, ver punto 6).
- Assets locales del repo (`client/src/assets/`): solo 4 archivos (`react.svg`, `world-cup.png`, `bandera-argentina.svg`, `world-cup.svg`) — peso irrelevante frente al catálogo de producto, que vive enteramente en Supabase Storage, no en el repo.

---

## 6. Renderizado en el front

- Se usa `loading="lazy"` de forma consistente donde se revisó: cards de catálogo (`Tienda.jsx:338`), poster de reseña (`Tienda.jsx:546`), galería de producto (`Producto.jsx:477`, `Producto.jsx:526`).
- 🔴 **No existe ningún `srcSet`/`sizes` en todo el codebase** (búsqueda sin resultados). A pesar de que el pipeline offline genera 3 tamaños (thumb/medium/large), el front **no elige dinámicamente** cuál servir según viewport — cada componente tiene hardcodeado un tamaño fijo (ej. `large` en secciones decorativas del Home que se ven chicas en mobile). Es decir: se genera la infraestructura para responsive images pero no se aprovecha en el `<img>` — se manda la misma imagen (a veces la más pesada) a todos los dispositivos.
- Videos de reseña usan `preload="none"` (comentado explícitamente en el código: "el video carga sólo al darle play") con poster estático — esto está bien optimizado.
- Galería de producto (`Producto.jsx`) usa `<video preload="metadata">` para clips del producto — descarga metadata pero no el archivo completo hasta reproducir.

---

## 7. Catálogo

- El catálogo es **estático y chico**: 5 productos hardcodeados en `SLUG_META` (`Tienda.jsx:17-58`) — no hay paginado ni infinite scroll porque no hace falta, es una tienda de 5 SKUs.
- Los datos vienen de `getPublicProducts()` (`client/src/services/products.js`) — una sola carga inicial, no polling.
- No se detectó re-fetch de imágenes en cada render/estado — las URLs de imagen se derivan de `perfume.images` ya cargado, no se recalculan ni re-piden en cada cambio de estado.

---

## 8. Exposición a bots

- `client/index.html` es un shell SPA puro: `<div id="root"></div>` + `<script type="module" src="/src/main.jsx">`. No hay SSR ni prerender.
- No se encontró `robots.txt` ni `sitemap.xml` en `client/public/` (solo contiene `favicon.png`, `apple-touch-icon.png`, `vite.svg`, `sounds/`).
- Como es SPA sin SSR, un bot que no ejecute JS (la mayoría de crawlers simples) no dispara las cargas de imagen — reduce la probabilidad de que el egress venga de bots "tontos". Sin embargo, el sitio sí tiene Google Tag (`gtag.js`) y Meta Pixel (`fbq`) activos en `index.html`, lo que indica tráfico pago/orgánico real cuyo navegador sí ejecuta JS y sí descarga todas las imágenes — ese es tráfico "legítimo" consumiendo egress, no bots.
- Sin sitemap ni robots.txt tampoco hay señal de que buscadores estén crawleando masivamente imágenes vía Google Images, etc.

---

## Resumen

| Punto | Respuesta en una línea | ¿Infla egress? |
|---|---|---|
| Origen de imágenes | Bucket público `solution-products` en Supabase Storage (`tpyzgrcqregtzmuirfny.supabase.co`), sin dominio intermedio | — |
| ¿Hay CDN? | No, el navegador pega directo a Supabase Storage; Vercel solo cachea su propio bundle JS/CSS | 🔴 |
| ¿Originales o transformadas? | Pipeline offline con `sharp` genera 3 tamaños webp (thumb/medium/large) para el catálogo masivo, pero el camino de subida desde el admin panel sube el archivo tal cual (hasta 5 MB), sin resize | 🔴 (camino admin) |
| Cache-Control al subir | Nunca se setea `cacheControl` en ningún `.upload()` (ni pipeline ni admin) → default de Supabase = 1 hora | 🔴 |
| Formatos | Pipeline offline: WEBP optimizado. Camino admin: JPEG/PNG/WEBP crudo sin normalizar | 🔴 (camino admin) |
| `srcset`/responsive | No existe en ningún componente — se sirve el mismo tamaño (a veces `large`) a todos los viewports, incluso mobile | 🔴 |
| `loading="lazy"` | Sí, usado consistentemente en catálogo y galería de producto | ✅ (mitigante) |
| Catálogo | 5 productos estáticos, sin paginado/infinite scroll, sin re-fetch por estado | ✅ (no es la causa) |
| Bots | SPA pura sin SSR/sitemap/robots.txt → bots simples no bajan imágenes; el tráfico real (con Pixel/GTAG) sí | neutro |
