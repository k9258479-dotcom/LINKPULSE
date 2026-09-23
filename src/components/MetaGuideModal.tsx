import React, { useState } from 'react';
import {
  ShieldCheck,
  Bot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Key,
  Copy,
  Check,
  ExternalLink,
  Code,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Sliders,
  X
} from 'lucide-react';
import type { Lang } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

export const MetaGuideModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'system_token' | 'graph_api' | 'bot_detection' | 'auto_switch'>('system_token');

  if (!isOpen) return null;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleGraphApiCall = `// 1. Node.js (Fetch) - Meta Graph API Status Check
async function getMetaAdStatus(adId, accessToken) {
  const url = \`https://graph.facebook.com/v20.0/\${adId}?fields=name,status,effective_status&access_token=\${accessToken}\`;
  const res = await fetch(url);
  const data = await res.json();

  console.log("Ad Name:", data.name);
  console.log("Effective Status:", data.effective_status);
  // Returns: "ACTIVE" | "PENDING_REVIEW" | "DISAPPROVED" | "PAUSED"
  return data.effective_status;
}`;

  const sampleCurl = `# Check Ad effective_status via cURL:
curl -X GET "https://graph.facebook.com/v20.0/120205849182049102?fields=name,status,effective_status&access_token=EAAG..."`;

  const sampleWorkerBotDetection = `// Cloudflare Worker / Express User-Agent Review Bot Detection
const userAgent = request.headers.get('user-agent') || '';
const isMetaReviewCrawler = /facebookexternalhit|facebot|facebookbot/i.test(userAgent);

if (isMetaReviewCrawler) {
  // 1. Log to database: [Meta Bot Reviewed Link - Date/Time]
  await logMetaBotInspection(slug, new Date().toISOString());

  // 2. Serve approved Safe Page (Link A) to the crawler
  return Response.redirect(link.safePageUrl, 302);
}

// If real user: Check if Campaign is ACTIVE or PENDING_REVIEW
if (campaignStatus === 'ACTIVE') {
  return Response.redirect(link.moneyPageUrl, 302); // Offer Page (Link B)
} else {
  return Response.redirect(link.safePageUrl, 302);  // Safe Page (Link A)
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Meta Ads Review Tracker & Token Guide</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  Graph API v20.0
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'tl'
                  ? 'Paano kumuha ng System User Access Token at kung paano gumagana ang Meta Crawler Review Tracker'
                  : 'How to acquire a Meta System User Token & how crawler review tracking works'}
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-800/80 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('system_token')}
            className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'system_token'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>1. System User Token</span>
          </button>
          <button
            onClick={() => setActiveTab('bot_detection')}
            className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'bot_detection'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. Meta Crawler Bot Detection</span>
          </button>
          <button
            onClick={() => setActiveTab('auto_switch')}
            className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'auto_switch'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Auto-Redirect Rule (Link A vs Link B)</span>
          </button>
          <button
            onClick={() => setActiveTab('graph_api')}
            className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'graph_api'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span>4. Graph API Code Sample</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 pr-2 py-4 space-y-4 text-xs text-slate-300">
          {activeTab === 'system_token' && (
            <div className="space-y-4">
              <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-400" />
                  <span>
                    {lang === 'tl'
                      ? 'Hakbang-hakbang: Paano Kumuha ng System User Access Token mula sa Meta Business Manager'
                      : 'Step-by-step: How to generate a System User Access Token in Meta Business Manager'}
                  </span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {lang === 'tl'
                    ? 'Ang System User Access Token ay isang permanent (never-expiring) token na hindi nakatali sa personal Facebook account. Ito ang inirerekomenda ng Meta para sa mga automated servers at tracking backend.'
                    : 'A System User Access Token is a permanent, never-expiring token tied to your Business Manager rather than a personal profile, ideal for backend automation.'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 bg-slate-800/40 border border-slate-800 rounded-xl p-3.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      {lang === 'tl' ? 'Pumunta sa Meta Business Settings' : 'Navigate to Meta Business Settings'}
                    </div>
                    <p className="text-slate-400">
                      Buksan ang{' '}
                      <a
                        href="https://business.facebook.com/settings"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 underline inline-flex items-center gap-1"
                      >
                        business.facebook.com/settings <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      . Siguraduhing admin ka ng Business Portfolio mo.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-800/40 border border-slate-800 rounded-xl p-3.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      {lang === 'tl' ? 'Gumawa ng System User' : 'Create a System User'}
                    </div>
                    <p className="text-slate-400">
                      Sa kaliwang sidebar: Pumunta sa <strong>Users &gt; System users</strong>. I-click ang <strong>Add</strong>.
                      Pangalanan ito ng (hal. <code className="text-cyan-300">Link-Review-Bot-Server</code>) at piliin ang role na <strong>Admin</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-800/40 border border-slate-800 rounded-xl p-3.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      {lang === 'tl' ? 'Mag-assign ng Assets (Ad Accounts)' : 'Assign Assets (Ad Accounts)'}
                    </div>
                    <p className="text-slate-400">
                      I-click ang <strong>Assign Assets</strong>. Sa tab na <em>Ad Accounts</em>, piliin ang iyong Ad Account at bigyan ito ng <strong>Partial access (Manage campaigns)</strong> o <strong>Full control</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-800/40 border border-slate-800 rounded-xl p-3.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      {lang === 'tl' ? 'I-generate ang Permanent Token at Scopes' : 'Generate Token and Select Scopes'}
                    </div>
                    <p className="text-slate-400 mb-2">
                      I-click ang <strong>Generate new token</strong>. Piliin ang iyong App (o gumawa ng Meta App sa developers.facebook.com). Piliin ang token expiration: <strong>Never (Permanent)</strong>.
                    </p>
                    <div className="bg-slate-900/90 border border-slate-700/60 rounded-lg p-2.5">
                      <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Kinakailangang Permissions (Scopes):
                      </span>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          ads_read
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          ads_management
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          read_insights
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-800/40 border border-slate-800 rounded-xl p-3.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    5
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      {lang === 'tl' ? 'I-save ang Token' : 'Save the Token'}
                    </div>
                    <p className="text-slate-400">
                      Kopyahin ang token (nagsisimula sa <code className="text-cyan-300">EAAG...</code>). Maaari mo itong ilagay sa bawat short link tracking settings o i-set sa <code className="text-amber-300">META_ACCESS_TOKEN</code> sa inyong server environment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bot_detection' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>Meta Review Crawler User-Agent Detection</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Kapag nag-submit ka ng bagong ad sa Meta Ads Manager, nagpapadala ang Meta ng automated reviewer bots bago maging <strong>ACTIVE</strong> ang ad. Awtomatikong dine-detect ng server na ito kapag ang bumisita ay ang Meta Crawler:
                </p>

                <div className="space-y-2 font-mono text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300">
                  <div className="text-cyan-400 font-bold">Mga Opisyal na Meta Crawler User-Agents:</div>
                  <div>• facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)</div>
                  <div>• facebookexternalhit/1.0</div>
                  <div>• Facebot</div>
                  <div>• FacebookBot</div>
                  <div>• Meta-ExternalAgent / Meta-ExternalFetcher</div>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4">
                <div className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Awtomatikong Log Format na sine-save sa Database:</span>
                </div>
                <div className="font-mono text-xs text-emerald-300 bg-slate-950/80 p-2.5 rounded-lg border border-emerald-900/60 my-2">
                  [Meta Bot Reviewed Link - 2026-09-22 23:05:00]
                </div>
                <p className="text-[11px] text-slate-400">
                  Makikita agad sa Admin Dashboard ang badge kung <strong>Reviewed by Meta Crawler</strong> na ang link o <strong>Pending Inspection</strong> pa.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'auto_switch' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Auto-Redirect Rule: Safe Page (Link A) vs Offer/Money Page (Link B)</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Nagbibigay ito ng proteksyon habang sumasailalim sa review ang iyong campaign sa Meta:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="p-3.5 bg-blue-950/30 border border-blue-800/40 rounded-xl">
                    <div className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      <span>Safe Page (Link A)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      100% compliant, white-hat content page o article na walang aggressive claims.
                    </p>
                    <div className="mt-2 text-[10px] text-blue-400 font-medium">
                      Aktibo habang: <strong>PENDING_REVIEW</strong> o binibisita ng Meta Bot.
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
                    <div className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Offer / Money Page (Link B)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ang tunay na landing page, conversion funnel, o target offer para sa mga mamimili.
                    </p>
                    <div className="mt-2 text-[10px] text-emerald-400 font-medium">
                      Awtomatikong lilipat kapag: <strong>ACTIVE (Approved)</strong> na sa Meta!
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-300">
                  💡 <strong>Paano gamitin:</strong> Sa anumang link, i-click ang <strong>Meta Tracker</strong> button, ilagay ang iyong Meta Ad ID, i-toggle ang <strong>Auto-Switch on ACTIVE</strong>, at ilagay ang URL para sa Link A at Link B.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'graph_api' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-xs">Node.js Graph API v20.0 Implementation</span>
                  <button
                    onClick={() => copy(sampleGraphApiCall, 'node-graph')}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white"
                  >
                    {copiedKey === 'node-graph' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'node-graph' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                  {sampleGraphApiCall}
                </pre>
              </div>

              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-xs">cURL Test Command</span>
                  <button
                    onClick={() => copy(sampleCurl, 'curl-graph')}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white"
                  >
                    {copiedKey === 'curl-graph' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'curl-graph' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                  {sampleCurl}
                </pre>
              </div>

              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-xs">Worker / Server Auto-Redirect Engine</span>
                  <button
                    onClick={() => copy(sampleWorkerBotDetection, 'worker-code')}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white"
                  >
                    {copiedKey === 'worker-code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'worker-code' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                  {sampleWorkerBotDetection}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Meta Marketing API v20.0 • Graph API Endpoint</span>
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
