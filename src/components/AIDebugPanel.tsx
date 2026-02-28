import { GeminiResponse } from '@/lib/api';

interface AIDebugPanelProps {
    debugInfo: GeminiResponse['_debug'] | null;
    onClose: () => void;
}

export function AIDebugPanel({ debugInfo, onClose }: AIDebugPanelProps) {
    if (!debugInfo) return null;

    const { timings, clientTimings, requestId } = debugInfo;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-black/90 text-green-400 p-4 rounded-xl border border-green-500/30 font-mono text-xs shadow-2xl max-w-xs animate-in slide-in-from-right-4 transition-all overflow-hidden">
            <div className="flex justify-between items-center mb-2 border-b border-green-500/20 pb-1">
                <span className="font-bold">AI TELEMETRY</span>
                <button onClick={onClose} className="hover:text-white">✕</button>
            </div>

            <div className="space-y-1 mb-3 opacity-80">
                <p className="truncate">ID: {requestId}</p>
            </div>

            <div className="space-y-2">
                <section>
                    <h4 className="border-b border-green-500/10 mb-1 text-[10px] text-green-500/60 uppercase">Server Timings (ms)</h4>
                    <div className="grid grid-cols-2 gap-1">
                        <span>RateLimit:</span> <span className="text-right">{timings.rateLimit}</span>
                        <span>Validate:</span> <span className="text-right">{timings.validation}</span>
                        <span>Prompt:</span> <span className="text-right">{timings.promptBuild}</span>
                        <span>Gemini:</span> <span className="text-right font-bold">{timings.geminiApi}</span>
                        <span>Post:</span> <span className="text-right">{timings.postProcess}</span>
                        <span className="border-t border-green-500/20 pt-1 font-bold">Server Total:</span>
                        <span className="text-right border-t border-green-500/20 pt-1 font-bold">{timings.totalServer}</span>
                    </div>
                </section>

                {clientTimings && (
                    <section>
                        <h4 className="border-b border-green-500/10 mb-1 text-[10px] text-green-500/60 uppercase">Client Timings (ms)</h4>
                        <div className="grid grid-cols-2 gap-1">
                            <span>Fetch Delay:</span> <span className="text-right">{Math.max(0, clientTimings.t1 - clientTimings.t0)}</span>
                            <span>Network:</span> <span className="text-right">{clientTimings.t2 - clientTimings.t1}</span>
                            <span>Parse:</span> <span className="text-right">{clientTimings.t3 - clientTimings.t2}</span>
                            <span className="border-t border-green-500/20 pt-1 font-bold text-white">Full E2E:</span>
                            <span className="text-right border-t border-green-500/20 pt-1 font-bold text-white">{clientTimings.t3 - clientTimings.t0}</span>
                        </div>
                    </section>
                )}
            </div>

            <div className="mt-4 pt-2 border-t border-green-500/20 text-[9px] text-center opacity-50">
                DEBUG MODE ACTIVE
            </div>
        </div>
    );
}
