import React, { useState } from 'react';
import { X, Code, Copy, Check, Terminal, Send, ArrowRight } from 'lucide-react';
import type { Lang } from '../i18n';

interface Props {
  origin: string;
  lang: Lang;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<Props> = ({ origin, lang, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const curlUpdateExample = `curl -X PUT "${origin}/api/links/link1" \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetUrl": "https://bagong-website.com/promo-2026",
    "title": "Updated Destination",
    "isActive": true
  }'`;

  const jsFetchExample = `// JavaScript / Node.js
await fetch("${origin}/api/links/link1", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    targetUrl: "https://bagong-website.com/promo-2026",
    title: "Updated via API"
  })
});`;

  const pythonExample = `# Python requests
import requests

url = "${origin}/api/links/link1"
payload = {
    "targetUrl": "https://bagong-website.com/promo-2026",
    "title": "Updated via Python"
}
response = requests.put(url, json=payload)
print(response.json())`;

  const curlCreateExample = `curl -X POST "${origin}/api/links" \\
  -H "Content-Type: application/json" \\
  -d '{
    "slug": "promo2026",
    "targetUrl": "https://example.com/landing",
    "title": "Summer Promo",
    "redirectType": 302,
    "tags": ["summer", "ads"]
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">REST API Reference</h3>
              <p className="text-xs text-slate-400">
                {lang === 'tl'
                  ? 'Baguhin ang Target URL ng link1 gamit ang cURL, Python, o Node.js script'
                  : 'Automate or update Target URLs programmatically via HTTP requests'}
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
        <div className="overflow-y-auto flex-1 pr-2 py-4 space-y-6 text-sm text-slate-300">
          {/* Key Feature: Update Target URL */}
          <div className="bg-slate-800/60 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PUT
                </span>
                <span className="font-mono text-xs text-white">/api/links/:slug</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">
                {lang === 'tl' ? 'Pangunahing Feature' : 'Key Feature'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              {lang === 'tl'
                ? 'Baguhin ang Target URL ng anumang slug (tulad ng "link1") anytime. Hindi magbabago ang static short link!'
                : 'Update the destination URL of any slug without touching the short link URL.'}
            </p>

            <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 font-mono text-xs mb-3">
              <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                <span>cURL Command</span>
                <button
                  onClick={() => copy(curlUpdateExample, 'curl-put')}
                  className="flex items-center gap-1 text-slate-300 hover:text-white"
                >
                  {copiedKey === 'curl-put' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'curl-put' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 text-slate-300 overflow-x-auto leading-relaxed">{curlUpdateExample}</pre>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 font-mono text-xs">
              <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                <span>JavaScript / Fetch</span>
                <button
                  onClick={() => copy(jsFetchExample, 'js-fetch')}
                  className="flex items-center gap-1 text-slate-300 hover:text-white"
                >
                  {copiedKey === 'js-fetch' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'js-fetch' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 text-slate-300 overflow-x-auto leading-relaxed">{jsFetchExample}</pre>
            </div>
          </div>

          {/* Endpoint: Create Link */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                POST
              </span>
              <span className="font-mono text-xs text-white">/api/links</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {lang === 'tl' ? 'Gumawa ng bagong permanenteng static short link.' : 'Create a new static short link.'}
            </p>

            <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 font-mono text-xs">
              <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                <span>cURL Create</span>
                <button
                  onClick={() => copy(curlCreateExample, 'curl-post')}
                  className="flex items-center gap-1 text-slate-300 hover:text-white"
                >
                  {copiedKey === 'curl-post' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'curl-post' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 text-slate-300 overflow-x-auto leading-relaxed">{curlCreateExample}</pre>
            </div>
          </div>

          {/* Table of all endpoints */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {lang === 'tl' ? 'Listahan ng Lahat ng Endpoints' : 'All Endpoints Summary'}
            </h4>
            <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-800/80 text-slate-300 font-sans">
                  <tr>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Endpoint</th>
                    <th className="py-2 px-3 font-sans">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  <tr>
                    <td className="py-2 px-3 text-cyan-400">GET</td>
                    <td className="py-2 px-3">/:slug</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">
                      {lang === 'tl' ? 'Automatic 302/301 redirect papunta sa Target URL' : 'Auto 302/301 redirect to Target URL'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-cyan-400">GET</td>
                    <td className="py-2 px-3">/api/links</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">
                      {lang === 'tl' ? 'Kunin ang lahat ng links at click count' : 'List all links with click counts'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-emerald-400">POST</td>
                    <td className="py-2 px-3">/api/links</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">
                      {lang === 'tl' ? 'Gumawa ng bagong link' : 'Create new short link'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-amber-400">PUT</td>
                    <td className="py-2 px-3">/api/links/:slug</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">
                      {lang === 'tl' ? 'Baguhin ang target URL anytime' : 'Update target URL anytime'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-rose-400">DELETE</td>
                    <td className="py-2 px-3">/api/links/:slug</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">
                      {lang === 'tl' ? 'Burahin ang short link' : 'Delete short link'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-cyan-400">GET</td>
                    <td className="py-2 px-3">/api/stats/overview</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">
                      {lang === 'tl' ? 'Analytics, device breakdown, at referrers' : 'Aggregated clicks and device breakdown'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
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
