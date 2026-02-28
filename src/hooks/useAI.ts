import { useState, useCallback, useRef, useEffect } from 'react';
import { callGemini, GeminiResponse } from '@/lib/api';

export function useAI() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<GeminiResponse['_debug'] | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [isSlow, setIsSlow] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const timerRef = useRef<any>(null);

    const request = useCallback(async (action: string, body: any, debug: boolean = true) => {
        // Prevent double submit
        if (loading) return;

        const t0 = performance.now();
        setLoading(true);
        setError(null);
        setIsSlow(false);

        // Setup AbortController
        abortControllerRef.current = new AbortController();

        // Slow request timer (10s)
        timerRef.current = setTimeout(() => {
            setIsSlow(true);
        }, 10000);

        try {
            const result = await callGemini(action, body, abortControllerRef.current.signal, debug);

            if (result._debug && result._debug.clientTimings) {
                result._debug.clientTimings.t0 = Math.round(t0);
                setDebugInfo(result._debug);
            }

            return result.data;
        } catch (err: any) {
            if (err.name === 'AbortError') {
                process.env.NODE_ENV === 'development' && console.log('Request cancelled');
            } else {
                const msg = err.message || 'Bir hata oluştu';
                setError(msg);
                throw err;
            }
        } finally {
            setLoading(false);
            clearTimeout(timerRef.current);
        }
    }, [loading]);

    const cancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setLoading(false);
            setIsSlow(false);
            clearTimeout(timerRef.current);
        }
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    return {
        request,
        cancel,
        loading,
        error,
        debugInfo,
        showDebug,
        setShowDebug,
        isSlow
    };
}
