import React from 'react';
import {
  Link2,
  Plus,
  Rocket,
  Code,
  Database,
  Globe,
  RefreshCw,
  Zap,
  ShieldCheck
} from 'lucide-react';
import type { Lang } from '../i18n';
import { translations } from '../i18n';

interface Props {
  lang: Lang;
  onToggleLang: () => void;
  onOpenCreate: () => void;
  onOpenDeploy: () => void;
  onOpenApi: () => void;
  onOpenDb: () => void;
  onOpenMetaGuide: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<Props> = ({
  lang,
  onToggleLang,
  onOpenCreate,
  onOpenDeploy,
  onOpenApi,
  onOpenDb,
  onOpenMetaGuide,
  onRefresh,
  isRefreshing
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                Link<span className="text-cyan-400">Pulse</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Node.js Express Server
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850 transition border border-transparent hover:border-slate-800"
            title={lang === 'tl' ? "I-refresh ang data" : "Refresh data"}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Meta Review Tracker Guide */}
          <button
            onClick={onOpenMetaGuide}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-blue-300 hover:text-white bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 transition"
            title="Meta Graph API & Review Tracker Guide"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Meta Review Guide</span>
          </button>

          {/* Database & Export Button */}
          <button
            onClick={onOpenDb}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>{t.databaseExport}</span>
          </button>

          {/* API Endpoints */}
          <button
            onClick={onOpenApi}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.apiDocs}</span>
          </button>

          {/* Free Deployment Guide Button */}
          <button
            onClick={onOpenDeploy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition shadow-xs"
          >
            <Rocket className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{t.deploymentGuide}</span>
            <span className="md:hidden">Deploy Free</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title="Switch Language (Tagalog / English)"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold">{lang === 'tl' ? '🇵🇭 TL' : '🇺🇸 EN'}</span>
          </button>

          {/* Create New Link (Primary CTA) */}
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-3.5 sm:px-4 rounded-xl transition shadow-md shadow-blue-900/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.newLink}</span>
            <span className="sm:hidden">{lang === 'tl' ? 'Bago' : 'New'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
