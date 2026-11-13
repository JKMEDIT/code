const DISALLOWED_TAGS_WITH_BODY =
  /<\s*(script|style|iframe|object|embed|applet|form|noscript|svg|math|template)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;

const DISALLOWED_SELF_CLOSING =
  /<\s*(script|style|iframe|object|embed|meta|link|base|input|textarea|select|option)[^>]*\/?>/gi;

const ALLOWED_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'div',
  'span',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'ins',
  'mark',
  'small',
  'sub',
  'sup',
  'a',
  'img',
  'figure',
  'figcaption',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'hr',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'br',
  'section',
  'article',
  'header',
  'footer',
]);

const ALLOWED_ATTRS = new Set([
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'title',
  'width',
  'height',
  'class',
  'style',
  'id',
  'colspan',
  'rowspan',
  'data-cta-button',
  'data-align',
  'data-spacer',
  'data-caption',
  'data-btn-variant',
  'data-radius',
]);

const SAFE_STYLE_PROPS = new Set([
  'color',
  'background-color',
  'background',
  'text-align',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',
  'line-height',
  'letter-spacing',
  'margin',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'padding',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'width',
  'max-width',
  'height',
  'border',
  'border-radius',
  'display',
  'float',
]);

function sanitizeStyleString(rawStyle: string): string {
  const declarations = rawStyle.split(';');
  const safe: string[] = [];

  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const val = decl.slice(colonIdx + 1).trim();
    if (!SAFE_STYLE_PROPS.has(prop)) continue;
    if (!val) continue;
    const lowerVal = val.toLowerCase();
    if (
      lowerVal.includes('expression(') ||
      lowerVal.includes('javascript:') ||
      lowerVal.includes('vbscript:') ||
      lowerVal.includes('url(')
    ) {
      continue;
    }
    safe.push(`${prop}: ${val}`);
  }

  return safe.join('; ');
}

function isSafeUrl(url: string, allowDataImage = false): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return true;
  if (allowDataImage && /^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,/i.test(trimmed)) {
    return true;
  }
  try {
    const parsed = new URL(trimmed, 'https://example.com');
    return (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:' ||
      parsed.protocol === 'tel:'
    );
  } catch {
    return false;
  }
}

export function sanitizeRichHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  // Remove dangerous tags with body first
  let cleaned = rawHtml
    .replace(DISALLOWED_TAGS_WITH_BODY, '')
    .replace(DISALLOWED_SELF_CLOSING, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Filter tags and attributes deterministically
  cleaned = cleaned.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (fullMatch, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    const isClosing = fullMatch.startsWith('</');

    if (!ALLOWED_TAGS.has(tag)) {
      return '';
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    const attrMatches = rawAttrs.matchAll(
      /([a-zA-Z0-9-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
    );
    const safeAttrs: string[] = [];

    for (const m of attrMatches) {
      const attrName = m[1].toLowerCase();
      if (attrName.startsWith('on')) continue; // strip event handlers
      if (!ALLOWED_ATTRS.has(attrName)) continue;

      const attrVal = m[2] ?? m[3] ?? m[4] ?? '';

      if (attrName === 'href') {
        if (!isSafeUrl(attrVal, false)) continue;
        safeAttrs.push(`href="${escapeAttr(attrVal)}"`);
      } else if (attrName === 'src') {
        if (!isSafeUrl(attrVal, true)) continue;
        safeAttrs.push(`src="${escapeAttr(attrVal)}"`);
      } else if (attrName === 'style') {
        const cleanStyle = sanitizeStyleString(attrVal);
        if (cleanStyle) {
          safeAttrs.push(`style="${escapeAttr(cleanStyle)}"`);
        }
      } else if (attrName === 'target') {
        if (attrVal === '_blank') {
          safeAttrs.push(`target="_blank"`);
        }
      } else {
        safeAttrs.push(attrVal ? `${attrName}="${escapeAttr(attrVal)}"` : attrName);
      }
    }

    // Ensure safe rel when target="_blank" is present
    if (tag === 'a' && safeAttrs.some((a) => a.startsWith('target="_blank"'))) {
      if (!safeAttrs.some((a) => a.startsWith('rel='))) {
        safeAttrs.push('rel="noopener noreferrer"');
      }
    }

    const selfClose = tag === 'img' || tag === 'br' || tag === 'hr';
    const attrStr = safeAttrs.length > 0 ? ' ' + safeAttrs.join(' ') : '';
    return selfClose ? `<${tag}${attrStr}>` : `<${tag}${attrStr}>`;
  });

  return cleaned.trim();
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
