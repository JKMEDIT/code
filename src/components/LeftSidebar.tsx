import React, { useRef, useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  FileUp,
  FileDown,
  FileCode2,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Table,
  Image as ImageIcon,
  Link2,
  MousePointerClick,
  Space,
  Pencil,
  Check,
} from 'lucide-react';
import type { NotepadDocument } from '../types/document';
import { stripHtmlToText } from '../lib/sanitizer';
import type { ActiveModalType } from './InsertModals';

interface LeftSidebarProps {
  documents: NotepadDocument[];
  activeDocId: string;
  onSelectDocument: (id: string) => void;
  onCreateDocument: () => void;
  onDuplicateDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onRenameDocumentById: (id: string, title: string) => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
  onImportHtmlFile: (file: File) => void;
  onInsertBlock: (blockType: 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'blockquote' | 'pre' | 'hr' | 'spacer') => void;
  onOpenModal: (modal: ActiveModalType) => void;
  onApplyInlineStyle: (style: { fontFamily?: string; fontSize?: string; fontWeight?: string; lineHeight?: string }) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  documents,
  activeDocId,
  onSelectDocument,
  onCreateDocument,
  onDuplicateDocument,
  onDeleteDocument,
  onRenameDocumentById,
  onExportJson,
  onImportJsonFile,
  onImportHtmlFile,
  onInsertBlock,
  onOpenModal,
  onApplyInlineStyle,
}) => {
  const [activeTab, setActiveTab] = useState<'documents' | 'insert'>('documents');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside
      aria-label="Documents and insert tools"
      className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Tab Switcher */}
      <div className="border-b border-slate-200 p-2 dark:border-slate-800">
        <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
            className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'documents'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Documents
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'insert'}
            onClick={() => setActiveTab('insert')}
            className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'insert'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Insert &amp; Format
          </button>
        </div>
      </div>

      {activeTab === 'documents' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="p-3">
            <button
              type="button"
              onClick={onCreateDocument}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New Document
            </button>
          </div>

          <div className="studio-scroll flex-1 space-y-1 overflow-y-auto px-2 pb-3">
            {documents.map((doc) => {
              const isActive = doc.id === activeDocId;
              const wordCount = stripHtmlToText(doc.contentHtml)
                .split(/\s+/)
                .filter(Boolean).length;
              const updated = new Date(doc.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={doc.id}
                  className={`group rounded-lg border p-2.5 transition-colors ${
                    isActive
                      ? 'border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {editingId === doc.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        aria-label={`Rename ${doc.title}`}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingTitle.trim()) {
                              onRenameDocumentById(doc.id, editingTitle.trim());
                            }
                            setEditingId(null);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                        className="w-full rounded border border-blue-500 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none dark:bg-slate-950 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        aria-label="Confirm rename"
                        onClick={() => {
                          if (editingTitle.trim()) {
                            onRenameDocumentById(doc.id, editingTitle.trim());
                          }
                          setEditingId(null);
                        }}
                        className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectDocument(doc.id)}
                      className="block w-full text-left"
                    >
                      <div className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {doc.title}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                        <span>{wordCount} words</span>
                        <span aria-hidden="true">·</span>
                        <span>{updated}</span>
                      </div>
                    </button>
                  )}

                  <div className="mt-2 flex items-center gap-1 border-t border-slate-200/70 pt-1.5 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(doc.id);
                        setEditingTitle(doc.title);
                      }}
                      aria-label={`Rename '${doc.title}'`}
                      title="Rename"
                      className="rounded p-1 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateDocument(doc.id)}
                      aria-label={`Duplicate '${doc.title}'`}
                      title="Duplicate"
                      className="rounded p-1 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {documents.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteDocument(doc.id)}
                        aria-label={`Delete '${doc.title}'`}
                        title="Delete"
                        className="ml-auto rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Import / Export Actions */}
          <div className="space-y-1.5 border-t border-slate-200 p-3 dark:border-slate-800">
            <p className="mb-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Project Files
            </p>
            <button
              type="button"
              onClick={() => htmlInputRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FileCode2 className="h-3.5 w-3.5 text-slate-500" />
              Import HTML File
            </button>
            <button
              type="button"
              onClick={() => jsonInputRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FileUp className="h-3.5 w-3.5 text-slate-500" />
              Import JSON Project
            </button>
            <button
              type="button"
              onClick={onExportJson}
              className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FileDown className="h-3.5 w-3.5 text-slate-500" />
              Export JSON Project
            </button>
            <input
              ref={htmlInputRef}
              type="file"
              accept=".html,.htm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportHtmlFile(file);
                e.target.value = '';
              }}
            />
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportJsonFile(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      ) : (
        <div className="studio-scroll flex-1 space-y-5 overflow-y-auto p-3">
          {/* Block Elements */}
          <div>
            <p className="mb-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Text Blocks
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onInsertBlock('h1')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Heading1 className="h-3.5 w-3.5 text-slate-500" />
                Heading 1
              </button>
              <button
                type="button"
                onClick={() => onInsertBlock('h2')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Heading2 className="h-3.5 w-3.5 text-slate-500" />
                Heading 2
              </button>
              <button
                type="button"
                onClick={() => onInsertBlock('h3')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Heading3 className="h-3.5 w-3.5 text-slate-500" />
                Heading 3
              </button>
              <button
                type="button"
                onClick={() => onInsertBlock('p')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Pilcrow className="h-3.5 w-3.5 text-slate-500" />
                Paragraph
              </button>
              <button
                type="button"
                onClick={() => onInsertBlock('ul')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <List className="h-3.5 w-3.5 text-slate-500" />
                Bullet List
              </button>
              <button
                type="button"
                onClick={() => onInsertBlock('ol')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ListOrdered className="h-3.5 w-3.5 text-slate-500" />
                Numbered
              </button>
              <button
                type="button"
                onClick={() => onInsertBlock('blockquote')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Quote className="h-3.5 w-3.5 text-slate-500" />
                Quote
              </button>
              <button
                type="button"
                onClick={() => onInsertBlock('pre')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Code className="h-3.5 w-3.5 text-slate-500" />
                Code Block
              </button>
            </div>
          </div>

          {/* Media & Components */}
          <div>
            <p className="mb-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Media &amp; Elements
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onOpenModal('image')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                Image
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('table')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Table className="h-3.5 w-3.5 text-slate-500" />
                Table
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('link')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Link2 className="h-3.5 w-3.5 text-slate-500" />
                Hyperlink
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('button')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <MousePointerClick className="h-3.5 w-3.5 text-slate-500" />
                CTA Button
              </button>
              <button
                type="button"
                onClick={() => onInsertBlock('hr')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Minus className="h-3.5 w-3.5 text-slate-500" />
                Divider
              </button>
              <button
                type="button"
                onClick={() => onInsertBlock('spacer')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Space className="h-3.5 w-3.5 text-slate-500" />
                Spacer
              </button>
            </div>
          </div>

          {/* Selection Text Style */}
          <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Selection Formatting
            </p>
            <div>
              <label htmlFor="fd-sel-font" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                Inline Font Size
              </label>
              <select
                id="fd-sel-font"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onApplyInlineStyle({ fontSize: e.target.value });
                    e.target.value = '';
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="">Apply size to selection...</option>
                <option value="14px">14px (Small)</option>
                <option value="16px">16px (Base)</option>
                <option value="18px">18px (Lead)</option>
                <option value="22px">22px (Subhead)</option>
                <option value="28px">28px (Large)</option>
                <option value="36px">36px (Display)</option>
              </select>
            </div>

            <div>
              <label htmlFor="fd-sel-weight" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                Inline Weight
              </label>
              <select
                id="fd-sel-weight"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onApplyInlineStyle({ fontWeight: e.target.value });
                    e.target.value = '';
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="">Apply weight to selection...</option>
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
              </select>
            </div>

            <div>
              <label htmlFor="fd-sel-leading" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                Paragraph Line Spacing
              </label>
              <select
                id="fd-sel-leading"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onApplyInlineStyle({ lineHeight: e.target.value });
                    e.target.value = '';
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="">Apply line spacing...</option>
                <option value="1.3">Compact (1.3)</option>
                <option value="1.5">Normal (1.5)</option>
                <option value="1.75">Relaxed (1.75)</option>
                <option value="2.0">Double (2.0)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
