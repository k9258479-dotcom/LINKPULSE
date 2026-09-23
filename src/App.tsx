import React, { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Server,
  Cloud,
  Layers
} from 'lucide-react';
import type { LinkItem, OverviewStats, CreateLinkInput, UpdateLinkInput } from './types';
import type { Lang } from './i18n';
import { translations } from './i18n';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { RedirectTester } from './components/RedirectTester';
import { LinkList } from './components/LinkList';
import { CreateLinkModal } from './components/CreateLinkModal';
import { EditTargetModal } from './components/EditTargetModal';
import { QrCodeModal } from './components/QrCodeModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import { ApiDocsModal } from './components/ApiDocsModal';
import { DatabaseToolsModal } from './components/DatabaseToolsModal';
import { MetaTrackerModal } from './components/MetaTrackerModal';
import { MetaGuideModal } from './components/MetaGuideModal';

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const t = translations[lang];

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [origin, setOrigin] = useState<string>('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isApiOpen, setIsApiOpen] = useState(false);
  const [isDbOpen, setIsDbOpen] = useState(false);

  const [editLink, setEditLink] = useState<LinkItem | null>(null);
  const [qrLink, setQrLink] = useState<LinkItem | null>(null);
  const [analyticsLink, setAnalyticsLink] = useState<LinkItem | null>(null);
  const [metaTrackerLink, setMetaTrackerLink] = useState<LinkItem | null>(null);
  const [isMetaGuideOpen, setIsMetaGuideOpen] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Fetch links and stats
  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [linksRes, statsRes] = await Promise.all([
        fetch('/api/links'),
        fetch('/api/stats/overview')
      ]);

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        if (linksData.success && linksData.links) {
          setLinks(linksData.links);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch links or stats:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create Link
  const handleCreateLink = async (input: CreateLinkInput): Promise<boolean> => {
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create link');
      }

      showToast(t.createSuccess, 'success');
      await fetchData();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  // Update Target URL anytime
  const handleUpdateLink = async (slug: string, updates: UpdateLinkInput): Promise<boolean> => {
    try {
      const res = await fetch(`/api/links/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update link');
      }

      showToast(t.updateSuccess, 'success');
      await fetchData();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  // Toggle active / paused
  const handleToggleActive = async (link: LinkItem) => {
    const updated = await handleUpdateLink(link.slug, {
      isActive: !link.isActive
    });
    if (updated) {
      showToast(
        link.isActive
          ? lang === 'tl'
            ? `Naka-pause na ang /${link.slug}`
            : `Link /${link.slug} paused`
          : lang === 'tl'
            ? `Aktibo na muli ang /${link.slug}`
            : `Link /${link.slug} activated`,
        'success'
      );
    }
  };

  // Delete Link
  const handleDeleteLink = async (slug: string) => {
    try {
      const res = await fetch(`/api/links/${encodeURIComponent(slug)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete');
      }

      showToast(lang === 'tl' ? `Burado na ang /${slug}` : `Deleted /${slug}`, 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Save Meta Tracking configuration
  const handleSaveMetaTracking = async (slug: string, metaTracking: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/links/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metaTracking })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update Meta settings');
      }
      showToast(lang === 'tl' ? 'Na-save ang Meta Review Tracker settings!' : 'Saved Meta Review Tracker settings!', 'success');
      await fetchData();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  // Reset Stats
  const handleResetStats = async (slug: string) => {
    try {
      const res = await fetch(`/api/links/${encodeURIComponent(slug)}/reset`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset stats');
      }
      showToast(lang === 'tl' ? `Na-reset ang clicks ng /${slug}` : `Reset clicks for /${slug}`, 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
              toast.type === 'success'
                ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950 border-rose-500/50 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        lang={lang}
        onToggleLang={() => setLang(lang === 'tl' ? 'en' : 'tl')}
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenDeploy={() => setIsDeployOpen(true)}
        onOpenApi={() => setIsApiOpen(true)}
        onOpenDb={() => setIsDbOpen(true)}
        onOpenMetaGuide={() => setIsMetaGuideOpen(true)}
        onRefresh={fetchData}
        isRefreshing={isRefreshing}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Explanation Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dynamic Short Link Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {lang === 'tl' ? (
                  <>
                    Permanenteng Short Link na may{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                      Nababagong Target URL
                    </span>
                  </>
                ) : (
                  <>
                    Permanent Short Links with{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                      Editable Destination URLs
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {lang === 'tl'
                  ? 'Ibigay sa iyong audience ang static link (tulad ng domain.com/link1 o QR code sa mga poster/ads). Kahit kailan mo gustong palitan ang destinasyon (YouTube, Shopee, website, promo video), palitan lamang ang Target URL sa dashboard na ito nang hindi nagbabago ang link1!'
                  : 'Distribute a permanent short link (like domain.com/link1 or QR code on posters). Whenever you want to switch the landing page, simply update the Target URL here without changing the short link!'}
              </p>
            </div>

            {/* Quick 3-Step Process Graphic */}
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="text-center sm:text-left">
                <div className="font-bold text-cyan-400 font-mono">1. /{origin ? 'link1' : 'link1'}</div>
                <div className="text-[11px] text-slate-400">Static Permanent Link</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />
              <div className="text-center sm:text-left">
                <div className="font-bold text-emerald-400">2. Auto Redirect</div>
                <div className="text-[11px] text-slate-400">302 Sub-second hop</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />
              <div className="text-center sm:text-left">
                <div className="font-bold text-amber-400">3. Edit Anytime</div>
                <div className="text-[11px] text-slate-400">No link breaking</div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <StatsCards stats={stats} lang={lang} />

        {/* Live Redirect Simulator Sandbox */}
        <RedirectTester origin={origin} lang={lang} />

        {/* Main Links Management Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{lang === 'tl' ? 'Pamamahala ng Links' : 'Links Manager'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {links.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'tl'
                  ? 'I-click ang "Baguhin ang Target URL" sa anumang link upang baguhin ang destinasyon nito'
                  : 'Click "Change Target URL" on any link to update destination anytime'}
              </p>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition shadow-xs shadow-blue-900/40"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{t.newLink}</span>
            </button>
          </div>

          <LinkList
            links={links}
            origin={origin}
            lang={lang}
            onOpenEditTarget={(link) => setEditLink(link)}
            onOpenQr={(link) => setQrLink(link)}
            onOpenAnalytics={(link) => setAnalyticsLink(link)}
            onOpenMetaTracker={(link) => setMetaTrackerLink(link)}
            onToggleActive={handleToggleActive}
            onDeleteLink={handleDeleteLink}
          />
        </section>

        {/* Free Deployment Callout Section */}
        <section className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {lang === 'tl' ? 'Paano i-deploy ito nang Libre?' : 'How to deploy this for Free?'}
              </h4>
              <p className="text-xs text-slate-400">
                {lang === 'tl'
                  ? 'May kasamang ready-to-copy code para sa Cloudflare Workers (100k free requests/day), Render.com, at Vercel.'
                  : 'Includes pre-built configs for Cloudflare Workers (100k free requests/day), Render, and Vercel.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDeployOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-950/40"
            >
              {lang === 'tl' ? 'Buksan ang Deployment Guide' : 'Open Deployment Guide'}
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-400">LinkPulse Dynamic Redirection Server</span>
            <span className="mx-2">•</span>
            <span>Express + Lightweight Key-Value Storage</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsApiOpen(true)} className="hover:text-slate-300 transition">
              API Docs
            </button>
            <span>•</span>
            <button onClick={() => setIsDbOpen(true)} className="hover:text-slate-300 transition">
              SQLite & Backup
            </button>
            <span>•</span>
            <button onClick={() => setIsDeployOpen(true)} className="hover:text-slate-300 transition">
              Deploy
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {isCreateOpen && (
        <CreateLinkModal
          origin={origin}
          lang={lang}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateLink}
        />
      )}

      {editLink && (
        <EditTargetModal
          link={editLink}
          origin={origin}
          lang={lang}
          onClose={() => setEditLink(null)}
          onUpdate={handleUpdateLink}
        />
      )}

      {qrLink && (
        <QrCodeModal
          link={qrLink}
          origin={origin}
          lang={lang}
          onClose={() => setQrLink(null)}
        />
      )}

      {analyticsLink && (
        <AnalyticsModal
          link={analyticsLink}
          origin={origin}
          lang={lang}
          onClose={() => setAnalyticsLink(null)}
          onResetStats={handleResetStats}
        />
      )}

      {isDeployOpen && (
        <DeploymentGuideModal
          origin={origin}
          lang={lang}
          onClose={() => setIsDeployOpen(false)}
        />
      )}

      {isApiOpen && (
        <ApiDocsModal
          origin={origin}
          lang={lang}
          onClose={() => setIsApiOpen(false)}
        />
      )}

      {isDbOpen && (
        <DatabaseToolsModal
          lang={lang}
          onClose={() => setIsDbOpen(false)}
          onRefresh={fetchData}
        />
      )}

      {/* Meta Ads Review Tracker Modal */}
      {metaTrackerLink && (
        <MetaTrackerModal
          link={metaTrackerLink}
          isOpen={!!metaTrackerLink}
          onClose={() => setMetaTrackerLink(null)}
          lang={lang}
          onSave={handleSaveMetaTracking}
          onRefreshStatus={() => fetchData()}
          onOpenGuide={() => setIsMetaGuideOpen(true)}
        />
      )}

      {/* Meta Token & Graph API Guide Modal */}
      <MetaGuideModal
        isOpen={isMetaGuideOpen}
        onClose={() => setIsMetaGuideOpen(false)}
        lang={lang}
      />
    </div>
  );
}
