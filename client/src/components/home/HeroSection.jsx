import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { perfumes, ACCENT_COLORS } from '../../data/perfumes';

const EASE = [0.22, 1, 0.36, 1];
const AUTOPLAY_MS = 7000;

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [cycleId, setCycleId] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef(null);
  const autoplayRef = useRef(null);

  const slides = useMemo(
    () =>
      perfumes.slice(0, 5).map((p, index) => ({
        id: p.id,
        name: p.name,
        tagline:
          p.shortDescription ||
          p.descriptionParagraphs?.[0] ||
          'Fragancias masculinas auténticas, diseñadas desde cero.',
        accent: p.accent_color || ACCENT_COLORS[index],
        image: p.image,
        usage: p.tipo_de_uso || p.usage,
        feeling: p.family || p.feeling,
      })),
    []
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      if (autoplayRef.current) {
        window.clearTimeout(autoplayRef.current);
        autoplayRef.current = null;
      }
      return;
    }

    autoplayRef.current = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
      setCycleId((prev) => prev + 1);
    }, AUTOPLAY_MS);

    return () => {
      if (autoplayRef.current) {
        window.clearTimeout(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [reducedMotion, slides.length, cycleId]);

  const goToIndex = (index) => {
    if (autoplayRef.current) {
      window.clearTimeout(autoplayRef.current);
      autoplayRef.current = null;
    }

    setActiveIndex(index);
    setCycleId((prev) => prev + 1);
  };

  const handleNext = () => {
    if (autoplayRef.current) {
      window.clearTimeout(autoplayRef.current);
      autoplayRef.current = null;
    }

    setActiveIndex((prev) => (prev + 1) % slides.length);
    setCycleId((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (autoplayRef.current) {
      window.clearTimeout(autoplayRef.current);
      autoplayRef.current = null;
    }

    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setCycleId((prev) => prev + 1);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartX.current = null;
  };

  const currentSlide = slides[activeIndex];

  const textItemVariants = reducedMotion
    ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }
    : {
      initial: { opacity: 0, filter: 'blur(10px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(8px)' },
    };

  const textContainerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.055,
        delayChildren: 0.03,
      },
    },
    exit: {},
  };

  const detailsBlock = (
    <>
      <motion.div
        variants={textItemVariants}
        transition={{ duration: 0.52, ease: EASE }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 text-xs sm:text-sm text-white/65"
      >
        <div className="space-y-1.5">
          <p
            className="tracking-[0.22em] uppercase text-[0.68rem]"
            style={{ color: `${currentSlide.accent}99` }}
          >
            Perfil
          </p>
          <p className="leading-relaxed text-white/80">{currentSlide.feeling}</p>
        </div>

        <div className="space-y-1.5">
          <p
            className="tracking-[0.22em] uppercase text-[0.68rem]"
            style={{ color: `${currentSlide.accent}99` }}
          >
            Uso ideal
          </p>
          <p className="leading-relaxed text-white/80">{currentSlide.usage}</p>
        </div>


      </motion.div>

      <motion.div
        variants={textItemVariants}
        transition={{ duration: 0.55, ease: EASE }}
        className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
      >
        <Link
          to={`/producto/${currentSlide.id}`}
          className="group relative inline-flex w-full sm:w-auto items-center justify-center overflow-hidden rounded-full border px-8 py-3.5 text-xs sm:text-sm tracking-[0.26em] uppercase transition-all duration-300 will-change-transform"
          style={{
            borderColor: currentSlide.accent,
            boxShadow: `0 18px 45px rgba(0,0,0,0.65), 0 0 32px ${currentSlide.accent}22`,
          }}
        >
          <span
            className="absolute inset-0 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
            style={{
              background: `linear-gradient(90deg, ${currentSlide.accent}, ${currentSlide.accent}DD)`,
            }}
          />
          <span
            className="absolute inset-0 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40"
            style={{ backgroundColor: currentSlide.accent }}
          />
          <span className="relative z-10 inline-flex items-center gap-3 text-white transition-colors duration-300 group-hover:text-black">
            Ver perfume
            <span
              className="inline-block text-lg transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            >
              →
            </span>
          </span>
        </Link>

        <Link
          to="/tienda"
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.02] px-7 py-3 text-[0.7rem] sm:text-xs tracking-[0.26em] uppercase text-white/80 transition-all duration-300 will-change-transform hover:border-white/60 hover:bg-white/[0.06] hover:text-white"
        >
          Explorar colección completa
        </Link>
      </motion.div>
    </>
  );

  return (
    <section
      className="relative min-h-screen lg:min-h-screen flex items-stretch bg-black text-white overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full">
        <div className="absolute inset-0">
          <AnimatePresence initial={false}>
            {slides.map((slide, index) =>
              index === activeIndex ? (
                <motion.div
                  key={slide.id}
                  className="absolute inset-0"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(6px)' }}
                  animate={reducedMotion ? { opacity: 1 } : { opacity: 1, filter: 'blur(0px)' }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(6px)' }}
                  transition={{ duration: reducedMotion ? 0.4 : 0.9, ease: EASE }}
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <>
                      <motion.div
                        className="pointer-events-none absolute inset-[-24%] mix-blend-screen blur-[110px]"
                        style={{
                          background: `
                            radial-gradient(circle at 74% 30%, ${slide.accent}85 0%, transparent 20%),
                            radial-gradient(circle at 82% 42%, ${slide.accent}55 0%, transparent 30%),
                            radial-gradient(circle at 70% 58%, ${slide.accent}40 0%, transparent 40%)
                          `,
                        }}
                        animate={
                          reducedMotion
                            ? {}
                            : {
                              x: ['-3%', '3%', '-2%'],
                              y: ['-2%', '2%', '-1%'],
                              scale: [0.96, 1.08, 1],
                              opacity: [0.72, 1, 0.8],
                            }
                        }
                        transition={
                          reducedMotion
                            ? {}
                            : {
                              duration: 11,
                              ease: 'easeInOut',
                              repeat: Infinity,
                            }
                        }
                      />

                      <motion.div
                        className="pointer-events-none absolute inset-[-30%] mix-blend-screen blur-[150px]"
                        style={{
                          background: `
                            radial-gradient(circle at 80% 50%, ${slide.accent}45 0%, transparent 26%),
                            radial-gradient(circle at 62% 52%, ${slide.accent}24 0%, transparent 42%)
                          `,
                        }}
                        animate={
                          reducedMotion
                            ? {}
                            : {
                              x: ['2%', '-2%', '1%'],
                              y: ['1%', '-2%', '2%'],
                              scale: [1, 1.12, 0.98],
                              opacity: [0.45, 0.72, 0.5],
                            }
                        }
                        transition={
                          reducedMotion
                            ? {}
                            : {
                              duration: 14,
                              ease: 'easeInOut',
                              repeat: Infinity,
                            }
                        }
                      />

                      <motion.div
                        className="pointer-events-none absolute inset-0 mix-blend-screen blur-[80px]"
                        style={{
                          background: `
                            radial-gradient(circle at 80% 46%, ${slide.accent}60 0%, transparent 24%),
                            radial-gradient(circle at 76% 52%, ${slide.accent}35 0%, transparent 34%)
                          `,
                        }}
                        animate={
                          reducedMotion
                            ? {}
                            : {
                              x: ['0%', '1.5%', '-1%'],
                              y: ['0%', '-1%', '1.5%'],
                              scale: [0.98, 1.06, 1],
                              opacity: [0.55, 0.9, 0.62],
                            }
                        }
                        transition={
                          reducedMotion
                            ? {}
                            : {
                              duration: 8.5,
                              ease: 'easeInOut',
                              repeat: Infinity,
                            }
                        }
                      />
                    </>

                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(circle at 10% 0%, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.96) 36%, rgba(0,0,0,1) 72%)',
                      }}
                    />

                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at 82% 36%, ${slide.accent}30 0%, transparent 42%)`,
                      }}
                    />

                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0.18) 100%)',
                      }}
                    />
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>
        <div className="container mx-auto relative z-10 flex flex-col lg:flex-row items-stretch min-h-screen px-4 sm:px-8 lg:px-16 pt-28 pb-20 lg:py-0">
          <div className="flex-1 flex items-start lg:items-center py-0 lg:py-24 order-1">
            <div className="max-w-xl lg:max-w-2xl w-full">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentSlide.id}
                  variants={textContainerVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.55, ease: EASE }}
                  className="space-y-6 sm:space-y-7"
                >
                  <motion.div
                    variants={textItemVariants}
                    transition={{ duration: 0.42, ease: EASE }}
                    className="flex items-center gap-3 text-[0.7rem] sm:text-xs tracking-[0.3em] uppercase text-white/60"
                  >
                    <span className="inline-block h-px w-10 bg-white/30" />
                    <span>Colección New Era</span>
                  </motion.div>

                  <motion.div
                    variants={textItemVariants}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="space-y-4"
                  >
                    <div className="space-y-4">

                      <div
                        className="inline-flex w-fit rounded-full border px-4 py-1.5 text-[0.7rem] tracking-[0.22em] uppercase text-white/80 backdrop-blur-md"
                        style={{
                          borderColor: `${currentSlide.accent}66`,
                          background:
                            'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.6) 50%)',
                        }}
                      >
                        {currentSlide.name}
                      </div>
                    </div>

                    <p className="max-w-[34rem] text-base sm:text-lg text-white/80 leading-relaxed">
                      {currentSlide.tagline}
                    </p>
                  </motion.div>

                  <div className="hidden lg:block space-y-7">
                    {detailsBlock}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="relative order-2 mt-8 lg:mt-0 lg:w-[44%] flex items-center justify-center">
            <div className="pointer-events-none absolute inset-0">
              <motion.div
                className="absolute inset-y-[-18%] right-[-12%] w-[100vw] lg:w-[60vw] h-[130%] blur-[90px] lg:blur-[140px]"
                style={{
                  background:
                    'radial-gradient(circle at 35% 50%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.08) 22%, transparent 62%)',
                }}
                animate={
                  reducedMotion
                    ? { opacity: 0.52 }
                    : {
                      opacity: [0.42, 0.58, 0.46],
                      x: ['0%', '-3%', '2%', '0%'],
                      y: ['0%', '2%', '-2%', '0%'],
                    }
                }
                transition={
                  reducedMotion
                    ? { duration: 1.2, ease: EASE }
                    : {
                      duration: 22,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    }
                }
              />

              <motion.div
                className="absolute inset-y-[-22%] right-[-8%] w-[110vw] lg:w-[60vw] h-[140%] blur-[110px] lg:blur-[170px]"
                style={{
                  background: `radial-gradient(circle at 48% 46%, ${currentSlide.accent}55 0%, ${currentSlide.accent}22 28%, transparent 68%)`,
                }}
                animate={
                  reducedMotion
                    ? { opacity: 0.34, scale: 1 }
                    : {
                      opacity: [0.24, 0.4, 0.28],
                      scale: [0.98, 1.05, 1],
                      x: ['0%', '2%', '-2%', '0%'],
                      y: ['0%', '-2%', '1%', '0%'],
                    }
                }
                transition={
                  reducedMotion
                    ? { duration: 1.2, ease: EASE }
                    : {
                      duration: 26,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    }
                }
              />

              <motion.div
                className="absolute inset-y-[-16%] left-[-8%] right-[-8%] w-auto h-[132%] lg:left-auto lg:right-0 lg:w-[60vw] blur-[100px] lg:blur-[150px]"
                style={{
                  background:
                    'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 24%, transparent 64%)',
                }}
                animate={
                  reducedMotion
                    ? { opacity: 0.28 }
                    : {
                      opacity: [0.2, 0.32, 0.24],
                      y: ['0%', '-2%', '2%', '0%'],
                      x: ['0%', '1%', '-1%', '0%'],
                    }
                }
                transition={
                  reducedMotion
                    ? { duration: 1.2, ease: EASE }
                    : {
                      duration: 24,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    }
                }
              />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {slides.map((slide, index) =>
                index === activeIndex ? (
                  <motion.div
                    key={`${slide.id}-visual`}
                    className="relative w-full"
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(10px)' }}
                    animate={reducedMotion ? { opacity: 1 } : { opacity: 1, filter: 'blur(0px)' }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: reducedMotion ? 0.4 : 0.62, ease: EASE }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-[38px] lg:rounded-[44px] blur-[58px]"
                      style={{ backgroundColor: slide.accent }}
                      animate={
                        reducedMotion
                          ? { opacity: 0.2, scale: 0.96 }
                          : {
                            opacity: [0.18, 0.26, 0.18],
                            scale: [0.94, 1.02, 0.96],
                          }
                      }
                      transition={
                        reducedMotion
                          ? { duration: 0.6, ease: EASE }
                          : {
                            duration: 6.6,
                            ease: 'easeInOut',
                            repeat: Infinity,
                          }
                      }
                    />

                    <div className="relative z-10 rounded-[38px] lg:rounded-[44px] bg-black p-[6px] lg:p-[7px] shadow-[0_36px_100px_rgba(0,0,0,0.85)]">
                      <div className="relative aspect-[4/5] rounded-[30px] lg:rounded-[36px] bg-[#050505] overflow-hidden">
                        <div className="absolute inset-0">
                          <img
                            src={slide.image}
                            alt={slide.name}
                            className="h-full w-full object-cover object-center"
                            loading="lazy"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,rgba(0,0,0,0.9)_68%)]" />
                          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.06)_32%,rgba(0,0,0,0.9)_100%)]" />
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.06)_0%,transparent_34%)]" />
                        </div>

                        <div className="absolute left-4 top-4 rounded-full border border-white/12 bg-black/45 px-4 py-2 backdrop-blur-md">
                          <p className="text-[0.65rem] sm:text-[0.7rem] tracking-[0.28em] uppercase text-white/80">
                            {activeIndex + 1}/5
                          </p>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                          <div className="space-y-2 max-w-[70%]">
                            <p className="text-xs tracking-[0.26em] uppercase text-white/60">
                              Fragrancia activa
                            </p>
                            <p className="text-lg sm:text-xl font-heading tracking-[0.18em] uppercase font-semibold">
                              {slide.name}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 lg:hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrev();
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-full border border-white/25 bg-black/40 text-xs text-white/70 transition-all duration-200 hover:bg-white/10 hover:border-white/60 hover:text-white"
                              aria-label="Slide anterior"
                            >
                              ←
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNext();
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-full border border-white/25 bg-black/40 text-xs text-white/70 transition-all duration-200 hover:bg-white/10 hover:border-white/60 hover:text-white"
                              aria-label="Slide siguiente"
                            >
                              →
                            </button>
                          </div>
                        </div>

                        <motion.div
                          className="pointer-events-none absolute inset-y-[-20%] left-[-18%] w-[18%] rotate-[18deg] bg-white/14 blur-xl"
                          animate={
                            reducedMotion
                              ? { opacity: 0 }
                              : {
                                x: ['-10%', '220%'],
                                opacity: [0, 1, 0],
                              }
                          }
                          transition={
                            reducedMotion
                              ? { duration: 0.4 }
                              : {
                                duration: 8,
                                ease: 'easeInOut',
                                repeat: Infinity,
                                repeatDelay: 2,
                              }
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 lg:hidden space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        {slides.map((dotSlide, dotIndex) => (
                          <button
                            key={dotSlide.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToIndex(dotIndex);
                            }}
                            className="relative h-[12px] w-[12px] rounded-full border border-white/20 bg-black/50 backdrop-blur-md overflow-hidden transition-transform duration-200"
                            aria-label={`Ir al perfume ${dotIndex + 1}`}
                          >
                            <motion.span
                              className="absolute inset-[2px] rounded-full"
                              style={{ backgroundColor: slides[dotIndex].accent }}
                              animate={{
                                opacity: activeIndex === dotIndex ? 1 : 0,
                                scale: activeIndex === dotIndex ? 1 : 0.4,
                              }}
                              transition={{ duration: 0.35, ease: EASE }}
                            />
                          </button>
                        ))}
                      </div>

                      {!reducedMotion && (
                        <div className="w-full h-[2px] bg-white/10 overflow-hidden rounded-full">
                          <motion.div
                            key={cycleId}
                            className="h-full"
                            style={{
                              background: `linear-gradient(90deg, ${currentSlide.accent}, rgba(255,255,255,0.8))`,
                            }}
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
          </div>

          <div className="order-3 lg:hidden mt-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${currentSlide.id}-mobile-details`}
                variants={textContainerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.45, ease: EASE }}
                className="space-y-7"
              >
                {detailsBlock}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-5 z-20 hidden lg:flex flex-col items-center gap-4 px-6">
          <div className="flex items-center justify-end w-full max-w-4xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/25 bg-black/40 text-xs text-white/70 transition-all duration-200 hover:bg-white/10 hover:border-white/60 hover:text-white hover:-translate-y-[1px]"
                aria-label="Slide anterior"
              >
                ←
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/25 bg-black/40 text-xs text-white/70 transition-all duration-200 hover:bg-white/10 hover:border-white/60 hover:text-white hover:-translate-y-[1px]"
                aria-label="Slide siguiente"
              >
                →
              </button>
            </div>
          </div>

          <div className="flex justify-center w-full max-w-4xl">
            <div className="hidden sm:flex gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToIndex(index);
                  }}
                  className="relative h-[14px] w-[14px] rounded-full border border-white/20 bg-black/50 backdrop-blur-md overflow-hidden transition-transform duration-200 hover:scale-110"
                >
                  <motion.span
                    className="absolute inset-[3px] rounded-full"
                    style={{ backgroundColor: slides[index].accent }}
                    animate={{
                      opacity: activeIndex === index ? 1 : 0,
                      scale: activeIndex === index ? 1 : 0.4,
                    }}
                    transition={{ duration: 0.35, ease: EASE }}
                  />
                </button>
              ))}
            </div>
          </div>

          {!reducedMotion && (
            <div className="w-full max-w-4xl h-[2px] bg-white/10 overflow-hidden rounded-full">
              <motion.div
                key={cycleId}
                className="h-full"
                style={{
                  background: `linear-gradient(90deg, ${currentSlide.accent}, rgba(255,255,255,0.8))`,
                }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}