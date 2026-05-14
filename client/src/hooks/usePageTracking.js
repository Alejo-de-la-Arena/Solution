import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/analytics";
import { trackPageView as fbPageView, captureAttributionData } from "../lib/metaPixel";

export function usePageTracking() {
    const loc = useLocation();
    const lastTracked = useRef("");

    useEffect(() => {
        const path = loc.pathname;
        if (path === lastTracked.current) return;
        lastTracked.current = path;
        trackPageView(path);
        fbPageView();
        // Captura fbclid de la URL y _fbc/_fbp de las cookies en cada carga de ruta.
        // Esto garantiza que si el usuario llega desde un anuncio Meta con fbclid,
        // los datos de atribución queden respaldados en localStorage antes de cualquier
        // redirect a pasarelas externas (MP, Nave).
        captureAttributionData();
    }, [loc.pathname]);
}
