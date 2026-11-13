import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DesignSettings,
  DeviceViewport,
  NotepadDocument,
  SeoMetadata,
  WorkspaceViewMode,
} from './types/document';
import {
  createBlankDocument,
  duplicateDocumentRecord,
  loadActiveDocumentId,
  loadAppTheme,
  loadDocumentsFromStorage,
  parseDocumentFromHtmlFile,
  parseDocumentFromJson,
  saveActiveDocumentId,
  saveAppTheme,
  saveDocumentsToStorage,
  serializeDocumentToJson,
} from './lib/storage';
import { downloadTextFile, slugifyFilename } from './lib/exportUtils';
import { escapeAttr, escapeHtml } from './lib/sanitizer';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RichNotepadEditor, type RichNotepadEditorHandle } from './components/RichNotepadEditor';
import { LivePreviewPane } from './components/LivePreviewPane';
import { RightDesignSidebar } from './components/RightDesignSidebar';
import { InsertModals, type ActiveModalType } from './components/InsertModals';
import { CodeGeneratorPanel } from './components/CodeGeneratorPanel';

export default function App() {
  const [documents, setDocuments] = useState<NotepadDocument[]>(() => loadDocumentsFromStorage());
  const [activeDocId, setActiveDocId] = useState<string>(() =>
    loadActiveDocumentId(loadDocumentsFromStorage())
  );
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>(() => loadAppTheme());
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('split');
  const [deviceViewport, setDeviceViewport] = useState<DeviceViewport>('desktop');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1100 : true
  );
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true
  );
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState('Saved locally');
  const [notice, setNotice] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  // Undo / Redo stacks for HTML content
  const [historyMap, setHistoryMap] = useState<
    Record<string, { past: string[]; future: string[] }>
  >({});

  const editorRef = useRef<RichNotepadEditorHandle>(null);

  const activeDoc = useMemo(() => {
    return documents.find((d) => d.id === activeDocId) ?? documents[0];
  }, [documents, activeDocId]);

  const showNotice = useCallback((text: string, type: 'info' | 'error' = 'info') => {
    setNotice({ type, text });
    setTimeout(() => {
      setNotice((curr) => (curr?.text === text ? null : curr));
    }, 3200);
  }, []);

  // Sync dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', appTheme === 'dark');
    saveAppTheme(appTheme);
  }, [appTheme]);

  // Persist documents & active document ID
  useEffect(() => {
    saveDocumentsToStorage(documents);
    setSaveLabel('Saved locally');
  }, [documents]);

  useEffect(() => {
    if (activeDoc?.id) {
      saveActiveDocumentId(activeDoc.id);
    }
  }, [activeDoc?.id]);

  // Responsive mobile view & sidebar collapse on viewport resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode((prev) => (prev === 'split' ? 'editor' : prev));
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      } else if (window.innerWidth < 1100) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateActiveDocument = useCallback(
    (updater: (doc: NotepadDocument) => NotepadDocument, recordContentHistory = false) => {
      if (!activeDoc) return;
      setSaveLabel('Saving...');
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id !== activeDoc.id) return d;
          const updated = updater(d);
          if (recordContentHistory && updated.contentHtml !== d.contentHtml) {
            setHistoryMap((h) => {
              const entry = h[d.id] ?? { past: [], future: [] };
              const nextPast = [...entry.past, d.contentHtml].slice(-60);
              return {
                ...h,
                [d.id]: { past: nextPast, future: [] },
              };
            });
          }
          return { ...updated, updatedAt: new Date().toISOString() };
        })
      );
    },
    [activeDoc]
  );

  const activeHistory = activeDoc ? historyMap[activeDoc.id] : undefined;
  const canUndo = Boolean(activeHistory && activeHistory.past.length > 0);
  const canRedo = Boolean(activeHistory && activeHistory.future.length > 0);

  const handleUndo = useCallback(() => {
    if (!activeDoc) return;
    const entry = historyMap[activeDoc.id];
    if (!entry || entry.past.length === 0) return;

    const previousHtml = entry.past[entry.past.length - 1];
    const nextPast = entry.past.slice(0, -1);
    const nextFuture = [activeDoc.contentHtml, ...entry.future].slice(0, 60);

    setHistoryMap((h) => ({
      ...h,
      [activeDoc.id]: { past: nextPast, future: nextFuture },
    }));

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id
          ? { ...d, contentHtml: previousHtml, updatedAt: new Date().toISOString() }
          : d
      )
    );
  }, [activeDoc, historyMap]);

  const handleRedo = useCallback(() => {
    if (!activeDoc) return;
    const entry = historyMap[activeDoc.id];
    if (!entry || entry.future.length === 0) return;

    const nextHtml = entry.future[0];
    const nextFuture = entry.future.slice(1);
    const nextPast = [...entry.past, activeDoc.contentHtml].slice(-60);

    setHistoryMap((h) => ({
      ...h,
      [activeDoc.id]: { past: nextPast, future: nextFuture },
    }));

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id
          ? { ...d, contentHtml: nextHtml, updatedAt: new Date().toISOString() }
          : d
      )
    );
  }, [activeDoc, historyMap]);

  // Global keyboard undo/redo shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (canUndo) {
          e.preventDefault();
          handleUndo();
        }
      } else if (
        (e.key.toLowerCase() === 'z' && e.shiftKey) ||
        e.key.toLowerCase() === 'y'
      ) {
        if (canRedo) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canUndo, canRedo, handleUndo, handleRedo]);

  // Document CRUD
  const handleCreateDocument = () => {
    const next = createBlankDocument(`Untitled Note ${documents.length + 1}`);
    setDocuments((prev) => [next, ...prev]);
    setActiveDocId(next.id);
    showNotice('Created new document.');
  };

  const handleDuplicateDocument = (id: string) => {
    const source = documents.find((d) => d.id === id);
    if (!source) return;
    const copy = duplicateDocumentRecord(source);
    setDocuments((prev) => [copy, ...prev]);
    setActiveDocId(copy.id);
    showNotice(`Duplicated "${source.title}".`);
  };

  const handleDeleteDocument = (id: string) => {
    if (documents.length <= 1) return;
    const target = documents.find((d) => d.id === id);
    const remaining = documents.filter((d) => d.id !== id);
    setDocuments(remaining);
    if (activeDocId === id && remaining[0]) {
      setActiveDocId(remaining[0].id);
    }
    if (target) {
      showNotice(`Deleted "${target.title}".`);
    }
  };

  const handleRenameDocumentById = (id: string, title: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, title, updatedAt: new Date().toISOString() } : d
      )
    );
  };

  // JSON & HTML Import/Export
  const handleExportJson = () => {
    if (!activeDoc) return;
    const json = serializeDocumentToJson(activeDoc);
    downloadTextFile(
      json,
      `${slugifyFilename(activeDoc.title)}.foliodraft.json`,
      'application/json;charset=utf-8'
    );
    showNotice('Exported JSON project file.');
  };

  const handleImportJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') throw new Error('Empty file');
        const imported = parseDocumentFromJson(reader.result);
        setDocuments((prev) => [imported, ...prev]);
        setActiveDocId(imported.id);
        showNotice(`Imported project "${imported.title}".`);
      } catch {
        showNotice('Could not parse JSON project file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImportHtmlFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') throw new Error('Empty file');
        const fallbackTitle = file.name.replace(/\.html?$/i, '') || 'Imported HTML';
        const imported = parseDocumentFromHtmlFile(reader.result, fallbackTitle);
        setDocuments((prev) => [imported, ...prev]);
        setActiveDocId(imported.id);
        showNotice(`Imported HTML into "${imported.title}".`);
      } catch {
        showNotice('Could not import HTML file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Block & Element Insertion
  const handleInsertBlock = (
    blockType: 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'blockquote' | 'pre' | 'hr' | 'spacer'
  ) => {
    if (viewMode === 'preview') setViewMode('split');
    const snippets: Record<typeof blockType, string> = {
      h1: '<h1>New Heading 1</h1><p></p>',
      h2: '<h2>New Section Heading</h2><p></p>',
      h3: '<h3>Subheading</h3><p></p>',
      p: '<p>New paragraph text...</p>',
      ul: '<ul><li>First list item</li><li>Second list item</li></ul><p></p>',
      ol: '<ol><li>Step one</li><li>Step two</li></ol><p></p>',
      blockquote: '<blockquote><p>Notable quote or callout text.</p></blockquote><p></p>',
      pre: '<pre><code>// Enter code snippet here</code></pre><p></p>',
      hr: '<hr /><p></p>',
      spacer: '<div data-spacer="true" style="height: 32px;"></div><p></p>',
    };
    editorRef.current?.insertHtmlAtCursor(snippets[blockType]);
  };

  if (!activeDoc) return null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopBar
        documentTitle={activeDoc.title}
        onRenameDocument={(title) => handleRenameDocumentById(activeDoc.id, title)}
        saveLabel={saveLabel}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        deviceViewport={deviceViewport}
        onChangeDeviceViewport={setDeviceViewport}
        appTheme={appTheme}
        onToggleAppTheme={() => setAppTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        onToggleLeftSidebar={() => {
          setLeftSidebarOpen((v) => {
            const next = !v;
            if (next && window.innerWidth < 1024) setRightSidebarOpen(false);
            return next;
          });
        }}
        onToggleRightSidebar={() => {
          setRightSidebarOpen((v) => {
            const next = !v;
            if (next && window.innerWidth < 1024) setLeftSidebarOpen(false);
            return next;
          });
        }}
        onOpenCodeGenerator={() => setCodePanelOpen(true)}
      />

      {/* Mobile Compact Mode Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-1.5 lg:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
          {(['editor', 'preview'] as WorkspaceViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
                viewMode === mode
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="rounded px-2 py-1 text-xs font-medium text-slate-600 disabled:opacity-40 dark:text-slate-300"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="rounded px-2 py-1 text-xs font-medium text-slate-600 disabled:opacity-40 dark:text-slate-300"
          >
            Redo
          </button>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Mobile Backdrop for Drawer Sidebars */}
        {(leftSidebarOpen || rightSidebarOpen) && (
          <div
            aria-hidden="true"
            onClick={() => {
              setLeftSidebarOpen(false);
              setRightSidebarOpen(false);
            }}
            className="fixed inset-0 top-14 z-20 bg-slate-950/40 md:hidden"
          />
        )}

        {/* Left Sidebar */}
        {leftSidebarOpen && (
          <div className="fixed inset-y-14 left-0 z-30 flex md:static md:inset-auto">
            <LeftSidebar
              documents={documents}
              activeDocId={activeDoc.id}
              onSelectDocument={(id) => {
                setActiveDocId(id);
                if (window.innerWidth < 768) setLeftSidebarOpen(false);
              }}
              onCreateDocument={handleCreateDocument}
              onDuplicateDocument={handleDuplicateDocument}
              onDeleteDocument={handleDeleteDocument}
              onRenameDocumentById={handleRenameDocumentById}
              onExportJson={handleExportJson}
              onImportJsonFile={handleImportJsonFile}
              onImportHtmlFile={handleImportHtmlFile}
              onInsertBlock={handleInsertBlock}
              onOpenModal={(m) => setActiveModal(m)}
              onApplyInlineStyle={(style) =>
                editorRef.current?.applyInlineStyleToSelection(style)
              }
            />
          </div>
        )}

        {/* Center Split / Editor / Preview Workspace */}
        <main className="flex min-w-0 flex-1 overflow-hidden">
          {viewMode !== 'preview' && (
            <section
              aria-label="Notepad editor workspace"
              className={`flex min-w-0 flex-1 flex-col ${
                viewMode === 'split'
                  ? 'border-r border-slate-200 dark:border-slate-800'
                  : ''
              }`}
            >
              <RichNotepadEditor
                ref={editorRef}
                contentHtml={activeDoc.contentHtml}
                design={activeDoc.design}
                onChange={(nextHtml) =>
                  updateActiveDocument((d) => ({ ...d, contentHtml: nextHtml }), true)
                }
                onOpenModal={(m) => setActiveModal(m)}
              />
            </section>
          )}

          {viewMode !== 'editor' && (
            <section
              aria-label="Live webpage preview workspace"
              className="flex min-w-0 flex-1 flex-col"
            >
              <LivePreviewPane
                document={activeDoc}
                deviceViewport={deviceViewport}
                onChangeDeviceViewport={setDeviceViewport}
              />
            </section>
          )}
        </main>

        {/* Right Design Customization Sidebar */}
        {rightSidebarOpen && (
          <div className="fixed inset-y-14 right-0 z-30 flex md:static md:inset-auto">
            <RightDesignSidebar
              design={activeDoc.design}
              seo={activeDoc.seo}
              onChangeDesign={(nextDesign: DesignSettings) =>
                updateActiveDocument((d) => ({ ...d, design: nextDesign }))
              }
              onChangeSeo={(nextSeo: SeoMetadata) =>
                updateActiveDocument((d) => ({ ...d, seo: nextSeo }))
              }
            />
          </div>
        )}
      </div>

      {/* Inline Notification Banner */}
      {notice && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-4 py-2 text-xs font-medium shadow-lg ${
            notice.type === 'error'
              ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
              : 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Insert Modals */}
      <InsertModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onInsertLink={({ url, text, newTab }) => {
          const targetAttr = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
          editorRef.current?.insertHtmlAtCursor(
            `<a href="${escapeAttr(url)}"${targetAttr}>${escapeHtml(text)}</a>`
          );
        }}
        onInsertButton={({ url, text, variant, newTab }) => {
          const targetAttr = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
          editorRef.current?.insertHtmlAtCursor(
            `<p><a href="${escapeAttr(url)}" data-cta-button="true" data-btn-variant="${variant}"${targetAttr}>${escapeHtml(text)}</a></p>`
          );
        }}
        onInsertImage={({ src, alt, caption, width, align }) => {
          const capHtml = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';
          editorRef.current?.insertHtmlAtCursor(
            `<figure data-align="${align}"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="width: ${escapeAttr(width)};" />${capHtml}</figure><p></p>`
          );
        }}
        onInsertTable={({ rows, cols, hasHeader }) => {
          let html = '<div class="table-scroll"><table>';
          if (hasHeader) {
            html += '<thead><tr>';
            for (let c = 1; c <= cols; c++) {
              html += `<th>Header ${c}</th>`;
            }
            html += '</tr></thead>';
          }
          html += '<tbody>';
          const bodyRows = hasHeader ? Math.max(1, rows - 1) : rows;
          for (let r = 1; r <= bodyRows; r++) {
            html += '<tr>';
            for (let c = 1; c <= cols; c++) {
              html += `<td>Cell ${r}.${c}</td>`;
            }
            html += '</tr>';
          }
          html += '</tbody></table></div><p></p>';
          editorRef.current?.insertHtmlAtCursor(html);
        }}
      />

      {/* Code Generator Panel */}
      <CodeGeneratorPanel
        open={codePanelOpen}
        document={activeDoc}
        onClose={() => setCodePanelOpen(false)}
      />
    </div>
  );
}
