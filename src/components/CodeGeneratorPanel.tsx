import React, { useMemo, useState } from 'react';
import { X, Copy, Check, Download, FolderArchive, FileCode } from 'lucide-react';
import type { NotepadDocument } from '../types/document';
import { generateWebsiteCode } from '../lib/codeGenerator';
import { downloadTextFile, downloadWebsiteZip, slugifyFilename } from '../lib/exportUtils';

interface CodeGeneratorPanelProps {
  open: boolean;
  document: NotepadDocument;
  onClose: () => void;
}

type CodeTabId = 'indexHtml' | 'css' | 'js' | 'standaloneHtml' | 'readmeMd';

export const CodeGeneratorPanel: React.FC<CodeGeneratorPanelProps> = ({
  open,
  document: doc,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<CodeTabId>('indexHtml');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [zipBusy, setZipBusy] = useState(false);

  const generated = useMemo(() => generateWebsiteCode(doc), [doc]);

  if (!open) return null;

  const activeCodeMap: Record<CodeTabId, string> = {
    indexHtml: generated.indexHtml,
    css: generated.css,
    js: generated.js || '// No interactive JavaScript needed for this post.',
    standaloneHtml: generated.standaloneHtml,
    readmeMd: generated.readmeMd,
  };

  const activeCode = activeCodeMap[activeTab];

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Fallback copy via temporary textarea
      const ta = window.document.createElement('textarea');
      ta.value = text;
      window.document.body.appendChild(ta);
      ta.select();
      window.document.execCommand('copy');
      window.document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const handleDownloadStandaloneHtml = () => {
    const slug = slugifyFilename(doc.title);
    downloadTextFile(generated.standaloneHtml, `${slug}.html`, 'text/html;charset=utf-8');
  };

  const handleDownloadZip = async () => {
    setZipBusy(true);
    try {
      await downloadWebsiteZip(doc, generated);
    } finally {
      setZipBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Generated website code"
    >
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Generated Website Code
            </h2>
            <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {generated.assets.length > 0
                ? `${generated.assets.length} local image asset(s) bundled`
                : 'Zero external dependencies'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy('html', generated.standaloneHtml)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {copiedKey === 'html' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedKey === 'html' ? 'Copied HTML' : 'Copy Complete HTML'}
            </button>

            <button
              type="button"
              onClick={() => handleCopy('css', generated.css)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {copiedKey === 'css' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedKey === 'css' ? 'Copied CSS' : 'Copy CSS'}
            </button>

            <button
              type="button"
              onClick={() => handleCopy('js', generated.js)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {copiedKey === 'js' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedKey === 'js' ? 'Copied JS' : 'Copy JS'}
            </button>

            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              Download HTML
            </button>

            <button
              type="button"
              disabled={zipBusy}
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <FolderArchive className="h-3.5 w-3.5" />
              {zipBusy ? 'Packaging ZIP...' : 'Download ZIP'}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close code generator"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
            {(
              [
                ['indexHtml', 'index.html'],
                ['css', 'style.css'],
                ['js', 'script.js'],
                ['standaloneHtml', 'Standalone HTML'],
                ['readmeMd', 'README.md'],
              ] as [CodeTabId, string][]
            ).map(([tabId, label]) => (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={activeTab === tabId}
                onClick={() => setActiveTab(tabId)}
                className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === tabId
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleCopy('active', activeCode)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copiedKey === 'active' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedKey === 'active' ? 'Copied' : 'Copy Current File'}
          </button>
        </div>

        {/* Code Viewer */}
        <div className="studio-scroll flex-1 overflow-auto bg-slate-950 p-5 text-slate-100">
          <pre className="font-mono text-xs leading-relaxed text-slate-100">
            <code>{activeCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
