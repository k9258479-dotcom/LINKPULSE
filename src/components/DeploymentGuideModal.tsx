import React, { useState } from 'react';
import { X, Cloud, Server, Zap, Copy, Check, ExternalLink, Terminal, ShieldCheck, Database } from 'lucide-react';
import type { Lang } from '../i18n';

interface Props {
  origin: string;
  lang: Lang;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<Props> = ({ origin, lang, onClose }) => {
  const [activeTab, setActiveTab] = useState<'cloudflare' | 'render' | 'vercel'>('cloudflare');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const cloudflareWorkerCode = `/**
 * Cloudflare Worker: Dynamic Link Redirection Server
 * Free Tier: 100,000 requests/day, 0ms cold-start, global CDN!
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Kukunin ang slug mula sa URL, hal. domain.com/link1 -> slug = "link1"
    const slug = url.pathname.replace(/^\\/(r\\/)?/, '').split('/')[0].toLowerCase();

    // 1. Kung walang slug o nasa root path
    if (!slug) {
      return new Response(
        \`<html><body style="font-family:sans-serif;text-align:center;padding:50px;">
          <h2>Dynamic Redirection Server is Running!</h2>
          <p>Usage: <code>\${url.origin}/your-slug</code></p>
        </body></html>\`,
        { headers: { 'content-type': 'text/html;charset=UTF-8' } }
      );
    }

    // 2. Kukunin ang Target URL sa Cloudflare KV store (LINKS_KV)
    let target = null;
    let redirectType = 302;

    if (env.LINKS_KV) {
      const raw = await env.LINKS_KV.get(slug);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          target = parsed.url;
          redirectType = parsed.status || 302;
          if (parsed.active === false) {
            return new Response('Link is currently paused.', { status: 403 });
          }
        } catch {
          target = raw;
        }
      }
    }

    // Default sample fallback kung wala pa sa KV:
    const FALLBACK_LINKS = {
      link1: "https://google.com",
      promo: "https://github.com"
    };

    if (!target && FALLBACK_LINKS[slug]) {
      target = FALLBACK_LINKS[slug];
    }

    if (!target) {
      return new Response('404: Short link not found', { status: 404 });
    }

    // 3. I-forward ang query parameters (hal. ?utm_source=facebook)
    if (url.search) {
      target += (target.includes('?') ? '&' : '?') + url.search.substring(1);
    }

    // 4. Background Click Counter sa KV
    if (env.LINKS_KV && ctx?.waitUntil) {
      ctx.waitUntil((async () => {
        const statsKey = \`hits:\${slug}\`;
        const hits = parseInt(await env.LINKS_KV.get(statsKey) || '0', 10);
        await env.LINKS_KV.put(statsKey, String(hits + 1));
      })());
    }

    // 5. Automatic Redirect!
    return Response.redirect(target, redirectType);
  }
};`;

  const renderYamlCode = `services:
  - type: web
    name: dynamic-link-server
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000`;

  const vercelApiCode = `// api/[slug].js (Vercel Serverless Function)
export default async function handler(req, res) {
  const { slug } = req.query;

  // Maaari kang mag-connect sa Upstash Redis (Libre) o SQLite/KV
  // Halimbawa:
  const links = {
    link1: "https://google.com",
    promo: "https://news.ycombinator.com"
  };

  const targetUrl = links[slug?.toLowerCase()];

  if (targetUrl) {
    // 302 redirect
    return res.redirect(302, targetUrl);
  }

  return res.status(404).send('Short link not found');
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {lang === 'tl' ? 'Step-by-Step Libreng Deployment Guide' : 'Free Step-by-Step Deployment Guide'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'tl'
                  ? 'Paano i-host ang server online nang walang binabayaran'
                  : 'How to deploy this dynamic link redirection server for 100% free'}
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

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pt-4 pb-2">
          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'cloudflare'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4 text-amber-400" />
            Cloudflare Workers + KV {lang === 'tl' ? '(Pinakamabilis)' : '(Fastest & Edge)'}
          </button>
          <button
            onClick={() => setActiveTab('render')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'render'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Server className="w-4 h-4 text-purple-400" />
            Render.com (Full Express Server)
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'vercel'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-blue-400" />
            Vercel Serverless
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 pr-2 py-4 space-y-6 text-sm text-slate-300">
          {/* TAB 1: CLOUDFLARE WORKERS */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200">
                  <strong>{lang === 'tl' ? 'Bakit Cloudflare Workers?' : 'Why Cloudflare Workers?'}</strong>{' '}
                  {lang === 'tl'
                    ? '100% Libre (100,000 requests bawat araw), walang server cold-start, at may Cloudflare KV para i-save ang links nang libre. Mas mabilis pa kaysa sa karaniwang VPS dahil direct sa local edge servers!'
                    : '100% Free (100,000 requests/day), 0ms cold-start, and free Cloudflare KV for links storage. Sub-10ms redirection latency globally!'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">1</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {lang === 'tl' ? 'Gumawa ng Libreng Cloudflare Account' : 'Create a Free Cloudflare Account'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {lang === 'tl' ? 'Pumunta sa' : 'Go to'}{' '}
                      <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                        dash.cloudflare.com
                      </a>{' '}
                      {lang === 'tl' ? 'at mag-sign in.' : 'and sign up or log in.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">2</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {lang === 'tl' ? 'Gumawa ng KV Namespace para sa Database' : 'Create KV Namespace for Links Storage'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {lang === 'tl'
                        ? 'Pumunta sa Workers & Pages > KV, i-click ang Create Namespace, at pangalanan itong '
                        : 'Navigate to Workers & Pages > KV, click Create Namespace, and name it '}
                      <code className="text-amber-300">LINKS_KV</code>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">3</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {lang === 'tl' ? 'Gumawa ng Bagong Worker at I-paste ang Code' : 'Create a New Worker & Paste Code'}
                    </h4>
                    <p className="text-xs text-slate-400 mb-2">
                      {lang === 'tl'
                        ? 'Sa Workers & Pages, i-click ang Create Application > Create Worker. I-paste ang code sa ibaba:'
                        : 'Under Workers & Pages, click Create Application > Create Worker. Paste the code below:'}
                    </p>

                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                        <span>worker.js (Cloudflare)</span>
                        <button
                          onClick={() => copyToClipboard(cloudflareWorkerCode, 'cf')}
                          className="flex items-center gap-1 text-slate-300 hover:text-white"
                        >
                          {copiedCode === 'cf' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedCode === 'cf' ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                      <pre className="p-3 text-slate-300 overflow-x-auto max-h-56 leading-relaxed">
                        {cloudflareWorkerCode}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">4</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {lang === 'tl' ? 'I-bind ang KV at I-connect ang Custom Domain' : 'Bind KV and Connect Custom Domain'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {lang === 'tl'
                        ? 'Pumunta sa Settings ng Worker > Variables > KV Namespace Bindings. I-bind ang Variable name LINKS_KV. Pagkatapos, ikonekta ang sarili mong domain sa Custom Domains tab!'
                        : 'Under Worker Settings > Variables > KV Namespace Bindings, bind Variable name LINKS_KV. Then connect your custom domain (e.g. domain.com/*) under the Custom Domains tab for instant free SSL!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RENDER.COM */}
          {activeTab === 'render' && (
            <div className="space-y-4">
              <div className="bg-purple-950/20 border border-purple-500/30 p-3.5 rounded-xl flex items-start gap-3">
                <Server className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-200">
                  <strong>{lang === 'tl' ? 'Bakit Render.com?' : 'Why Render.com?'}</strong>{' '}
                  {lang === 'tl'
                    ? 'Libreng hosting para sa full Node.js / Express code kasama ang buong Admin Dashboard, real-time analytics, at database na ito nang walang binabago sa code!'
                    : 'Free hosting for the full Node.js / Express server including this Admin Dashboard, live simulator, and KV persistence without code modifications!'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">1</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {lang === 'tl' ? 'I-push ang Project sa GitHub' : 'Push Project to GitHub'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {lang === 'tl'
                        ? 'Gumawa ng repository sa GitHub at i-push ang buong project folder.'
                        : 'Create a repository on GitHub and push the codebase.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">2</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {lang === 'tl' ? 'Mag-sign up sa Render.com' : 'Sign Up on Render.com'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {lang === 'tl' ? 'Pumunta sa' : 'Go to'}{' '}
                      <a href="https://render.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                        render.com
                      </a>{' '}
                      {lang === 'tl' ? 'at i-click ang New + > Web Service.' : 'and click New + > Web Service.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">3</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {lang === 'tl' ? 'I-configure ang Build at Start Commands' : 'Configure Build & Start Commands'}
                    </h4>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 my-2 space-y-1 font-mono text-xs">
                      <div><span className="text-slate-500">Environment:</span> <span className="text-emerald-400">Node</span></div>
                      <div><span className="text-slate-500">Build Command:</span> <span className="text-cyan-400">npm install && npm run build</span></div>
                      <div><span className="text-slate-500">Start Command:</span> <span className="text-cyan-400">npm run start</span></div>
                      <div><span className="text-slate-500">Instance Type:</span> <span className="text-amber-400">Free ($0/month)</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">4</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {lang === 'tl' ? 'Add Custom Domain' : 'Add Custom Domain'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {lang === 'tl'
                        ? 'Pagkatapos mag-deploy, pumunta sa Settings > Custom Domains sa Render at idagdag ang iyong domain (hal. links.mydomain.com). Libre ang auto-SSL certificate!'
                        : 'After deploy, go to Settings > Custom Domains on Render and add your domain (e.g. links.mydomain.com). Auto-SSL certificate is completely free!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VERCEL */}
          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="bg-blue-950/20 border border-blue-500/30 p-3.5 rounded-xl flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-200">
                  <strong>{lang === 'tl' ? 'Bakit Vercel?' : 'Why Vercel?'}</strong>{' '}
                  {lang === 'tl'
                    ? 'May libreng tier din ang Vercel na may mabilis na Edge redirects. Maaaring gamitin ang Upstash Redis o Vercel KV para sa pag-save ng links.'
                    : 'Vercel also provides a free tier with rapid Edge redirects and free Upstash Redis / Vercel KV integration.'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">1</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {lang === 'tl' ? 'I-import ang Repository sa Vercel' : 'Import Repository into Vercel'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {lang === 'tl' ? 'Pumunta sa' : 'Go to'}{' '}
                      <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                        vercel.com
                      </a>{' '}
                      {lang === 'tl' ? 'at i-connect ang iyong GitHub account.' : 'and connect your GitHub account.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">2</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Serverless Redirect Handler</h4>
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs my-2">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                        <span>api/[slug].js</span>
                        <button
                          onClick={() => copyToClipboard(vercelApiCode, 'vc')}
                          className="flex items-center gap-1 text-slate-300 hover:text-white"
                        >
                          {copiedCode === 'vc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedCode === 'vc' ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                      <pre className="p-3 text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                        {vercelApiCode}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === 'tl'
                ? 'Lahat ng paraang ito ay 100% Free Tier (Walang kailangang Credit Card).'
                : 'All these options are 100% Free Tier (No credit card required).'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition font-medium"
          >
            {lang === 'tl' ? 'Isara' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
