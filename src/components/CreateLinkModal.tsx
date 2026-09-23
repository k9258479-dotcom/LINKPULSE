import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import type { CreateLinkInput } from '../types';
import type { Lang } from '../i18n';
import { translations } from '../i18n';

interface Props {
  origin: string;
  lang: Lang;
  onClose: () => void;
  onCreate: (input: CreateLinkInput) => Promise<boolean>;
}

export const CreateLinkModal: React.FC<Props> = ({ origin, lang, onClose, onCreate }) => {
  const t = translations[lang];
  const [slug, setSlug] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [redirectType, setRedirectType] = useState<301 | 302 | 307 | 308>(302);
  const [tagsInput, setTagsInput] = useState('');
  const [forwardQueryParams, setForwardQueryParams] = useState(true);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check slug availability with debounce
  useEffect(() => {
    const clean = slug.trim().toLowerCase();
    if (!clean) {
      setSlugStatus('idle');
      return;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(clean)) {
      setSlugStatus('taken');
      return;
    }

    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug/${encodeURIComponent(clean)}`);
        const data = await res.json();
        setSlugStatus(data.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleGenerateRandomSlug = () => {
    const words = ['promo', 'vip', 'deal', 'special', 'app', 'link', 'go', 'hub'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    setSlug(`${randomWord}${randomNum}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) {
      setError(lang === 'tl' ? 'Mangyaring maglagay ng short slug (hal. link1)' : 'Please enter a slug');
      return;
    }

    if (slugStatus === 'taken') {
      setError(lang === 'tl' ? 'Gamit na o bawal ang slug na ito. Pumili ng iba.' : 'Slug already taken or reserved');
      return;
    }

    if (!targetUrl.trim()) {
      setError(lang === 'tl' ? 'Mangyaring maglagay ng Target URL' : 'Please provide a Target URL');
      return;
    }

    try {
      setIsSubmitting(true);
      const tags = tagsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const ok = await onCreate({
        slug: cleanSlug,
        targetUrl: targetUrl.trim(),
        title: title.trim() || cleanSlug,
        description: description.trim(),
        redirectType,
        tags,
        forwardQueryParams,
        isActive: true
      });

      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'tl' ? 'Gumawa ng Permanenteng Short Link' : 'Create Permanent Short Link'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'tl'
                ? 'Makakagawa ka ng static link tulad ng domain.com/link1 na laging magre-redirect'
                : 'Generate a static link like domain.com/link1 that auto-redirects'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          {/* Slug Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t.slugLabel} *
              </label>
              <button
                type="button"
                onClick={handleGenerateRandomSlug}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {lang === 'tl' ? 'Auto-generate' : 'Generate random'}
              </button>
            </div>

            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden focus-within:border-blue-500">
              <span className="px-3 text-xs text-slate-400 bg-slate-800/80 border-r border-slate-700 py-2.5 font-mono select-none">
                {origin}/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="link1"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden font-mono"
                required
              />
              <div className="pr-3 flex items-center">
                {slugStatus === 'checking' && (
                  <span className="text-xs text-slate-400">...</span>
                )}
                {slugStatus === 'available' && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Available
                  </span>
                )}
                {slugStatus === 'taken' && (
                  <span className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {lang === 'tl' ? 'Hindi Pwede' : 'Unavailable'}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{t.slugHelp}</p>
          </div>

          {/* Target URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.targetUrlLabel} *
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com/target-landing-page"
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden font-mono"
              required
            />
            <p className="mt-1 text-[11px] text-slate-400">{t.targetUrlHelp}</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.titleLabel}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'tl' ? 'Hal. Facebook Ad Campaign 2026' : 'e.g. Facebook Ad Campaign 2026'}
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden"
            />
          </div>

          {/* Tags & Redirection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.tagsLabel}
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="promo, ads, video"
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.redirectType}
              </label>
              <select
                value={redirectType}
                onChange={(e) => setRedirectType(Number(e.target.value) as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
              >
                <option value={302}>302 - Temporary (Recommended)</option>
                <option value={307}>307 - Temporary (Preserve Method)</option>
                <option value={301}>301 - Permanent</option>
              </select>
            </div>
          </div>

          {/* Forward query parameters */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forwardQueryParams}
                onChange={(e) => setForwardQueryParams(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
              />
              <span className="text-xs text-slate-300">{t.forwardParams}</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || slugStatus === 'taken'}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 px-5 rounded-xl transition text-sm shadow-md shadow-blue-900/30"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? (lang === 'tl' ? 'Gumagawa...' : 'Creating...') : t.newLink}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
