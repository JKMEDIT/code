import React, { useState } from 'react';
import { X, Upload, Link2, Image as ImageIcon, Table as TableIcon, MousePointerClick } from 'lucide-react';
import type { ImageAlign } from '../types/document';

export type ActiveModalType = null | 'link' | 'button' | 'image' | 'table';

interface InsertModalsProps {
  activeModal: ActiveModalType;
  onClose: () => void;
  onInsertLink: (payload: { url: string; text: string; newTab: boolean }) => void;
  onInsertButton: (payload: { url: string; text: string; variant: 'solid' | 'outline'; newTab: boolean }) => void;
  onInsertImage: (payload: { src: string; alt: string; caption: string; width: string; align: ImageAlign }) => void;
  onInsertTable: (payload: { rows: number; cols: number; hasHeader: boolean }) => void;
}

export const InsertModals: React.FC<InsertModalsProps> = ({
  activeModal,
  onClose,
  onInsertLink,
  onInsertButton,
  onInsertImage,
  onInsertTable,
}) => {
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  const [btnUrl, setBtnUrl] = useState('#');
  const [btnText, setBtnText] = useState('Get Started');
  const [btnVariant, setBtnVariant] = useState<'solid' | 'outline'>('solid');
  const [btnNewTab, setBtnNewTab] = useState(false);

  const [imgTab, setImgTab] = useState<'upload' | 'url'>('upload');
  const [imgUrl, setImgUrl] = useState('');
  const [imgAlt, setImgAlt] = useState('');
  const [imgCaption, setImgCaption] = useState('');
  const [imgWidth, setImgWidth] = useState('100%');
  const [imgAlign, setImgAlign] = useState<ImageAlign>('center');
  const [imgError, setImgError] = useState('');

  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(true);

  if (!activeModal) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImgError('Please choose a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }
    setImgError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImgUrl(reader.result);
        if (!imgAlt) {
          setImgAlt(file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Insert ${activeModal}`}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {activeModal === 'link' && <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            {activeModal === 'button' && <MousePointerClick className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            {activeModal === 'image' && <ImageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            {activeModal === 'table' && <TableIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            <span>
              {activeModal === 'link' && 'Insert Hyperlink'}
              {activeModal === 'button' && 'Insert Clickable Button'}
              {activeModal === 'image' && 'Insert Image'}
              {activeModal === 'table' && 'Insert Table'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {activeModal === 'link' && (
          <form
            className="space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!linkUrl.trim()) return;
              onInsertLink({
                url: linkUrl.trim(),
                text: linkText.trim() || linkUrl.trim(),
                newTab: linkNewTab,
              });
              onClose();
            }}
          >
            <div>
              <label htmlFor="fd-link-text" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Display Text
              </label>
              <input
                id="fd-link-text"
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Read documentation"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="fd-link-url" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Destination URL
              </label>
              <input
                id="fd-link-url"
                type="text"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={linkNewTab}
                onChange={(e) => setLinkNewTab(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Open link in a new browser tab
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Insert Link
              </button>
            </div>
          </form>
        )}

        {activeModal === 'button' && (
          <form
            className="space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!btnText.trim() || !btnUrl.trim()) return;
              onInsertButton({
                text: btnText.trim(),
                url: btnUrl.trim(),
                variant: btnVariant,
                newTab: btnNewTab,
              });
              onClose();
            }}
          >
            <div>
              <label htmlFor="fd-btn-text" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Button Label
              </label>
              <input
                id="fd-btn-text"
                type="text"
                required
                value={btnText}
                onChange={(e) => setBtnText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="fd-btn-url" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Target URL or Anchor
              </label>
              <input
                id="fd-btn-url"
                type="text"
                required
                value={btnUrl}
                onChange={(e) => setBtnUrl(e.target.value)}
                placeholder="https://example.com or #section"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Button Style
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBtnVariant('solid')}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    btnVariant === 'solid'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  Filled Accent
                </button>
                <button
                  type="button"
                  onClick={() => setBtnVariant('outline')}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    btnVariant === 'outline'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  Outline Border
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={btnNewTab}
                onChange={(e) => setBtnNewTab(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              Open in new tab
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Insert Button
              </button>
            </div>
          </form>
        )}

        {activeModal === 'image' && (
          <form
            className="space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!imgUrl.trim()) {
                setImgError('Please upload an image or provide an image URL.');
                return;
              }
              onInsertImage({
                src: imgUrl.trim(),
                alt: imgAlt.trim() || 'Article image',
                caption: imgCaption.trim(),
                width: imgWidth,
                align: imgAlign,
              });
              setImgUrl('');
              setImgAlt('');
              setImgCaption('');
              onClose();
            }}
          >
            <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setImgTab('upload')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  imgTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Local Upload
              </button>
              <button
                type="button"
                onClick={() => setImgTab('url')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  imgTab === 'url'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Image URL
              </button>
            </div>

            {imgTab === 'upload' ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-blue-500 dark:border-slate-700 dark:bg-slate-950/60">
                <Upload className="mb-2 h-5 w-5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {imgUrl && imgUrl.startsWith('data:') ? 'Image ready — click to replace' : 'Choose an image from your device'}
                </span>
                <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  PNG, JPG, WebP, or GIF (embedded into ZIP assets on export)
                </span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
              </label>
            ) : (
              <div>
                <label htmlFor="fd-img-url" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Image URL
                </label>
                <input
                  id="fd-img-url"
                  type="text"
                  value={imgUrl}
                  onChange={(e) => {
                    setImgUrl(e.target.value);
                    setImgError('');
                  }}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            )}

            {imgError && <p className="text-xs text-red-600 dark:text-red-400">{imgError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fd-img-alt" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Alt Text (SEO)
                </label>
                <input
                  id="fd-img-alt"
                  type="text"
                  value={imgAlt}
                  onChange={(e) => setImgAlt(e.target.value)}
                  placeholder="Describe the image"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="fd-img-caption" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Caption (Optional)
                </label>
                <input
                  id="fd-img-caption"
                  type="text"
                  value={imgCaption}
                  onChange={(e) => setImgCaption(e.target.value)}
                  placeholder="Figure caption"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fd-img-align" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Alignment
                </label>
                <select
                  id="fd-img-align"
                  value={imgAlign}
                  onChange={(e) => setImgAlign(e.target.value as ImageAlign)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="center">Center</option>
                  <option value="left">Float Left</option>
                  <option value="right">Float Right</option>
                  <option value="full">Full Width</option>
                </select>
              </div>
              <div>
                <label htmlFor="fd-img-width" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Size
                </label>
                <select
                  id="fd-img-width"
                  value={imgWidth}
                  onChange={(e) => setImgWidth(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="100%">100% Width</option>
                  <option value="75%">75% Width</option>
                  <option value="50%">50% Width</option>
                  <option value="35%">35% Width</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Insert Image
              </button>
            </div>
          </form>
        )}

        {activeModal === 'table' && (
          <form
            className="space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              onInsertTable({
                rows: Math.max(1, Math.min(15, tableRows)),
                cols: Math.max(1, Math.min(10, tableCols)),
                hasHeader: tableHasHeader,
              });
              onClose();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fd-table-rows" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Rows
                </label>
                <input
                  id="fd-table-rows"
                  type="number"
                  min={1}
                  max={15}
                  value={tableRows}
                  onChange={(e) => setTableRows(Number(e.target.value) || 3)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="fd-table-cols" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Columns
                </label>
                <input
                  id="fd-table-cols"
                  type="number"
                  min={1}
                  max={10}
                  value={tableCols}
                  onChange={(e) => setTableCols(Number(e.target.value) || 3)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={tableHasHeader}
                onChange={(e) => setTableHasHeader(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              Include header row
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Insert Table
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
