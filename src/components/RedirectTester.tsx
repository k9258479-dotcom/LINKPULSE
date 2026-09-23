import React, { useState } from 'react';
import { Play, ExternalLink, ArrowRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { Lang } from '../i18n';

interface Props {
  origin: string;
  lang: Lang;
}

export const RedirectTester: React.FC<Props> = ({ origin, lang }) => {
  const [slug, setSlug] = useState('link1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    targetUrl?: string;
    status?: number;
    timeMs?: number;
    error?: string;
  } | null>(null);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slug.trim().replace(/^\//, '');
    if (!clean) return;

    setLoading(true);
    setResult(null);
    const start = performance.now();

    try {
      const res = await fetch(`/api/links/${encodeURIComponent(clean)}`);
      const elapsed = Math.round(performance.now() - start);

      if (res.ok) {
        const data = await res.json();
        setResult({
          targetUrl: data.link.targetUrl,
          status: data.link.redirectType || 302,
          timeMs: elapsed
        });
      } else {
        setResult({
          error: lang === 'tl'
            ? `Hindi nahanap ang slug "${clean}" (404 Not Found)`
            : `Slug "${clean}" not found (404 Not Found)`,
          timeMs: elapsed
        });
      }
    } catch (err: any) {
      setResult({
        error: err.message || 'Request failed',
        timeMs: 0
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            {lang === 'tl' ? 'Live Redirect Simulator / Tester' : 'Live Redirect Simulator / Tester'}
          </h3>
          <p className="text-xs text-slate-400">
            {lang === 'tl'
              ? 'Subukan agad kung paano nagre-redirect ang short link sa Target URL'
              : 'Test how any static short link redirects to its target destination in real time'}
          </p>
        </div>
      </div>

      <form onSubmit={handleTest} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 flex items-center bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden focus-within:border-cyan-500">
          <span className="px-3 text-xs text-slate-400 font-mono bg-slate-800 border-r border-slate-700 py-2.5 select-none">
            {origin}/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="link1"
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2.5 px-5 rounded-xl transition text-xs shadow-md shadow-cyan-950/40 disabled:opacity-50 shrink-0"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {lang === 'tl' ? 'Subukan ang Link' : 'Simulate Redirect'}
        </button>

        <a
          href={`${origin}/${slug.trim().replace(/^\//, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium py-2.5 px-4 rounded-xl transition text-xs shrink-0"
          title="Buksan ang tunay na redirect sa bagong window"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {lang === 'tl' ? 'Buksan sa Browser' : 'Open in Browser'}
        </a>
      </form>

      {/* Simulator Response */}
      {result && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-xs">
          {result.targetUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300">
              <div className="flex items-center gap-2 overflow-hidden">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="font-semibold text-white">HTTP {result.status} Found</span>
                  <span className="mx-2 text-slate-500">→</span>
                  <span className="font-mono text-cyan-300 underline">{result.targetUrl}</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                Latency: {result.timeMs}ms
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{result.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
