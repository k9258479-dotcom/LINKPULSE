import React, { useState } from 'react';
import {
  ShieldCheck,
  Bot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Key,
  RefreshCw,
  ExternalLink,
  Sliders,
  HelpCircle,
  X,
  Play,
  Check
} from 'lucide-react';
import type { LinkItem, MetaEffectiveStatus } from '../types';
import type { Lang } from '../i18n';
import { safeFetchJson } from '../utils/api';

interface Props {
  link: LinkItem | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  onSave: (slug: string, metaTracking: any) => Promise<boolean>;
  onRefreshStatus: (slug: string) => void;
  onOpenGuide: () => void;
}

export const MetaTrackerModal: React.FC<Props> = ({
  link,
  isOpen,
  onClose,
  lang,
  onSave,
  onRefreshStatus,
  onOpenGuide
}) => {
  if (!isOpen || !link) return null;

  const currentTracking = link.metaTracking || {
    enabled: false,
    adId: '',
    accessToken: '',
    effectiveStatus: 'NOT_CONFIGURED',
    autoSwitchOnActive: false,
    safePageUrl: '',
    moneyPageUrl: link.targetUrl || '',
    botVisited: false,
    botVisitCount: 0
  };

  const [enabled, setEnabled] = useState(currentTracking.enabled ?? false);
  const [adId, setAdId] = useState(currentTracking.adId || '');
  const [accessToken, setAccessToken] = useState(currentTracking.accessToken || '');
  const [effectiveStatus, setEffectiveStatus] = useState<MetaEffectiveStatus>(
    currentTracking.effectiveStatus || 'NOT_CONFIGURED'
  );
  const [autoSwitchOnActive, setAutoSwitchOnActive] = useState(
    currentTracking.autoSwitchOnActive ?? false
  );
  const [safePageUrl, setSafePageUrl] = useState(currentTracking.safePageUrl || '');
  const [moneyPageUrl, setMoneyPageUrl] = useState(
    currentTracking.moneyPageUrl || link.targetUrl || ''
  );

  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [apiCheckResult, setApiCheckResult] = useState<any | null>(null);
  const [isSimulatingBot, setIsSimulatingBot] = useState(false);
  const [botSimulationMessage, setBotSimulationMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLiveCheck = async () => {
    if (!adId.trim()) {
      alert(lang === 'tl' ? 'Mangyaring maglagay muna ng Meta Ad ID' : 'Please provide a Meta Ad ID first');
      return;
    }

    setIsCheckingApi(true);
    setApiCheckResult(null);

    try {
      const res = await safeFetchJson('/api/meta/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: adId.trim(),
          accessToken: accessToken.trim(),
          slug: link.slug
        })
      });

      const data = res.data || { success: false, error: res.error || 'Failed to check status' };
      setApiCheckResult(data);

      if (data.success && data.effectiveStatus) {
        setEffectiveStatus(data.effectiveStatus);
        onRefreshStatus(link.slug);
      }
    } catch (err: any) {
      setApiCheckResult({
        success: false,
        error: err.message || 'Failed to call Meta Graph API'
      });
    } finally {
      setIsCheckingApi(false);
    }
  };

  const handleSimulateCrawler = async () => {
    setIsSimulatingBot(true);
    setBotSimulationMessage(null);

    try {
      const res = await safeFetchJson(`/api/links/${encodeURIComponent(link.slug)}/test-meta-crawler`, {
        method: 'POST'
      });
      if (res.ok && res.data?.success) {
        setBotSimulationMessage(res.data.reviewLog || 'Meta Crawler visit logged!');
        onRefreshStatus(link.slug);
      } else {
        setBotSimulationMessage(res.error || 'Simulation failed');
      }
    } catch (err: any) {
      setBotSimulationMessage(err.message || 'Simulation failed');
    } finally {
      setIsSimulatingBot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const ok = await onSave(link.slug, {
        enabled,
        adId: adId.trim(),
        accessToken: accessToken.trim(),
        effectiveStatus,
        autoSwitchOnActive,
        safePageUrl: safePageUrl.trim(),
        moneyPageUrl: moneyPageUrl.trim()
      });

      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status?: MetaEffectiveStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ACTIVE (Approved)
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            PENDING_REVIEW
          </span>
        );
      case 'DISAPPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            DISAPPROVED
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-medium">
            PAUSED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
            {status || 'NOT_CONFIGURED'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Meta Ads Review Tracker</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                  /{link.slug}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'tl'
                  ? 'Meta Graph API v20.0 Status, Review Bot Detection, at Auto-Redirect Rule'
                  : 'Meta Graph API v20.0 Status, Review Bot Detection, and Auto-Switch Rules'}
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

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-2 py-4 space-y-5 text-xs text-slate-300">
          {/* Top Status Cards: Bot Inspection + Campaign Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Card 1: Bot Inspection Status */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>Bot Inspection Status</span>
                </div>
                <div className="my-2">
                  {currentTracking.botVisited ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lang === 'tl' ? 'Nabisita na ng Meta Bot' : 'Reviewed by Meta Crawler'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      {lang === 'tl' ? 'Hindi pa nabibisita ng Bot' : 'Pending Crawler Inspection'}
                    </span>
                  )}
                </div>
                {currentTracking.botReviewLog && (
                  <div className="mt-2 font-mono text-[10px] text-emerald-400 bg-slate-950/80 p-2 rounded border border-emerald-900/60">
                    {currentTracking.botReviewLog}
                  </div>
                )}
                {currentTracking.botVisitCount > 0 && (
                  <div className="text-[11px] text-slate-400 mt-1">
                    Total Bot Inspections: <strong>{currentTracking.botVisitCount}</strong>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSimulateCrawler}
                  disabled={isSimulatingBot}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                  title="Simulate facebookexternalhit crawler visit"
                >
                  <Play className="w-3 h-3" />
                  <span>{isSimulatingBot ? 'Testing...' : 'Test Bot Visit (Crawler)'}</span>
                </button>
                {botSimulationMessage && (
                  <span className="text-[10px] text-emerald-400 font-medium animate-fade-in">
                    Success!
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Meta Campaign Status */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Meta Campaign Status</span>
                </div>
                <div className="my-2">{getStatusBadge(effectiveStatus)}</div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>
                    Ad ID: <span className="font-mono text-slate-200">{adId || 'Not linked'}</span>
                  </div>
                  {currentTracking.lastCheckedAt && (
                    <div className="text-[10px] text-slate-500">
                      Last verified: {new Date(currentTracking.lastCheckedAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLiveCheck}
                  disabled={isCheckingApi || !adId}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingApi ? 'animate-spin' : ''}`} />
                  <span>{isCheckingApi ? 'Querying Graph API...' : 'Check Status Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Token Guide</span>
                </button>
              </div>
            </div>
          </div>

          {/* Graph API Live Check Result Box */}
          {apiCheckResult && (
            <div
              className={`p-3 rounded-xl border ${
                apiCheckResult.success
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
              }`}
            >
              <div className="font-semibold text-xs flex items-center gap-1.5">
                {apiCheckResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>
                  {apiCheckResult.success
                    ? `Graph API Result: ${apiCheckResult.effectiveStatus}`
                    : 'Meta Graph API Response'}
                </span>
              </div>
              <p className="text-[11px] mt-1 text-slate-300 font-mono">
                {apiCheckResult.error ||
                  `Ad Name: "${apiCheckResult.name}" | Status: ${apiCheckResult.effectiveStatus}`}
              </p>
            </div>
          )}

          {/* Main Settings Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Enable Tracker Toggle */}
            <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700/80 rounded-xl p-3">
              <div>
                <span className="font-semibold text-white block text-xs">
                  {lang === 'tl' ? 'I-activate ang Meta Review Tracker' : 'Activate Meta Review Tracker'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {lang === 'tl'
                    ? 'Subaybayan ang crawler review at i-sync sa Meta Marketing API'
                    : 'Track reviewer crawler visits & sync with Meta Marketing API'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
            </div>

            {/* Meta Ad ID */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Meta Ad ID (or Ad Set / Campaign ID)
              </label>
              <input
                type="text"
                value={adId}
                onChange={(e) => setAdId(e.target.value)}
                placeholder="e.g. 120205849182049102"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Makikita ito sa Meta Ads Manager table column na "Ad ID".
              </p>
            </div>

            {/* Access Token (Optional per link) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Meta System User Access Token (Optional)
                </label>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                >
                  Paano kumuha ng token?
                </button>
              </div>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAG... (Leave empty to use server default META_ACCESS_TOKEN)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Manual Status Selector (Useful for testing) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Campaign Effective Status (Manual Override / Tested Status)
              </label>
              <select
                value={effectiveStatus}
                onChange={(e) => setEffectiveStatus(e.target.value as MetaEffectiveStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-blue-500"
              >
                <option value="NOT_CONFIGURED">NOT_CONFIGURED</option>
                <option value="PENDING_REVIEW">PENDING_REVIEW (Awaiting Meta Review)</option>
                <option value="ACTIVE">ACTIVE (Approved & Running)</option>
                <option value="DISAPPROVED">DISAPPROVED (Rejected)</option>
                <option value="PAUSED">PAUSED</option>
              </select>
            </div>

            {/* Auto-Redirect Rule / Cloaking Section */}
            <div className="bg-slate-800/40 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white text-xs">
                    {lang === 'tl' ? 'Auto-Redirect Rule (Link A vs Link B)' : 'Auto-Redirect Rule (Link A vs Link B)'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSwitchOnActive}
                  onChange={(e) => setAutoSwitchOnActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {lang === 'tl'
                  ? 'Kapag PENDING_REVIEW pa o binibisita ng Meta Bot, mag-land muna sa Safe Page (Link A). Kapag na-detect na ACTIVE / Approved na sa Meta, awtomatikong lilipat sa Offer/Money Page (Link B).'
                  : 'While PENDING_REVIEW or when inspected by Meta Crawler, visitors land on Safe Page (Link A). When approved & ACTIVE, traffic switches to Offer/Money Page (Link B).'}
              </p>

              {autoSwitchOnActive && (
                <div className="space-y-3 pt-2 border-t border-slate-700/60">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-blue-400 mb-1">
                      Safe Page (Link A) - Compliance / White-Hat Page
                    </label>
                    <input
                      type="url"
                      value={safePageUrl}
                      onChange={(e) => setSafePageUrl(e.target.value)}
                      placeholder="https://yourblog.com/safe-article"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                      required={autoSwitchOnActive}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-emerald-400 mb-1">
                      Offer / Money Page (Link B) - Conversion Page
                    </label>
                    <input
                      type="url"
                      value={moneyPageUrl}
                      onChange={(e) => setMoneyPageUrl(e.target.value)}
                      placeholder="https://yourstore.com/checkout-offer"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                      required={autoSwitchOnActive}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs font-medium"
              >
                {lang === 'tl' ? 'Kanselahin' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-xs font-bold shadow-lg shadow-blue-900/40 flex items-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <span>{lang === 'tl' ? 'I-save ang Settings' : 'Save Meta Tracker'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
