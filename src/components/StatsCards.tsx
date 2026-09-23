import React from 'react';
import { Link2, MousePointerClick, TrendingUp, Smartphone, ArrowUpRight, Bot } from 'lucide-react';
import type { OverviewStats } from '../types';
import type { Lang } from '../i18n';
import { translations } from '../i18n';

interface Props {
  stats: OverviewStats | null;
  lang: Lang;
}

export const StatsCards: React.FC<Props> = ({ stats, lang }) => {
  const t = translations[lang];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* Total Links */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t.totalLinks}
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Link2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-white">
            {stats?.totalLinks ?? 0}
          </span>
          <span className="text-xs text-emerald-400 font-medium">
            {stats?.activeLinks ?? 0} {lang === 'tl' ? 'aktibo' : 'active'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {lang === 'tl' ? 'Permanent static routes' : 'Permanent static routes'}
        </div>
      </div>

      {/* Total Clicks */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t.totalClicks}
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <MousePointerClick className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-white">
            {stats?.totalClicks ?? 0}
          </span>
          <span className="text-xs text-purple-400 font-medium flex items-center">
            <ArrowUpRight className="w-3 h-3" />
            Hits
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {lang === 'tl' ? 'Lahat ng na-redirect' : 'All-time redirects'}
        </div>
      </div>

      {/* 24h Clicks */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t.last24hClicks}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-emerald-400">
            {stats?.clicksLast24h ?? 0}
          </span>
          <span className="text-xs text-slate-400">
            {lang === 'tl' ? 'ngayong araw' : 'today'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {stats?.clicksLast7d ?? 0} {lang === 'tl' ? 'sa 7 araw' : 'last 7 days'}
        </div>
      </div>

      {/* Meta Crawler Review Inspections */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-blue-700/50 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {lang === 'tl' ? 'Meta Review Bots' : 'Meta Crawler Hits'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-cyan-400">
            {stats?.metaBotClicks ?? 0}
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-semibold">
            Crawler
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          facebookexternalhit visits
        </div>
      </div>

      {/* Mobile vs Desktop breakdown */}
      <div className="col-span-2 lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {lang === 'tl' ? 'Device Traffic' : 'Device Traffic'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div>
            <span className="text-xs text-slate-400">Mobile</span>
            <div className="text-base font-bold text-cyan-400">
              {stats?.deviceStats?.mobile ?? 0}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div>
            <span className="text-xs text-slate-400">Desktop</span>
            <div className="text-base font-bold text-slate-200">
              {stats?.deviceStats?.desktop ?? 0}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {lang === 'tl' ? 'Awtomatikong nakikilala' : 'Auto device detection'}
        </div>
      </div>
    </div>
  );
};
