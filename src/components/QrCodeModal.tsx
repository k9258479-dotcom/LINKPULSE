import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, X, Copy, Check, ExternalLink } from 'lucide-react';
import type { LinkItem } from '../types';
import type { Lang } from '../i18n';

interface Props {
  link: LinkItem | null;
  origin: string;
  lang?: Lang;
  onClose: () => void;
}

export const QrCodeModal: React.FC<Props> = ({ link, origin, lang = 'en', onClose }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!link) return null;

  const fullUrl = `${origin}/${link.slug}`;

  useEffect(() => {
    QRCode.toDataURL(fullUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error(err));
  }, [fullUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode-${link.slug}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'tl' ? `QR Code para sa /${link.slug}` : `QR Code for /${link.slug}`}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'tl'
                ? 'I-scan upang ma-redirect papunta sa Target URL'
                : 'Scan to redirect immediately to the Target URL'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center my-6">
          <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
            {dataUrl ? (
              <img src={dataUrl} alt={`QR Code for ${link.slug}`} className="w-56 h-56 object-contain" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-500">
                Generating QR...
              </div>
            )}
          </div>

          <div className="mt-4 w-full bg-slate-800/80 rounded-lg p-2.5 flex items-center justify-between border border-slate-700/60">
            <span className="font-mono text-xs text-cyan-400 truncate pr-2">{fullUrl}</span>
            <button
              onClick={handleCopy}
              className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="mt-2 text-xs text-slate-400 text-center">
            Target Destination: <span className="text-slate-300 font-mono">{link.targetUrl}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-xl transition text-sm shadow-md shadow-blue-900/30"
          >
            <Download className="w-4 h-4" />
            {lang === 'tl' ? 'I-download ang QR (PNG)' : 'Download QR (PNG)'}
          </button>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            title={lang === 'tl' ? "Buksan ang Link sa bagong tab" : "Open short link in new tab"}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
