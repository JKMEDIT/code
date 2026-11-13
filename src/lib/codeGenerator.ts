import type {
  DesignSettings,
  ExtractedAsset,
  GeneratedWebsiteCode,
  NotepadDocument,
} from '../types/document';
import { escapeAttr, escapeHtml, sanitizeRichHtml, stripHtmlToText } from './sanitizer';
import { buildGoogleFontsUrl, getFontFamilyCss } from './themes';

/**
 * Prepares clean, semantic blog HTML from the editor markup:
 * - Sanitizes HTML
 * - Converts internal editor data-* attributes into human-readable blog classes
 * - Wraps tables in .table-scroll for mobile responsiveness
 * - Ensures every <img> carries a descriptive alt attribute
 */
export function prepareExportBodyHtml(rawHtml: string): string {
  const sanitized = sanitizeRichHtml(rawHtml);
  if (!sanitized) {
    return '<p>Start writing your post here.</p>';
  }

  let output = sanitized;

  // Normalize existing table wrappers so we wrap cleanly once
  output = output.replace(
    /<div\s+class=["'](?:fd-table-wrap|table-scroll)["']\s*>([\s\S]*?)<\/div>/gi,
    '$1'
  );
  output = output.replace(
    /(<table\b[\s\S]*?<\/table>)/gi,
    '\n<div class="table-scroll">\n$1\n</div>'
  );

  // Convert editor CTA button attributes into clean .btn classes
  output = output.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    if (!/\bdata-cta-button=["']true["']/i.test(attrs)) {
      return `<a${attrs}>`;
    }
    const isOutline = /\bdata-btn-variant=["']outline["']/i.test(attrs);
    let cleaned = attrs
      .replace(/\s*data-cta-button=["'][^"']*["']/gi, '')
      .replace(/\s*data-btn-variant=["'][^"']*["']/gi, '');
    const btnClass = isOutline ? 'btn btn-outline' : 'btn';
    if (/\bclass=["']([^"']*)["']/i.test(cleaned)) {
      cleaned = cleaned.replace(
        /\bclass=["']([^"']*)["']/i,
        (_m, existing: string) => `class="${existing} ${btnClass}"`
      );
    } else {
      cleaned = ` class="${btnClass}"${cleaned}`;
    }
    return `<a${cleaned}>`;
  });

  // Convert editor figure alignment attributes into clean .align-* classes
  output = output.replace(/<figure\b([^>]*)>/gi, (_match, attrs: string) => {
    const alignMatch = attrs.match(/\bdata-align=["'](left|center|right|full)["']/i);
    if (!alignMatch) return `<figure${attrs}>`;
    const alignClass = `align-${alignMatch[1].toLowerCase()}`;
    let cleaned = attrs.replace(/\s*data-align=["'][^"']*["']/gi, '');
    if (/\bclass=["']([^"']*)["']/i.test(cleaned)) {
      cleaned = cleaned.replace(
        /\bclass=["']([^"']*)["']/i,
        (_m, existing: string) => `class="${existing} ${alignClass}"`
      );
    } else {
      cleaned = ` class="${alignClass}"${cleaned}`;
    }
    return `<figure${cleaned}>`;
  });

  // Convert editor spacer marker into a clean .spacer class
  output = output.replace(/<div\b([^>]*)>/gi, (_match, attrs: string) => {
    if (!/\bdata-spacer=["']true["']/i.test(attrs)) {
      return `<div${attrs}>`;
    }
    const cleaned = attrs.replace(/\s*data-spacer=["'][^"']*["']/gi, '');
    return `<div class="spacer"${cleaned}>`;
  });

  // Ensure every <img> has an alt attribute
  output = output.replace(/<img\b([^>]*)>/gi, (_match, attrs: string) => {
    if (!/\balt\s*=/i.test(attrs)) {
      return `<img${attrs} alt="Blog post illustration">`;
    }
    return `<img${attrs}>`;
  });

  return formatHtmlBlocks(output);
}

function formatHtmlBlocks(html: string): string {
  const preBlocks: string[] = [];
  const placeholderHtml = html.replace(/<pre\b[\s\S]*?<\/pre>/gi, (match) => {
    const idx = preBlocks.length;
    preBlocks.push(match);
    return `__PRE_BLOCK_${idx}__`;
  });

  const formatted = placeholderHtml
    .replace(
      />\s*(<(?:h[1-6]|p|ul|ol|li|blockquote|figure|figcaption|hr|div|table|thead|tbody|tr|section|article)\b)/gi,
      '>\n$1'
    )
    .replace(
      /(<\/(?:h[1-6]|p|ul|ol|blockquote|figure|div|table|thead|tbody|tr|section|article)>)\s*</gi,
      '$1\n<'
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return formatted.replace(/__PRE_BLOCK_(\d+)__/g, (_m, idxStr: string) => {
    return preBlocks[Number(idxStr)] ?? '';
  });
}

function getShadowCss(style: DesignSettings['shadowStyle'], borderColor: string): string {
  switch (style) {
    case 'none':
      return 'none';
    case 'subtle':
      return '0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.04)';
    case 'elevated':
      return '0 4px 12px rgba(15, 23, 42, 0.08), 0 20px 48px rgba(15, 23, 42, 0.08)';
    case 'border':
      return `0 0 0 1px ${borderColor}`;
  }
}

export function generateWebsiteCss(design: DesignSettings, bodyHtml = ''): string {
  const headingFontCss = getFontFamilyCss(design.headingFont);
  const bodyFontCss = getFontFamilyCss(design.bodyFont);
  const shadowCss = getShadowCss(design.shadowStyle, design.borderColor);

  const isFullWidth = design.layoutMode === 'full';
  const maxWidth =
    design.layoutMode === 'narrow'
      ? `${Math.min(design.contentWidthPx, 740)}px`
      : isFullWidth
      ? '100%'
      : `${design.contentWidthPx}px`;

  const outerPad = isFullWidth ? '0' : 'clamp(16px, 3vw, 48px) clamp(12px, 2.5vw, 24px)';
  const articleRadius = isFullWidth ? '0px' : `${design.borderRadiusPx}px`;

  // Detect which optional component styles are actually used in the blog post
  const hasContentFilter = bodyHtml.length > 0;
  const hasBtn = !hasContentFilter || /\bclass=["'][^"']*\bbtn\b/i.test(bodyHtml);
  const hasMark = !hasContentFilter || /<mark\b/i.test(bodyHtml);
  const hasLists = !hasContentFilter || /<(?:ul|ol)\b/i.test(bodyHtml);
  const hasBlockquote = !hasContentFilter || /<blockquote\b/i.test(bodyHtml);
  const hasCode = !hasContentFilter || /<(?:pre|code)\b/i.test(bodyHtml);
  const hasPre = !hasContentFilter || /<pre\b/i.test(bodyHtml);
  const hasHr = !hasContentFilter || /<hr\b/i.test(bodyHtml);
  const hasSpacer = !hasContentFilter || /\bclass=["'][^"']*\bspacer\b/i.test(bodyHtml);
  const hasMedia = !hasContentFilter || /<(?:img|figure)\b/i.test(bodyHtml);
  const hasTable = !hasContentFilter || /<table\b/i.test(bodyHtml);
  const hasCodeCopy = design.enableCodeCopy && hasPre;
  const hasLightbox = design.enableImageLightbox && hasMedia;

  const defaultImgAlignCss = (() => {
    switch (design.defaultImageAlign) {
      case 'left':
        return 'margin-right: auto; margin-left: 0;';
      case 'right':
        return 'margin-left: auto; margin-right: 0;';
      case 'full':
        return 'width: 100%; margin-left: auto; margin-right: auto;';
      case 'center':
      default:
        return 'margin-left: auto; margin-right: auto;';
    }
  })();

  const sections: string[] = [];

  sections.push(`:root {
  --bg-page: ${design.mainBgColor};
  --bg-surface: ${design.contentBgColor};
  --text-heading: ${design.headingColor};
  --text-body: ${design.bodyColor};
  --color-link: ${design.linkColor};
  --color-border: ${design.borderColor};
  --color-accent: ${design.accentColor};
  --font-heading: ${headingFontCss};
  --font-body: ${bodyFontCss};
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --radius: ${design.borderRadiusPx}px;
  --space: ${design.sectionSpacingPx}px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: ${design.enableSmoothScroll ? 'smooth' : 'auto'};
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-page);
  color: var(--text-body);
  font-family: var(--font-body);
  font-size: ${design.bodySizePx}px;
  font-weight: ${design.bodyWeight};
  line-height: ${design.lineHeight};
  letter-spacing: ${design.letterSpacingEm}em;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.blog-layout {
  min-height: 100vh;
  padding: ${outerPad};
}

.blog-post {
  width: 100%;
  max-width: ${maxWidth};
  margin: 0 auto;
  background-color: var(--bg-surface);
  padding: ${design.contentPaddingPx}px;
  border-radius: ${articleRadius};
  border: ${isFullWidth ? 'none' : `1px solid ${design.borderColor}`};
  box-shadow: ${isFullWidth ? 'none' : shadowCss};
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.blog-post > *:first-child {
  margin-top: 0;
}

.blog-post > *:last-child {
  margin-bottom: 0;
}

.blog-post h1,
.blog-post h2,
.blog-post h3,
.blog-post h4,
.blog-post h5,
.blog-post h6 {
  font-family: var(--font-heading);
  color: var(--text-heading);
  font-weight: ${design.headingWeight};
  line-height: 1.25;
  margin-top: calc(var(--space) * 1.6);
  margin-bottom: calc(var(--space) * 0.65);
  text-wrap: balance;
}

.blog-post h1 {
  font-size: clamp(${Math.max(26, Math.round(design.h1SizePx * 0.74))}px, 4vw, ${design.h1SizePx}px);
  letter-spacing: -0.02em;
}

.blog-post h2 {
  font-size: clamp(${Math.max(21, Math.round(design.h2SizePx * 0.8))}px, 3vw, ${design.h2SizePx}px);
  letter-spacing: -0.015em;
}

.blog-post h3 {
  font-size: clamp(${Math.max(18, Math.round(design.h3SizePx * 0.88))}px, 2.2vw, ${design.h3SizePx}px);
}`);

  if (design.numberedHeadings) {
    sections.push(`.blog-post {
  counter-reset: section-h2;
}

.blog-post h2 {
  counter-reset: section-h3;
}

.blog-post h2::before {
  counter-increment: section-h2;
  content: counter(section-h2) ". ";
  color: var(--color-accent);
  font-weight: 700;
}

.blog-post h3::before {
  counter-increment: section-h3;
  content: counter(section-h2) "." counter(section-h3) " ";
  color: var(--color-accent);
  font-weight: 600;
}`);
  }

  sections.push(`.blog-post p {
  margin-top: 0;
  margin-bottom: var(--space);
}

.blog-post a:not(.btn) {
  color: var(--color-link);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  transition: opacity 150ms ease;
}

.blog-post a:not(.btn):hover {
  opacity: 0.78;
}`);

  if (hasBtn) {
    sections.push(`.blog-post .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 22px;
  margin: 6px 4px 6px 0;
  background-color: var(--color-accent);
  color: #ffffff;
  font-family: var(--font-heading);
  font-size: 0.95em;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  border-radius: min(var(--radius), 10px);
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 150ms ease, opacity 150ms ease;
}

.blog-post .btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

.blog-post .btn.btn-outline {
  background-color: transparent;
  color: var(--color-accent);
  border-color: var(--color-accent);
}`);
  }

  if (hasMark) {
    sections.push(`.blog-post mark {
  padding: 0.1em 0.35em;
  border-radius: 3px;
}`);
  }

  if (hasLists) {
    sections.push(`.blog-post ul,
.blog-post ol {
  margin-top: 0;
  margin-bottom: var(--space);
  padding-left: 1.5em;
}

.blog-post li {
  margin-bottom: 0.45em;
}

.blog-post li > ul,
.blog-post li > ol {
  margin-top: 0.45em;
  margin-bottom: 0.25em;
}`);
  }

  if (hasBlockquote) {
    sections.push(`.blog-post blockquote {
  margin: var(--space) 0;
  padding: 16px 22px;
  background-color: color-mix(in srgb, var(--color-accent) 6%, var(--bg-surface));
  border: 1px solid var(--color-border);
  border-radius: min(var(--radius), 10px);
  font-style: italic;
}

.blog-post blockquote p:last-child {
  margin-bottom: 0;
}`);
  }

  if (hasCode) {
    sections.push(`.blog-post code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  padding: 0.15em 0.4em;
  border-radius: 4px;
  background-color: color-mix(in srgb, var(--color-border) 45%, transparent);
}`);
  }

  if (hasPre) {
    sections.push(`.blog-post pre {
  margin: var(--space) 0;
  padding: 18px 20px;
  background-color: #0f172a;
  color: #e2e8f0;
  border-radius: min(var(--radius), 10px);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.88em;
  line-height: 1.6;
}

.blog-post pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
}`);
  }

  if (hasCodeCopy) {
    sections.push(`.code-block {
  position: relative;
  margin: var(--space) 0;
}

.code-block pre {
  margin: 0;
}

.copy-code-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: #cbd5e1;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 6px;
  cursor: pointer;
}

.copy-code-btn:hover {
  color: #ffffff;
  border-color: rgba(148, 163, 184, 0.5);
}`);
  }

  if (hasHr) {
    sections.push(`.blog-post hr {
  border: 0;
  border-top: 1px solid var(--color-border);
  margin: calc(var(--space) * 1.5) 0;
}`);
  }

  if (hasSpacer) {
    sections.push(`.blog-post .spacer {
  display: block;
  width: 100%;
}`);
  }

  if (hasMedia) {
    sections.push(`.blog-post img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: min(var(--radius), 10px);
  ${defaultImgAlignCss}
}

.blog-post figure {
  margin: calc(var(--space) * 1.2) auto;
  max-width: 100%;
}

.blog-post figure.align-left {
  float: left;
  margin: 4px 24px 16px 0;
  max-width: 48%;
}

.blog-post figure.align-right {
  float: right;
  margin: 4px 0 16px 24px;
  max-width: 48%;
}

.blog-post figure.align-center {
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.blog-post figure.align-center img {
  margin-left: auto;
  margin-right: auto;
}

.blog-post figure.align-full,
.blog-post figure.align-full img {
  width: 100%;
}

.blog-post figcaption {
  margin-top: 8px;
  font-size: 0.85em;
  opacity: 0.78;
  text-align: center;
}

.blog-post::after {
  content: "";
  display: table;
  clear: both;
}`);
  }

  if (hasTable) {
    sections.push(`.table-scroll {
  width: 100%;
  overflow-x: auto;
  margin: var(--space) 0;
  border: 1px solid var(--color-border);
  border-radius: min(var(--radius), 8px);
}

.blog-post table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.94em;
  text-align: left;
}

.blog-post th,
.blog-post td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
}

.blog-post th:last-child,
.blog-post td:last-child {
  border-right: none;
}

.blog-post tr:last-child td {
  border-bottom: none;
}

.blog-post th {
  font-family: var(--font-heading);
  color: var(--text-heading);
  font-weight: 600;
  background-color: color-mix(in srgb, var(--color-border) 32%, var(--bg-surface));
}`);
  }

  if (design.enableBackToTop) {
    sections.push(`.back-to-top {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--bg-surface);
  color: var(--text-heading);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.14);
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  z-index: 50;
}

.back-to-top.is-visible {
  display: inline-flex;
}`);
  }

  if (hasLightbox) {
    sections.push(`.image-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.86);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.image-lightbox.is-open {
  display: flex;
}

.image-lightbox img {
  max-width: 92vw;
  max-height: 86vh;
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}`);
  }

  const mobileExtras: string[] = [];
  if (hasMedia) {
    mobileExtras.push(`  .blog-post figure.align-left,
  .blog-post figure.align-right {
    float: none;
    max-width: 100%;
    margin: var(--space) auto;
  }`);
  }
  if (hasBtn) {
    mobileExtras.push(`  .blog-post .btn {
    width: 100%;
    margin-right: 0;
  }`);
  }

  sections.push(`@media (max-width: 1024px) {
  .blog-post {
    padding: clamp(24px, 4vw, ${design.contentPaddingPx}px);
  }
}

@media (max-width: 640px) {
  body {
    font-size: ${Math.max(15, design.bodySizePx - 1)}px;
  }

  .blog-layout {
    padding: ${isFullWidth ? '0' : '12px'};
  }

  .blog-post {
    padding: 22px 18px;
    border-radius: ${isFullWidth ? '0px' : `${Math.min(design.borderRadiusPx, 10)}px`};
  }${mobileExtras.length > 0 ? `\n\n${mobileExtras.join('\n\n')}` : ''}
}`);

  return `${sections.join('\n\n')}\n`;
}

export function generateWebsiteJs(design: DesignSettings, bodyHtml = ''): string {
  const parts: string[] = [];
  const hasContentFilter = bodyHtml.length > 0;
  const hasPre = !hasContentFilter || /<pre\b/i.test(bodyHtml);
  const hasImages = !hasContentFilter || /<img\b/i.test(bodyHtml);

  if (design.enableCodeCopy && hasPre) {
    parts.push(`  document.querySelectorAll('.blog-post pre').forEach(function (pre) {
    if (pre.parentElement && pre.parentElement.classList.contains('code-block')) return;
    var wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-code-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', function () {
      var text = pre.innerText || pre.textContent || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
        });
      }
    });
    wrap.appendChild(btn);
  });`);
  }

  if (design.enableImageLightbox && hasImages) {
    parts.push(`  var postImages = document.querySelectorAll('.blog-post img');
  if (postImages.length > 0) {
    var lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image preview');
    var lightImg = document.createElement('img');
    lightbox.appendChild(lightImg);
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', function () {
      lightbox.classList.remove('is-open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') lightbox.classList.remove('is-open');
    });

    postImages.forEach(function (img) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () {
        lightImg.src = img.currentSrc || img.src;
        lightImg.alt = img.alt || 'Expanded image';
        lightbox.classList.add('is-open');
      });
    });
  }`);
  }

  if (design.enableBackToTop) {
    parts.push(`  var topBtn = document.createElement('button');
  topBtn.type = 'button';
  topBtn.className = 'back-to-top';
  topBtn.setAttribute('aria-label', 'Back to top');
  topBtn.innerHTML = '&#8593;';
  document.body.appendChild(topBtn);

  window.addEventListener('scroll', function () {
    if (window.scrollY > 320) {
      topBtn.classList.add('is-visible');
    } else {
      topBtn.classList.remove('is-visible');
    }
  }, { passive: true });

  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });`);
  }

  if (parts.length === 0) {
    return '';
  }

  return `document.addEventListener('DOMContentLoaded', function () {
${parts.join('\n\n')}
});
`;
}

function extractAssetsAndRewriteHtml(html: string): {
  rewrittenHtml: string;
  assets: ExtractedAsset[];
} {
  const assets: ExtractedAsset[] = [];
  let counter = 1;

  const rewrittenHtml = html.replace(
    /src="(data:image\/(png|jpeg|jpg|gif|webp|avif);base64,([^"]+))"/gi,
    (_match, _fullUri: string, extRaw: string, base64Data: string) => {
      const ext = extRaw.toLowerCase() === 'jpeg' ? 'jpg' : extRaw.toLowerCase();
      const filename = `image-${counter}.${ext}`;
      counter += 1;
      const path = `assets/${filename}`;
      assets.push({
        filename,
        path,
        mimeType: `image/${extRaw.toLowerCase()}`,
        base64Data,
      });
      return `src="${path}"`;
    }
  );

  return { rewrittenHtml, assets };
}

function buildExcerpt(bodyHtml: string): string {
  const text = stripHtmlToText(bodyHtml);
  if (!text) return '';
  return text.length > 155 ? `${text.slice(0, 152).trim()}...` : text;
}

function buildHtmlDocument(
  doc: NotepadDocument,
  bodyHtml: string,
  options: {
    inlineCss?: string;
    inlineJs?: string;
    includeExternalLinks?: boolean;
    hasJs: boolean;
    baseHref?: string;
  }
): string {
  const title = escapeHtml(doc.seo.pageTitle || doc.title || 'Blog Post');
  const rawDescription = doc.seo.metaDescription.trim() || buildExcerpt(bodyHtml);
  const description = rawDescription ? escapeAttr(rawDescription) : '';
  const author = doc.seo.author.trim() ? escapeAttr(doc.seo.author.trim()) : '';
  const keywords = doc.seo.keywords.trim() ? escapeAttr(doc.seo.keywords.trim()) : '';
  const lang = escapeAttr(doc.seo.language || 'en');
  const googleFontsUrl = buildGoogleFontsUrl(doc.design.headingFont, doc.design.bodyFont);

  const headLines: string[] = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  ];

  if (options.baseHref) {
    headLines.push(`<base href="${escapeAttr(options.baseHref)}" />`);
  }

  headLines.push(`<title>${title}</title>`);

  if (description) {
    headLines.push(`<meta name="description" content="${description}" />`);
  }
  if (author) {
    headLines.push(`<meta name="author" content="${author}" />`);
  }
  if (keywords) {
    headLines.push(`<meta name="keywords" content="${keywords}" />`);
  }

  headLines.push(
    `<meta property="og:title" content="${escapeAttr(doc.seo.pageTitle || doc.title || 'Blog Post')}" />`
  );
  if (description) {
    headLines.push(`<meta property="og:description" content="${description}" />`);
  }
  headLines.push('<meta property="og:type" content="article" />');

  if (googleFontsUrl) {
    headLines.push('<link rel="preconnect" href="https://fonts.googleapis.com" />');
    headLines.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />');
    headLines.push(`<link rel="stylesheet" href="${escapeAttr(googleFontsUrl)}" />`);
  }

  if (options.inlineCss) {
    headLines.push(`<style>\n${options.inlineCss.trimEnd()}\n    </style>`);
  } else if (options.includeExternalLinks) {
    headLines.push('<link rel="stylesheet" href="style.css" />');
  }

  const headBlock = headLines.map((line) => `    ${line}`).join('\n');

  const scriptBlock =
    options.hasJs && options.inlineJs
      ? `\n    <script>\n${options.inlineJs.trimEnd()}\n    </script>`
      : options.hasJs && options.includeExternalLinks
      ? `\n    <script src="script.js" defer></script>`
      : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
${headBlock}
  </head>
  <body>
    <main class="blog-layout">
      <article class="blog-post">
${indentLines(bodyHtml, 8)}
      </article>
    </main>${scriptBlock}
  </body>
</html>
`;
}

function indentLines(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.trim() ? `${pad}${line}` : ''))
    .join('\n');
}

export function generateWebsiteCode(
  doc: NotepadDocument,
  previewBaseHref?: string
): GeneratedWebsiteCode {
  const bodyHtml = prepareExportBodyHtml(doc.contentHtml);
  const css = generateWebsiteCss(doc.design, bodyHtml);
  const js = generateWebsiteJs(doc.design, bodyHtml);
  const hasJs = js.trim().length > 0;

  const indexHtml = buildHtmlDocument(doc, bodyHtml, {
    includeExternalLinks: true,
    hasJs,
  });

  const standaloneHtml = buildHtmlDocument(doc, bodyHtml, {
    inlineCss: css,
    inlineJs: js,
    hasJs,
    baseHref: previewBaseHref,
  });

  const { rewrittenHtml, assets } = extractAssetsAndRewriteHtml(bodyHtml);
  const zipIndexHtml = buildHtmlDocument(doc, rewrittenHtml, {
    includeExternalLinks: true,
    hasJs,
  });

  const fileList = [
    '- `index.html` — Blog post markup',
    '- `style.css` — Responsive blog stylesheet',
  ];
  if (hasJs) {
    fileList.push('- `script.js` — Interactive enhancements');
  }
  if (assets.length > 0) {
    fileList.push('- `assets/` — Local image files');
  }

  const readmeMd = `# ${doc.seo.pageTitle || doc.title}

## Files

${fileList.join('\n')}

## Deployment

1. Upload all files in this folder to your web host or GitHub Pages repository root.
2. Open \`index.html\` or visit your site URL—no build step or dependencies required.
`;

  return {
    indexHtml,
    css,
    js,
    standaloneHtml,
    readmeMd,
    assets,
    zipIndexHtml,
  };
}
