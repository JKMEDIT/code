import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  Code,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  MousePointerClick,
  Highlighter,
  Palette,
  Trash2,
} from 'lucide-react';
import type { DesignSettings, ImageAlign } from '../types/document';
import { getFontFamilyCss } from '../lib/themes';
import { stripHtmlToText } from '../lib/sanitizer';
import type { ActiveModalType } from './InsertModals';

export interface RichNotepadEditorHandle {
  focus: () => void;
  insertHtmlAtCursor: (html: string) => void;
  applyInlineStyleToSelection: (style: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
  }) => void;
}

interface RichNotepadEditorProps {
  contentHtml: string;
  design: DesignSettings;
  onChange: (nextHtml: string) => void;
  onOpenModal: (modal: ActiveModalType) => void;
}

interface SelectedImageState {
  el: HTMLImageElement;
  alt: string;
  caption: string;
  width: string;
  align: ImageAlign;
}

export const RichNotepadEditor = React.forwardRef<RichNotepadEditorHandle, RichNotepadEditorProps>(
  ({ contentHtml, design, onChange, onOpenModal }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const isInternalEditRef = useRef(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedImage, setSelectedImage] = useState<SelectedImageState | null>(null);
    const [textColor, setTextColor] = useState('#2563eb');
    const [highlightColor, setHighlightColor] = useState('#fef08a');

    // Sync external content changes (e.g. switching documents, undo/redo) into DOM
    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      if (isInternalEditRef.current) {
        isInternalEditRef.current = false;
        return;
      }
      if (el.innerHTML !== contentHtml) {
        el.innerHTML = contentHtml;
      }
      setSelectedImage(null);
    }, [contentHtml]);

    const saveSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    };

    const restoreSelection = () => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      if (!sel) return;
      if (savedRangeRef.current && el.contains(savedRangeRef.current.commonAncestorContainer)) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    };

    const emitChange = () => {
      const el = editorRef.current;
      if (!el) return;
      isInternalEditRef.current = true;
      onChange(el.innerHTML);
    };

    const exec = (command: string, value?: string) => {
      restoreSelection();
      document.execCommand(command, false, value);
      saveSelection();
      emitChange();
    };

    const insertHtmlAtCursor = (html: string) => {
      const editorEl = editorRef.current;
      if (!editorEl) return;

      const isBlockInsert = /^\s*<(div|table|figure|pre|hr|h[1-6]|ul|ol|blockquote|p)\b/i.test(html);
      const hasSavedRange =
        savedRangeRef.current && editorEl.contains(savedRangeRef.current.commonAncestorContainer);

      if (!hasSavedRange) {
        editorEl.focus();
        editorEl.insertAdjacentHTML('beforeend', html);
        emitChange();
        return;
      }

      restoreSelection();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorEl.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const template = document.createElement('template');
        template.innerHTML = html;
        const frag = template.content;
        const lastNode = frag.lastChild;

        if (isBlockInsert) {
          // Find top-level block child inside editorEl so we never nest <table>/<figure>/<pre> inside <h1> or <p>
          let topBlock: Node | null = range.startContainer;
          while (topBlock && topBlock.parentNode !== editorEl) {
            topBlock = topBlock.parentNode;
          }
          if (topBlock && topBlock.parentNode === editorEl) {
            const afterNode = topBlock.nextSibling;
            editorEl.insertBefore(frag, afterNode);
          } else {
            editorEl.appendChild(frag);
          }
        } else {
          range.deleteContents();
          range.insertNode(frag);
        }

        if (lastNode) {
          const nextRange = document.createRange();
          nextRange.setStartAfter(lastNode);
          nextRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(nextRange);
          savedRangeRef.current = nextRange.cloneRange();
        }
      } else {
        editorEl.insertAdjacentHTML('beforeend', html);
      }
      emitChange();
    };

    useImperativeHandle(ref, () => ({
      focus: () => editorRef.current?.focus(),
      insertHtmlAtCursor,
      applyInlineStyleToSelection: (style) => {
        restoreSelection();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);

        if (style.lineHeight) {
          let node: Node | null = range.startContainer;
          while (node && node !== editorRef.current) {
            if (
              node instanceof HTMLElement &&
              /^(P|H1|H2|H3|H4|LI|BLOCKQUOTE|DIV)$/i.test(node.tagName)
            ) {
              node.style.lineHeight = style.lineHeight;
              emitChange();
              return;
            }
            node = node.parentNode;
          }
        }

        if (!range.collapsed) {
          const span = document.createElement('span');
          if (style.fontFamily) span.style.fontFamily = style.fontFamily;
          if (style.fontSize) span.style.fontSize = style.fontSize;
          if (style.fontWeight) span.style.fontWeight = style.fontWeight;
          try {
            range.surroundContents(span);
          } catch {
            const frag = range.extractContents();
            span.appendChild(frag);
            range.insertNode(span);
          }
          emitChange();
        }
      },
    }));

    const handleFormatBlockChange = (tag: string) => {
      if (!tag) return;
      if (tag === 'pre') {
        insertHtmlAtCursor('<pre><code>// Enter code snippet here</code></pre><p></p>');
      } else {
        exec('formatBlock', tag);
      }
    };

    const handleDropFiles = (files: FileList) => {
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') || 'Uploaded image';
            insertHtmlAtCursor(
              `<figure data-align="center"><img src="${reader.result}" alt="${alt}" style="width: 100%;" /><figcaption>${alt}</figcaption></figure><p></p>`
            );
          }
        };
        reader.readAsDataURL(file);
      });
    };

    const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
      saveSelection();
      const target = e.target as HTMLElement;
      editorRef.current?.querySelectorAll('img.fd-img-selected').forEach((img) => {
        img.classList.remove('fd-img-selected');
      });

      if (target instanceof HTMLImageElement) {
        target.classList.add('fd-img-selected');
        const figure = target.closest('figure');
        const figcaption = figure?.querySelector('figcaption');
        const alignAttr = (figure?.getAttribute('data-align') as ImageAlign) || 'center';
        setSelectedImage({
          el: target,
          alt: target.getAttribute('alt') || '',
          caption: figcaption?.textContent || '',
          width: target.style.width || '100%',
          align: alignAttr,
        });
      } else {
        setSelectedImage(null);
      }
    };

    const updateSelectedImage = (patch: Partial<Omit<SelectedImageState, 'el'>>) => {
      if (!selectedImage) return;
      const { el } = selectedImage;
      const next = { ...selectedImage, ...patch };

      if (patch.alt !== undefined) {
        el.setAttribute('alt', patch.alt);
      }
      if (patch.width !== undefined) {
        el.style.width = patch.width;
      }

      let figure = el.closest('figure');
      if (patch.align !== undefined) {
        if (!figure) {
          figure = document.createElement('figure');
          el.parentNode?.insertBefore(figure, el);
          figure.appendChild(el);
        }
        figure.setAttribute('data-align', patch.align);
      }

      if (patch.caption !== undefined) {
        if (!figure) {
          figure = document.createElement('figure');
          el.parentNode?.insertBefore(figure, el);
          figure.appendChild(el);
        }
        let cap = figure.querySelector('figcaption');
        if (patch.caption.trim()) {
          if (!cap) {
            cap = document.createElement('figcaption');
            figure.appendChild(cap);
          }
          cap.textContent = patch.caption;
        } else if (cap) {
          cap.remove();
        }
      }

      setSelectedImage(next);
      emitChange();
    };

    const removeSelectedImage = () => {
      if (!selectedImage) return;
      const figure = selectedImage.el.closest('figure');
      if (figure) {
        figure.remove();
      } else {
        selectedImage.el.remove();
      }
      setSelectedImage(null);
      emitChange();
    };

    const plainText = stripHtmlToText(contentHtml);
    const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    const charCount = plainText.length;
    const isEmpty = !plainText && !/<img|<table|<hr/i.test(contentHtml);

    const headingFontCss = getFontFamilyCss(design.headingFont);
    const bodyFontCss = getFontFamilyCss(design.bodyFont);

    return (
      <div className="flex min-h-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950">
        {/* Rich Formatting Ribbon */}
        <div
          className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900"
          role="toolbar"
          aria-label="Rich text formatting toolbar"
        >
          <select
            aria-label="Block format"
            defaultValue="p"
            onChange={(e) => {
              handleFormatBlockChange(e.target.value);
              e.target.value = 'p';
            }}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Quote</option>
            <option value="pre">Code Block</option>
          </select>

          <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('bold')}
            aria-label="Bold"
            title="Bold (Ctrl+B)"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('italic')}
            aria-label="Italic"
            title="Italic (Ctrl+I)"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('underline')}
            aria-label="Underline"
            title="Underline (Ctrl+U)"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('strikeThrough')}
            aria-label="Strikethrough"
            title="Strikethrough"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Text Color & Highlight */}
          <label
            title="Text Color"
            className="flex h-8 cursor-pointer items-center gap-1 rounded-md px-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Palette className="h-3.5 w-3.5" />
            <input
              type="color"
              aria-label="Text color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                exec('foreColor', e.target.value);
              }}
              className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
          <label
            title="Highlight Color"
            className="flex h-8 cursor-pointer items-center gap-1 rounded-md px-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Highlighter className="h-3.5 w-3.5" />
            <input
              type="color"
              aria-label="Highlight color"
              value={highlightColor}
              onChange={(e) => {
                setHighlightColor(e.target.value);
                exec('hiliteColor', e.target.value);
              }}
              className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>

          <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Alignment */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('justifyLeft')}
            aria-label="Align left"
            title="Align Left"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('justifyCenter')}
            aria-label="Align center"
            title="Align Center"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('justifyRight')}
            aria-label="Align right"
            title="Align Right"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('justifyFull')}
            aria-label="Justify text"
            title="Justify"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Lists & Indent */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('insertUnorderedList')}
            aria-label="Bullet list"
            title="Bullet List"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('insertOrderedList')}
            aria-label="Numbered list"
            title="Numbered List"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('indent')}
            aria-label="Increase indent"
            title="Indent"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Indent className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('outdent')}
            aria-label="Decrease indent"
            title="Outdent"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Outdent className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Quick Inserts */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('formatBlock', 'blockquote')}
            aria-label="Insert blockquote"
            title="Quote"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertHtmlAtCursor('<pre><code>// code snippet</code></pre><p></p>')}
            aria-label="Insert code block"
            title="Code Block"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => onOpenModal('link')}
            aria-label="Insert hyperlink"
            title="Insert Link"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => onOpenModal('button')}
            aria-label="Insert clickable button"
            title="Insert CTA Button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <MousePointerClick className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => onOpenModal('image')}
            aria-label="Insert image"
            title="Insert Image"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => onOpenModal('table')}
            aria-label="Insert table"
            title="Insert Table"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <TableIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertHtmlAtCursor('<hr /><p></p>')}
            aria-label="Insert horizontal divider"
            title="Horizontal Divider"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Selected Image Inspector Bar */}
        {selectedImage && (
          <div className="flex flex-wrap items-center gap-2 border-b border-blue-200 bg-blue-50/90 px-3 py-2 text-xs dark:border-blue-900/60 dark:bg-blue-950/50">
            <span className="font-semibold text-blue-900 dark:text-blue-200">Image Properties:</span>
            <select
              aria-label="Image width"
              value={selectedImage.width}
              onChange={(e) => updateSelectedImage({ width: e.target.value })}
              className="rounded border border-blue-200 bg-white px-2 py-1 text-xs text-slate-800 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="100%">100% Width</option>
              <option value="75%">75% Width</option>
              <option value="50%">50% Width</option>
              <option value="35%">35% Width</option>
            </select>
            <select
              aria-label="Image alignment"
              value={selectedImage.align}
              onChange={(e) => updateSelectedImage({ align: e.target.value as ImageAlign })}
              className="rounded border border-blue-200 bg-white px-2 py-1 text-xs text-slate-800 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="center">Center</option>
              <option value="left">Float Left</option>
              <option value="right">Float Right</option>
              <option value="full">Full Bleed</option>
            </select>
            <input
              type="text"
              aria-label="Image alt text"
              value={selectedImage.alt}
              onChange={(e) => updateSelectedImage({ alt: e.target.value })}
              placeholder="Alt text..."
              className="w-36 rounded border border-blue-200 bg-white px-2 py-1 text-xs text-slate-800 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-200"
            />
            <input
              type="text"
              aria-label="Image caption"
              value={selectedImage.caption}
              onChange={(e) => updateSelectedImage({ caption: e.target.value })}
              placeholder="Caption..."
              className="w-40 rounded border border-blue-200 bg-white px-2 py-1 text-xs text-slate-800 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-200"
            />
            <button
              type="button"
              onClick={removeSelectedImage}
              aria-label="Remove selected image"
              className="ml-auto flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        )}

        {/* Interactive WYSIWYG Canvas mirroring Design Settings */}
        <div
          className="studio-scroll relative flex-1 overflow-y-auto p-4 sm:p-6"
          style={{ backgroundColor: design.mainBgColor }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files?.length) {
              handleDropFiles(e.dataTransfer.files);
            }
          }}
        >
          {isDragOver && (
            <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-blue-600/10 backdrop-blur-[1px]">
              <div className="rounded-xl border-2 border-dashed border-blue-600 bg-white px-6 py-4 text-sm font-semibold text-blue-700 shadow-lg">
                Drop image to insert into notepad
              </div>
            </div>
          )}

          {/* Scoped CSS for the editable article surface so typography & colors match Live Preview */}
          <style>{`
            .fd-editor-surface {
              font-family: ${bodyFontCss};
              font-size: ${design.bodySizePx}px;
              font-weight: ${design.bodyWeight};
              line-height: ${design.lineHeight};
              letter-spacing: ${design.letterSpacingEm}em;
              color: ${design.bodyColor};
            }
            .fd-editor-surface h1, .fd-editor-surface h2, .fd-editor-surface h3 {
              font-family: ${headingFontCss};
              color: ${design.headingColor};
              font-weight: ${design.headingWeight};
              line-height: 1.25;
              margin-top: ${Math.round(design.sectionSpacingPx * 1.4)}px;
              margin-bottom: ${Math.round(design.sectionSpacingPx * 0.6)}px;
            }
            .fd-editor-surface h1 { font-size: ${design.h1SizePx}px; }
            .fd-editor-surface h2 { font-size: ${design.h2SizePx}px; }
            .fd-editor-surface h3 { font-size: ${design.h3SizePx}px; }
            .fd-editor-surface p { margin-bottom: ${design.sectionSpacingPx}px; }
            .fd-editor-surface a:not([data-cta-button="true"]) { color: ${design.linkColor}; text-decoration: underline; }
            .fd-editor-surface a[data-cta-button="true"] {
              display: inline-flex;
              align-items: center;
              padding: 10px 20px;
              background: ${design.accentColor};
              color: #ffffff;
              border-radius: ${Math.min(design.borderRadiusPx, 10)}px;
              text-decoration: none;
              font-weight: 600;
            }
            .fd-editor-surface a[data-cta-button="true"][data-btn-variant="outline"] {
              background: transparent;
              color: ${design.accentColor};
              border: 1px solid ${design.accentColor};
            }
            .fd-editor-surface blockquote {
              margin: ${design.sectionSpacingPx}px 0;
              padding: 14px 18px;
              border: 1px solid ${design.borderColor};
              border-radius: ${Math.min(design.borderRadiusPx, 10)}px;
              font-style: italic;
            }
            .fd-editor-surface pre {
              margin: ${design.sectionSpacingPx}px 0;
              padding: 16px;
              background: #0f172a;
              color: #e2e8f0;
              border-radius: ${Math.min(design.borderRadiusPx, 10)}px;
              overflow-x: auto;
              font-family: 'JetBrains Mono', monospace;
              font-size: 0.88em;
            }
            .fd-editor-surface .table-scroll {
              width: 100%;
              overflow-x: auto;
              margin: ${design.sectionSpacingPx}px 0;
              border: 1px solid ${design.borderColor};
              border-radius: ${Math.min(design.borderRadiusPx, 8)}px;
            }
            .fd-editor-surface table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.94em;
            }
            .fd-editor-surface .table-scroll table {
              margin: 0;
            }
            .fd-editor-surface th, .fd-editor-surface td {
              padding: 10px 12px;
              border: 1px solid ${design.borderColor};
              text-align: left;
            }
            .fd-editor-surface ul, .fd-editor-surface ol {
              padding-left: 1.5em;
              margin-bottom: ${design.sectionSpacingPx}px;
            }
            .fd-editor-surface ul { list-style: disc; }
            .fd-editor-surface ol { list-style: decimal; }
            .fd-editor-surface figure {
              margin: ${design.sectionSpacingPx}px auto;
              max-width: 100%;
            }
            .fd-editor-surface figure[data-align="left"] { float: left; margin: 4px 20px 12px 0; max-width: 48%; }
            .fd-editor-surface figure[data-align="right"] { float: right; margin: 4px 0 12px 20px; max-width: 48%; }
            .fd-editor-surface figure[data-align="center"] { text-align: center; }
            .fd-editor-surface figcaption { margin-top: 6px; font-size: 0.85em; opacity: 0.78; text-align: center; }
            .fd-editor-surface img { max-width: 100%; height: auto; border-radius: ${Math.min(design.borderRadiusPx, 10)}px; }
            .fd-editor-surface hr { border: 0; border-top: 1px solid ${design.borderColor}; margin: ${design.sectionSpacingPx}px 0; }
          `}</style>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Rich text notepad editor"
            data-empty={isEmpty ? 'true' : 'false'}
            data-placeholder="Start writing headings, paragraphs, lists, or drop images here..."
            onInput={emitChange}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onClick={handleEditorClick}
            onPaste={(e) => {
              const items = e.clipboardData?.items;
              if (items) {
                for (const item of Array.from(items)) {
                  if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                      e.preventDefault();
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      handleDropFiles(dt.files);
                      return;
                    }
                  }
                }
              }
            }}
            className="fd-editor-surface mx-auto min-h-[540px] w-full transition-colors"
            style={{
              maxWidth:
                design.layoutMode === 'full'
                  ? '100%'
                  : design.layoutMode === 'narrow'
                  ? `${Math.min(design.contentWidthPx, 740)}px`
                  : `${design.contentWidthPx}px`,
              backgroundColor: design.contentBgColor,
              padding: `${Math.min(design.contentPaddingPx, 44)}px`,
              borderRadius: design.layoutMode === 'full' ? '0px' : `${design.borderRadiusPx}px`,
              border: `1px solid ${design.borderColor}`,
              boxShadow:
                design.shadowStyle === 'elevated'
                  ? '0 10px 30px rgba(15, 23, 42, 0.08)'
                  : design.shadowStyle === 'subtle'
                  ? '0 2px 10px rgba(15, 23, 42, 0.04)'
                  : 'none',
            }}
          />
        </div>

        {/* Quiet Bottom Metrics Bar */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-1.5 text-[11px] text-slate-500 tabular-nums dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span>{wordCount} words</span>
            <span aria-hidden="true">·</span>
            <span>{charCount} characters</span>
          </div>
          <span className="hidden truncate xl:inline">
            Click any image to resize, align, or edit alt text &amp; caption
          </span>
        </div>
      </div>
    );
  }
);

RichNotepadEditor.displayName = 'RichNotepadEditor';
