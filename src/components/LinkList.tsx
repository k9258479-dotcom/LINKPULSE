import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Edit3,
  QrCode,
  BarChart2,
  Trash2,
  Power,
  Search,
  Filter,
  ArrowUpDown,
  Tag,
  Clock,
  Sparkles,
  Link as LinkIcon,
  ShieldCheck,
  Bot,
  CheckCircle2,
  XCircle,
  Sliders
} from 'lucide-react';
import type { LinkItem, UpdateLinkInput } from '../types';
import type { Lang } from '../i18n';
import { translations } from '../i18n';

interface Props {
  links: LinkItem[];
  origin: string;
  lang: Lang;
  onOpenEditTarget: (link: LinkItem) => void;
  onOpenQr: (link: LinkItem) => void;
  onOpenAnalytics: (link: LinkItem) => void;
  onOpenMetaTracker: (link: LinkItem) => void;
  onToggleActive: (link: LinkItem) => void;
  onDeleteLink: (slug: string) => void;
}

export const LinkList: React.FC<Props> = ({
  links,
  origin,
  lang,
  onOpenEditTarget,
  onOpenQr,
  onOpenAnalytics,
  onOpenMetaTracker,
  onToggleActive,
  onDeleteLink
}) => {
  const t = translations[lang];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [sortBy, setSortBy] = useState<'clicks' | 'recent'>('recent');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCopy = (slug: string) => {
    const fullUrl = `${origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Filter and sort links
  const filteredLinks = links
    .filter((l) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.slug.toLowerCase().includes(q) ||
        l.targetUrl.toLowerCase().includes(q) ||
        (l.title && l.title.toLowerCase().includes(q)) ||
        l.tags.some((t) => t.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && l.isActive) ||
        (statusFilter === 'paused' && !l.isActive);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'clicks') {
        return (b.clickCount || 0) - (a.clickCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-4">
      {/* Controls: Search, Filter, Sort */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-slate-900 border border-slate-800 focus:border-slate-700 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'active' ? 'bg-slate-800 text-emerald-300 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterActive}
            </button>
            <button
              onClick={() => setStatusFilter('paused')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'paused' ? 'bg-slate-800 text-amber-300 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterPaused}
            </button>
          </div>

          {/* Sort */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                sortBy === 'recent' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.sortByRecent}
            </button>
            <button
              onClick={() => setSortBy('clicks')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                sortBy === 'clicks' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.sortByClicks}
            </button>
          </div>
        </div>
      </div>

      {/* Link Cards / Table */}
      {filteredLinks.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center">
          <LinkIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">{t.noLinksFound}</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? lang === 'tl'
                ? 'Subukang magpalit ng search term o i-clear ang filter.'
                : 'Try changing your search term or clearing filters.'
              : lang === 'tl'
                ? 'Mag-click sa "+ Gumawa ng Bagong Link" upang magdagdag ng permanent static route.'
                : 'Click "+ Create New Link" to add a permanent static route.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLinks.map((link) => {
            const shortUrl = `${origin}/${link.slug}`;
            const isCopied = copiedSlug === link.slug;

            return (
              <div
                key={link.id}
                className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 transition hover:border-slate-700 shadow-sm relative overflow-hidden ${
                  link.isActive ? 'border-slate-800' : 'border-slate-800/50 bg-slate-900/40 opacity-80'
                }`}
              >
                {/* Top row: Title, status badge, clicks */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {link.title || link.slug}
                    </span>

                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        link.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${link.isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {link.isActive ? (lang === 'tl' ? 'Aktibo' : 'Active') : (lang === 'tl' ? 'Naka-Pause' : 'Paused')}
                    </span>

                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      HTTP {link.redirectType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onOpenAnalytics(link)}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
                      title={lang === 'tl' ? "Tingnan ang Click Logs at Analytics" : "View Click Logs and Analytics"}
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold text-white">{link.clickCount}</span>
                      <span className="text-slate-400 text-[11px]">clicks</span>
                    </button>

                    <button
                      onClick={() => onToggleActive(link)}
                      className={`p-1.5 rounded-lg border transition ${
                        link.isActive
                          ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                          : 'text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                      title={link.isActive ? t.pause : t.activate}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Link Box */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                  {/* Left: Static Permanent Short Link */}
                  <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                        <span>{t.staticLink} (Permanent)</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-cyan-400 text-sm font-bold truncate">
                          {shortUrl}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopy(link.slug)}
                            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition text-xs flex items-center gap-1"
                            title={t.copyLink}
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[11px] font-medium">{isCopied ? t.copied : 'Copy'}</span>
                          </button>
                          <a
                            href={shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                            title={t.testRedirect}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Dynamic Target URL */}
                  <div className="lg:col-span-7 bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                          {t.targetUrl} (Dynamic)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {link.lastClickedAt
                            ? `${lang === 'tl' ? 'Huling na-click:' : 'Last clicked:'} ${new Date(link.lastClickedAt).toLocaleDateString()}`
                            : lang === 'tl'
                              ? 'Wala pang clicks'
                              : 'No clicks yet'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-slate-200 truncate" title={link.targetUrl}>
                          {link.targetUrl}
                        </span>
                        <button
                          onClick={() => onOpenEditTarget(link)}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs shadow-blue-900/40 shrink-0"
                          title={lang === 'tl' ? "Baguhin ang Target URL nang hindi nababago ang short link" : "Change Target URL without altering the short link"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{t.editTarget}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta Ads Review Tracker Status Strip */}
                <div className="mt-3 p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Bot Inspection Status */}
                    <div className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">Bot Inspection:</span>
                      {link.metaTracking?.botVisited ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold text-[11px] border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          {lang === 'tl' ? 'Nabisita na ng Meta Bot' : 'Bot Reviewed'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-medium text-[11px] border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          {lang === 'tl' ? 'Hindi pa nabibisita' : 'Pending Inspection'}
                        </span>
                      )}
                    </div>

                    <span className="text-slate-700 hidden sm:inline">•</span>

                    {/* Meta Campaign Status */}
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">Meta Campaign:</span>
                      {link.metaTracking?.effectiveStatus === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          ACTIVE (Approved)
                        </span>
                      ) : link.metaTracking?.effectiveStatus === 'PENDING_REVIEW' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold text-[11px] border border-amber-500/20 animate-pulse">
                          <Clock className="w-3 h-3" />
                          PENDING_REVIEW
                        </span>
                      ) : link.metaTracking?.effectiveStatus === 'DISAPPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-bold text-[11px] border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          DISAPPROVED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                          {link.metaTracking?.effectiveStatus || (lang === 'tl' ? 'Hindi Naka-set' : 'Not Configured')}
                        </span>
                      )}
                    </div>

                    {/* Auto-redirect rule active badge */}
                    {link.metaTracking?.autoSwitchOnActive && (
                      <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <Sliders className="w-3 h-3" />
                        <span>Auto-Switch (Link A / Link B)</span>
                      </span>
                    )}
                  </div>

                  {/* Button to open Meta Tracker config modal */}
                  <button
                    onClick={() => onOpenMetaTracker(link)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition font-medium text-[11px] border border-slate-700"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Meta Tracker</span>
                  </button>
                </div>

                {/* Footer of Card: Tags & Extra actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {link.tags && link.tags.length > 0 ? (
                      link.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-500" />
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500">{lang === 'tl' ? 'Walang tags' : 'No tags'}</span>
                    )}

                    {link.forwardQueryParams && (
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-800/30">
                        Query Forwarding On
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenQr(link)}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition text-[11px]"
                    >
                      <QrCode className="w-3 h-3 text-slate-400" />
                      {t.qrCode}
                    </button>

                    <span className="text-slate-700">•</span>

                    <button
                      onClick={() => {
                        if (window.confirm(`${t.deleteConfirm} (/${link.slug})`)) {
                          onDeleteLink(link.slug);
                        }
                      }}
                      className="flex items-center gap-1 text-slate-500 hover:text-rose-400 transition text-[11px]"
                    >
                      <Trash2 className="w-3 h-3" />
                      {t.delete}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
