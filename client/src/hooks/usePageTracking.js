// src/hooks/usePageTracking.js
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/analytics";

export function usePageTracking() {
    const loc = useLocation();

    useEffect(() => {
        const path = loc.pathname + loc.search;
        trackPageView(path);
    }, [loc.pathname, loc.search]);
}