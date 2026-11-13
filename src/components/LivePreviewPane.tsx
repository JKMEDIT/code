import React, { useMemo } from 'react';
import type { DeviceViewport, NotepadDocument } from '../types/document';
import { generateWebsiteCode } from '../lib/codeGenerator';

interface LivePreviewPaneProps {
  document: NotepadDocument;
  deviceViewport: DeviceViewport;
  onChangeDeviceViewport: (device: DeviceViewport) => void;
}

const VIEWPORT_WIDTHS: Record<DeviceViewport, { width: string; label: string }> = {
  desktop: { width: '100%', label: 'Desktop (Fluid 100%)' },
  laptop: { width: '1280px', label: 'Laptop (1280px)' },
  tablet: { width: '768px', label: 'Tablet (768px)' },
  mobile: { width: '390px', label: 'Mobile (390px)' },
};

export const LivePreviewPane: React.FC<LivePreviewPaneProps> = ({
  document: doc,
  deviceViewport,
  onChangeDeviceViewport,
}) => {
  const baseHref = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;

  const generated = useMemo(() => {
    return generateWebsiteCode(doc, baseHref);
  }, [doc, baseHref]);

  const viewportMeta = VIEWPORT_WIDTHS[deviceViewport];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-100 dark:bg-slate-950">
      {/* Preview Subheader */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Live Webpage Preview</span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            ·
          </span>
          <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
            {viewportMeta.label}
          </span>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {(['desktop', 'tablet', 'mobile'] as DeviceViewport[]).map((vp) => (
            <button
              key={vp}
              type="button"
              onClick={() => onChangeDeviceViewport(vp)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ${
                deviceViewport === vp
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {vp}
            </button>
          ))}
        </div>
      </div>

      {/* Sandboxed Isolated Preview Container */}
      <div className="studio-scroll flex-1 overflow-auto p-3 sm:p-5">
        <div
          className="mx-auto h-full min-h-[560px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 dark:border-slate-800"
          style={{
            width: viewportMeta.width,
            maxWidth: deviceViewport === 'laptop' ? 'none' : '100%',
          }}
        >
          <iframe
            title="Live Webpage Preview"
            srcDoc={generated.standaloneHtml}
            sandbox="allow-scripts allow-same-origin"
            className="h-full min-h-[560px] w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
