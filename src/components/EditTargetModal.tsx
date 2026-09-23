import React, { useState } from 'react';
import { X, ArrowRight, Check, AlertCircle, Sparkles, Link2 } from 'lucide-react';
import type { LinkItem, UpdateLinkInput } from '../types';
import type { Lang } from '../i18n';
import { translations } from '../i18n';

interface Props {
  link: LinkItem | null;
  origin: string;
  lang: Lang;
  onClose: () => void;
  onUpdate: (slug: string, updates: UpdateLinkInput) => Promise<boolean>;
}

export const EditTargetModal: React.FC<Props> = ({ link, origin, lang, onClose, onUpdate }) => {
  const t = translations[lang];
  const [targetUrl, setTargetUrl] = useState(link?.targetUrl || '');
  const [title, setTitle] = useState(link?.title || '');
  const [redirectType, setRedirectType] = useState<301 | 302 | 307 | 308>(link?.redirectType || 302);
  const [isActive, setIsActive] = useState(link?.isActive ?? true);
  const [forwardQueryParams, setForwardQueryParams] = useState(link?.forwardQueryParams ?? true);
  const [tagsInput, setTagsInput] = useState((link?.tags || []).join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!link) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) {
      setError(lang === 'tl' ? 'Mangyaring maglagay ng Target URL' : 'Please provide a Target URL');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const tags = tagsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const ok = await onUpdate(link.slug, {
        targetUrl: targetUrl.trim(),
        title: title.trim(),
        redirectType,
        isActive,
        tags,
        forwardQueryParams
      });

      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPreset = (url: string) => {
    setTargetUrl(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {lang === 'tl' ? 'Baguhin ang Target URL' : 'Update Target URL'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'tl'
                  ? 'Mananatiling pareho ang static link, mapapalitan lang ang patutunguhan'
                  : 'The static short link stays the same, only the destination changes'}
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

        {/* Static Link Info Banner */}
        <div className="my-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              {lang === 'tl' ? 'Permanenteng Short Link (Static)' : 'Permanent Short Link (Static)'}
            </div>
            <div className="font-mono text-sm text-cyan-400 font-bold">
              {origin}/{link.slug}
            </div>
          </div>
          <span className="px-2 py-0.5 text-[11px] rounded bg-emerald-500/20 text-emerald-300 font-medium">
            Permanent
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {lang === 'tl' ? 'Bagong Target URL (Destination)' : 'New Target URL (Destination)'} *
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://yourwebsite.com/new-promo"
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden font-mono"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {lang === 'tl'
                ? 'Kahit kailan mo ito baguhin, ang visitors ng domain.com/' + link.slug + ' ay dediretsyo agad dito.'
                : 'Whenever visitors open ' + origin + '/' + link.slug + ', they will be instantly redirected here.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {lang === 'tl' ? 'Label / Pamagat' : 'Title / Label'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Promo Campaign 2026"
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'tl' ? 'HTTP Redirect Type' : 'Redirect Type'}
              </label>
              <select
                value={redirectType}
                onChange={(e) => setRedirectType(Number(e.target.value) as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
              >
                <option value={302}>302 - Temporary {lang === 'tl' ? '(Inirerekomenda)' : '(Recommended)'}</option>
                <option value={307}>307 - Temporary (Preserve Method)</option>
                <option value={301}>301 - Permanent</option>
                <option value={308}>308 - Permanent (Preserve Method)</option>
              </select>
              <span className="text-[10px] text-slate-400 block mt-1">
                {lang === 'tl'
                  ? '302 ang pinakamaganda para hindi i-cache ng browser ang lumang target URL.'
                  : '302 prevents browsers from caching the old URL.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'tl' ? 'Katayuan (Status)' : 'Status'}
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isActive ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-xs font-medium ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isActive ? (lang === 'tl' ? 'Aktibo' : 'Active') : (lang === 'tl' ? 'Naka-Pause' : 'Paused')}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forwardQueryParams}
                onChange={(e) => setForwardQueryParams(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
              />
              <span className="text-xs text-slate-300">
                {lang === 'tl'
                  ? 'I-forward ang query parameters (hal. ?utm_source=facebook o ?ref=promo)'
                  : 'Forward query parameters (e.g. ?utm_source=facebook)'}
              </span>
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
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 px-5 rounded-xl transition text-sm shadow-md shadow-blue-900/30"
            >
              {isSubmitting ? (lang === 'tl' ? 'Nagse-save...' : 'Saving...') : t.saveChanges}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
