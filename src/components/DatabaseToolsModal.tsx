import React, { useState } from 'react';
import { X, Database, Download, Upload, Copy, Check, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
  onClose: () => void;
  onRefresh: () => void;
}

export const DatabaseToolsModal: React.FC<Props> = ({ lang, onClose, onRefresh }) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownload = (format: 'json' | 'sqlite' | 'cloudflare') => {
    window.open(`/api/export/${format}`, '_blank');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportStatus(null);
      const text = await file.text();
      const parsed = JSON.parse(text);

      const items = Array.isArray(parsed) ? parsed : Object.values(parsed.links || {});

      const res = await fetch('/api/import/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      });
      const data = await res.json();

      if (data.success) {
        setImportStatus(`Matagumpay na na-import ang ${data.imported} links! (${data.skipped} skipped)`);
        onRefresh();
      } else {
        setImportStatus(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setImportStatus(`Failed to read file: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Database & Persistence Tools</h3>
              <p className="text-xs text-slate-400">
                {lang === 'tl'
                  ? 'Lightweight Key-Value store, SQLite schema, at JSON backup/restore'
                  : 'Manage local KV storage, download SQLite schema, and backup/restore'}
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

        {/* Body */}
        <div className="overflow-y-auto flex-1 pr-1 py-4 space-y-4 text-sm">
          {/* Storage status banner */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Database Engine:</span>
                <span className="ml-2 text-xs font-semibold text-emerald-400">JSON Key-Value Store (data/links.json)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Atomic Writes Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'tl'
                ? 'Naka-save ang lahat ng iyong permanent short links at click logs sa server storage nang awtomatiko sa tuwing may pagbabago o click.'
                : 'All your permanent short links and click statistics are securely stored with atomic writes on every click or update.'}
            </p>
          </div>

          {/* Export Options */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {lang === 'tl' ? 'I-export o I-download ang Database:' : 'Export or Backup Database:'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* SQLite */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-white text-sm">SQLite & PostgreSQL Script</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {lang === 'tl'
                      ? 'May kasamang CREATE TABLE at INSERT INTO commands para sa SQLite, Supabase, o Cloud SQL.'
                      : 'Includes CREATE TABLE and INSERT INTO commands ready for SQLite, Supabase, or PostgreSQL.'}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload('sqlite')}
                  className="flex items-center justify-center gap-1.5 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium py-2 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  {lang === 'tl' ? 'I-download ang .sql Script' : 'Download .sql Script'}
                </button>
              </div>

              {/* JSON Backup */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-white text-sm">JSON KV Backup</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {lang === 'tl'
                      ? 'I-save ang raw JSON data ng lahat ng static short links mo para sa mabilisang restore o transfer.'
                      : 'Save raw JSON data of all your static short links for instant backup and easy restores.'}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload('json')}
                  className="flex items-center justify-center gap-1.5 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium py-2 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  {lang === 'tl' ? 'I-download ang links-backup.json' : 'Download links-backup.json'}
                </button>
              </div>
            </div>
          </div>

          {/* Import JSON */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {lang === 'tl' ? 'Mag-import ng Links mula sa JSON File:' : 'Import Links from JSON File:'}
            </h4>
            <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center bg-slate-900/40">
              <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-medium">
                {lang === 'tl'
                  ? 'Pumili ng JSON backup file upang i-restore ang links'
                  : 'Select a JSON backup file to restore or seed links'}
              </p>
              <label className="mt-3 inline-block cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-1.5 px-4 rounded-lg transition">
                <span>{lang === 'tl' ? 'Pumili ng JSON File' : 'Select JSON File'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </div>
            {importStatus && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
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
