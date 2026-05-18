import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../../hooks/useReveal';

const VSL_VIDEO_URL = 'https://tpyzgrcqregtzmuirfny.supabase.co/storage/v1/object/public/solution-products/video/video-home-solution.mp4';

export default function HeroSection() {
  const [videoReady, setVideoReady] = useState(false);

  const metaRef     = useReveal();
  const headlineRef = useReveal();
  const videoRef    = useReveal();
  const ctasRef     = useReveal();

  return (
    <section
      style={{
        paddingTop: 'var(--sol-section-py)',
        paddingBottom: 'var(--sol-section-py)',
        paddingLeft: 'var(--sol-section-px)',
        paddingRight: 'var(--sol-section-px)',
        borderBottom: '0.5px solid var(--sol-line)',
        background: 'var(--sol-bg)',
        position: 'relative',
      }}
    >
      <div className="sol-container">
        {/* sol-hero-inner: on desktop becomes a 2-col grid via CSS named areas */}
        <div className="sol-hero-inner">

          {/* ── Meta row — 1st mobile, grid-area: meta desktop ── */}
          <div
            ref={metaRef}
            className="sol-hero-meta sol-reveal"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '36px',
            }}
          >
            <div
              className="font-jakarta"
              style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}
            >
              N°/01{' '}
              <span
                style={{
                  display: 'inline-block',
                  width: '4px', height: '4px',
                  background: 'var(--sol-green)',
                  borderRadius: '50%',
                  margin: '0 8px 2px',
                  verticalAlign: 'middle',
                }}
                aria-hidden
              />
              New Era
            </div>
          </div>

          {/* ── Headline — 2nd mobile, grid-area: head desktop ── */}
          <h1
            ref={headlineRef}
            className="font-jost sol-hero-head sol-reveal"
            style={{
              fontWeight: 400,
              fontSize: 'clamp(34px, 9vw, 64px)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: 'var(--sol-ink)',
              marginBottom: '28px',
            }}
          >
            No competimos<br />
            con los perfumes<br />
            de nicho.
            <em
              style={{
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'var(--sol-ink-dim)',
                display: 'block',
                marginTop: '4px',
              }}
            >
              <span style={{ color: 'var(--sol-magenta)', fontStyle: 'normal' }}>— </span>
              Competimos con<br />la costumbre de<br />no usar perfume.
            </em>
          </h1>

          {/* ── Video VSL — 3rd mobile, grid-area: video desktop ── */}
          <div
            ref={videoRef}
            className="sol-video sol-hero-video sol-reveal"
            style={{
              width: '100%',
              aspectRatio: '16/9',
              background: '#050505',
              border: '0.5px solid var(--sol-line)',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '28px',
            }}
          >
            {/* Skeleton loader — visible until onCanPlay fires */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                opacity: videoReady ? 0 : 1,
                transition: 'opacity 0.5s ease',
                pointerEvents: 'none',
              }}
            >
              <div
                className="animate-spin"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.08)',
                  borderTopColor: 'var(--sol-green)',
                }}
              />
            </div>

            <video
              src={VSL_VIDEO_URL}
              autoPlay
              muted
              playsInline
              loop
              controls
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: videoReady ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
              onCanPlay={() => setVideoReady(true)}
              onLoadedData={() => setVideoReady(true)}
            />
          </div>

          {/* ── CTAs — 4th mobile, grid-area: ctas desktop ── */}
          <div
            ref={ctasRef}
            className="sol-hero-ctas sol-reveal"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <Link
              to="/tienda"
              className="sol-btn font-jakarta"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                padding: '18px 22px',
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: 'var(--sol-ink)',
                color: 'var(--sol-bg)',
                transition: 'background 0.3s var(--sol-ease), color 0.3s var(--sol-ease)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sol-green)'; e.currentTarget.style.color = 'var(--sol-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--sol-ink)'; e.currentTarget.style.color = 'var(--sol-bg)'; }}
            >
              <span>Elegir mi fragancia</span>
              <span className="sol-arrow">→</span>
            </Link>

            <Link
              to="/tienda"
              className="sol-btn font-jakarta"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                padding: '18px 22px',
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: 'transparent',
                color: 'var(--sol-ink-dim)',
                border: '0.5px solid var(--sol-line-mid)',
                transition: 'color 0.3s var(--sol-ease), border-color 0.3s var(--sol-ease)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; e.currentTarget.style.borderColor = 'var(--sol-line-str)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; e.currentTarget.style.borderColor = 'var(--sol-line-mid)'; }}
            >
              <span>Ver las 5 fragancias</span>
              <span className="sol-arrow">↓</span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
