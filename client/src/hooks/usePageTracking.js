import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/analytics";

export function usePageTracking() {
    const loc = useLocation();
    const lastTracked = useRef("");

    useEffect(() => {
        const path = loc.pathname;
        if (path === lastTracked.current) return;
        lastTracked.current = path;
        trackPageView(path);
    }, [loc.pathname]);
}
