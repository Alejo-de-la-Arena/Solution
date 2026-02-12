# SOLUTION - Frontend UI

Frontend UI para el re-branding de SOLUTION, implementado con React + Vite + TailwindCSS + motion.dev.

## 🚀 Cómo correr el proyecto

```bash
cd client
npm install
npm run dev
```

El proyecto estará disponible en `http://localhost:5173` (o el puerto que Vite asigne).

## 📁 Estructura del proyecto

```
client/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.jsx          # Barra de navegación superior
│   │   └── home/
│   │       ├── HeroSection.jsx      # Sección Hero (primera)
│   │       ├── MasQueUnPerfumeSection.jsx  # Sección "Más que un perfume" (segunda)
│   │       ├── NuestrosValoresSection.jsx  # Sección "Nuestros valores" (tercera)
│   │       └── UnaNuevaEraSection.jsx     # Sección "Una nueva era" (cuarta)
│   ├── pages/
│   │   └── Home.jsx                # Página principal que renderiza las 4 secciones
│   ├── App.jsx                     # Componente raíz
│   └── index.css                   # Estilos globales y Tailwind directives
├── tailwind.config.js              # Configuración de Tailwind con tokens de diseño
└── package.json
```

## 🎨 Tokens de diseño (colores y tipografías)

### Colores

Los colores están definidos en `tailwind.config.js` bajo `theme.extend.colors`:

- **`bg-dark`**: `#050505` - Fondo principal negro
- **`bg-dark-alt`**: `#0A0A0A` - Fondo alternativo (más oscuro)
- **`text-primary`**: `#FFFFFF` - Texto principal blanco
- **`text-secondary`**: `#C7C7C7` - Texto secundario gris claro
- **`text-muted`**: `#7A7A7A` - Texto muy sutil (números de valores)
- **`accent-cyan`**: `#00D0C5` - Color de acento cian/turquesa
- **`accent-cyan-alt`**: `#00C4B5` - Variante del acento

**Para cambiar colores**: Edita los valores hex en `tailwind.config.js` → `theme.extend.colors`.

### Tipografías

Las fuentes están definidas en `tailwind.config.js` y cargadas desde Google Fonts en `src/index.css`:

- **`font-heading`**: `Montserrat` (para títulos y headings)
- **`font-body`**: `Inter` (para párrafos y texto de cuerpo)

**Para cambiar fuentes**:
1. Actualiza las URLs de Google Fonts en `src/index.css` (línea 1).
2. Actualiza los nombres de las fuentes en `tailwind.config.js` → `theme.extend.fontFamily`.

## 🖼️ Imágenes placeholder (Unsplash)

Las imágenes se cargan desde Unsplash usando URLs directas. Para cambiarlas:

### HeroSection (`src/components/home/HeroSection.jsx`)
- **Línea ~20**: Background image del hero
- URL actual: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80&fit=crop`
- Busca imágenes similares en Unsplash con términos como: "man suit elegant", "businessman portrait"

### UnaNuevaEraSection (`src/components/home/UnaNuevaEraSection.jsx`)
- **Línea ~85**: Imagen de botellas de perfume
- URL actual: `https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&q=80&fit=crop`
- Busca imágenes similares con términos como: "perfume bottles", "luxury perfume"

**Para cambiar imágenes**: Reemplaza las URLs en los componentes correspondientes. Puedes usar cualquier URL de Unsplash o cualquier otra imagen pública.

## ✨ Animaciones (motion.dev)

Las animaciones están implementadas usando `motion.dev` (paquete `motion`). Todas las animaciones:

- **Dirección**: Siempre de arriba hacia abajo (top → down)
  - Entrada: `y: -16 → 0` y `opacity: 0 → 1`
  - Salida: `y: 0 → 16` y `opacity: 1 → 0`
- **Duración**: 0.5s - 0.6s con easing suave `[0.25, 0.1, 0.25, 1]`
- **Stagger**: Aplicado en listas (ej: los 3 valores) con delays incrementales de 0.1s
- **Accesibilidad**: Respeta `prefers-reduced-motion` - si está activo, solo anima opacidad o desactiva movimiento

### Cómo funcionan las animaciones

1. **HeroSection**: Animación al cargar la página (sin scroll trigger).
2. **Otras secciones**: Usan `IntersectionObserver` para detectar cuando entran en el viewport y activar la animación.
3. **Navbar**: Animación sutil al cargar (desde arriba con fade-in).

### Para ajustar animaciones

- **Duración**: Cambia `duration` en las props `transition` de cada componente.
- **Delay**: Ajusta los valores `delay` en los `transition` de cada elemento.
- **Distancia**: Modifica los valores `y` iniciales/finales (ej: `-16` → `-24` para más movimiento).

## 📱 Responsive

El diseño es mobile-first con breakpoints de Tailwind:

- **Mobile**: `< 768px` (default)
- **Tablet/Desktop**: `md:` (≥ 768px) y `lg:` (≥ 1024px)

Los tamaños de fuente, espaciados y grillas se ajustan automáticamente según el breakpoint.

## 🛠️ Comandos disponibles

```bash
npm run dev      # Inicia servidor de desarrollo
npm run build    # Construye para producción
npm run preview  # Preview de la build de producción
npm run lint     # Ejecuta ESLint
```

## 📝 Notas importantes

- **UI ONLY**: Este proyecto NO incluye backend, Supabase, autenticación real, endpoints, Mercado Pago, Redux ni lógica de negocio. Solo UI + animaciones.
- **Placeholders**: Si falta algún asset o contenido, se usan placeholders mínimos con TODOs comentados.
- **DOM semántico**: Se usan elementos HTML semánticos (`h1`, `h2`, `p`, `section`, etc.) y atributos `alt` en imágenes.
- **Performance**: Las animaciones son livianas y no sobrecargan el scroll.

## 🎯 Próximos pasos (si aplica)

- Reemplazar URLs de Unsplash con imágenes finales del diseño.
- Ajustar tokens de colores/tipografías según el diseño final.
- Agregar más secciones si el diseño lo requiere.
- Optimizar imágenes para producción (usar formatos modernos como WebP).
