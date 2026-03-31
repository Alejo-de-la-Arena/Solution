import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scroll al inicio en cada cambio de ruta, sin pisar anclas (#id) del header.
 * Doble rAF + retry corto para convivir con AnimatePresence / paint posterior al cambio de ruta.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    const hashId =
      hash && hash.length > 1 ? decodeURIComponent(hash.replace(/^#/, "")) : "";

    let cancelled = false;
    let timeoutId = 0;
    let raf1 = 0;
    let raf2 = 0;

    const tryScrollToHash = () => {
      if (cancelled || !hashId) return false;
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
        return true;
      }
      return false;
    };

    const scrollWindowTop = () => {
      if (cancelled) return;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    const run = () => {
      if (cancelled) return;
      if (hashId) {
        if (tryScrollToHash()) return;
        timeoutId = window.setTimeout(() => {
          if (cancelled) return;
          if (!tryScrollToHash()) scrollWindowTop();
        }, 160);
        return;
      }
      scrollWindowTop();
    };

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(run);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [pathname, search, hash]);

  return null;
}
