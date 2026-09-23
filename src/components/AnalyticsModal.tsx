import React, { useEffect, useState } from 'react';
import { X, BarChart3, Clock, Smartphone, Monitor, Globe, RefreshCw, RotateCcw, Bot, ShieldCheck } from 'lucide-react';
import type { LinkItem, ClickLog } from '../types';
import type { Lang } from '../i18n';

interface Props {
  link: LinkItem | null;
  origin: string;
  lang: Lang;
  onClose: () => void;
  onResetStats: (slug: string) => Promise<void>;
}

export const AnalyticsModal: React.FC<Props> = ({ link, origin, lang, onClose, onResetStats }) => {
  const [logs, setLogs] = useState<ClickLog[]>([]);
  const [loading, setLoading] = useState(true);

  if (!link) return null;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/links/${link.slug}`);
      const data = await res.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [link.slug]);

  // Aggregate stats from logs
  const mobileCount = logs.filter((l) => l.device === 'mobile').length;
  const desktopCount = logs.filter((l) => l.device === 'desktop').length;
  const otherCount = logs.length - mobileCount - desktopCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Click Analytics: /{link.slug}</h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-md">
                Target: {link.targetUrl}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 pr-1 py-4 space-y-4 text-sm">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-center">
              <div className="text-[11px] uppercase font-semibold text-slate-400">
                {lang === 'tl' ? 'Kabuuang Hits' : 'Total Hits'}
              </div>
              <div className="text-2xl font-black text-white mt-1">{link.clickCount}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-center">
              <div className="text-[11px] uppercase font-semibold text-slate-400">Mobile Visitors</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{mobileCount}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-center">
              <div className="text-[11px] uppercase font-semibold text-slate-400">Desktop Visitors</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{desktopCount}</div>
            </div>
          </div>

          {/* Recent Click Logs Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === 'tl' ? 'Kamakailang Clicks (Recent Click Feed)' : 'Recent Click Feed'}
              </h4>
              <button
                onClick={fetchLogs}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-xs text-slate-500">
                {lang === 'tl' ? 'Naglo-load ng logs...' : 'Loading click logs...'}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-800/30 rounded-xl border border-slate-800">
                {lang === 'tl'
                  ? 'Wala pang naitalang clicks para sa link na ito. I-click ang static link upang subukan!'
                  : 'No clicks recorded yet for this link. Click or test the static link to see real-time logs!'}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/80 text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">{lang === 'tl' ? 'Oras (Time)' : 'Time'}</th>
                      <th className="py-2.5 px-3">Referrer</th>
                      <th className="py-2.5 px-3">Device / Browser</th>
                      <th className="py-2.5 px-3">Masked IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40 font-mono">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className={`transition ${
                          log.isMetaCrawler
                            ? 'bg-blue-950/30 hover:bg-blue-900/40 border-l-2 border-l-cyan-400'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-300 font-sans text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <span className="block text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          <span className="flex items-center gap-1.5 font-sans">
                            <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[120px]">{log.referer || 'Direct'}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-sans">
                          {log.isMetaCrawler ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                                <Bot className="w-3 h-3" />
                                Meta Crawler (facebookexternalhit)
                              </span>
                              {log.crawlerNote && (
                                <div className="text-[10px] font-mono text-emerald-400">
                                  {log.crawlerNote}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              {log.device === 'mobile' ? (
                                <Smartphone className="w-3 h-3 text-cyan-400" />
                              ) : (
                                <Monitor className="w-3 h-3 text-slate-400" />
                              )}
                              <span className="capitalize">{log.browser}</span> ({log.os})
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{log.ipMasked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              const confirmMsg = lang === 'tl'
                ? 'Sigurado ka bang nais mong i-reset ang clicks ng link na ito?'
                : 'Are you sure you want to reset click statistics for this link?';
              if (window.confirm(confirmMsg)) {
                onResetStats(link.slug);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {lang === 'tl' ? 'I-reset ang Clicks' : 'Reset Click Stats'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition text-xs font-medium"
          >
            {lang === 'tl' ? 'Isara' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
