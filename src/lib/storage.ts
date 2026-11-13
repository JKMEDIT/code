import type { NotepadDocument, ProjectExportBundle } from '../types/document';
import { sanitizeRichHtml } from './sanitizer';
import { applyThemePreset, DEFAULT_DESIGN_SETTINGS } from './themes';

const STORAGE_DOCS_KEY = 'foliodraft.documents.v1';
const STORAGE_ACTIVE_ID_KEY = 'foliodraft.activeDocumentId.v1';
const STORAGE_APP_THEME_KEY = 'foliodraft.appTheme.v1';

export function createSeedDocuments(): NotepadDocument[] {
  const now = new Date().toISOString();

  const starterDoc: NotepadDocument = {
    id: 'doc-editorial-guide',
    title: 'Architectural Studio Field Notes',
    seo: {
      pageTitle: 'Architectural Studio Field Notes — Design & Build Guide',
      metaDescription:
        'A visual field guide exploring daylight geometry, tactile materials, and structured documentation for modern studios.',
      author: 'Editorial Desk',
      keywords: 'architecture, editorial design, studio notes, typography',
      language: 'en',
    },
    design: { ...DEFAULT_DESIGN_SETTINGS },
    contentHtml: `<h1>Architectural Studio Field Notes</h1>
<p>Every enduring structure begins as a clear note on paper—observations about proportion, daylight, and material honesty before a single wall is framed. Writing in clean, structured prose lets ideas move effortlessly from notebook to published blog post.</p>
<figure data-align="center">
  <img src="/assets/editorial_studio_desk.jpg" alt="Minimalist oak architectural desk with open linen notebook and brass fountain pen in soft morning sunlight" style="width: 100%;" />
  <figcaption>Morning light study on natural oak—capturing clean architectural proportions before drafting.</figcaption>
</figure>
<h2>01. Principles of Calm Composition</h2>
<p>Good web typography mirrors thoughtful architecture: generous margins, deliberate contrast, and zero visual noise. Try highlighting <mark style="background-color: #fef08a; color: #1e293b;">key phrases</mark>, adjusting the theme preset in the right panel, or switching to <strong>Mobile Preview</strong> to inspect how this page adapts across viewports.</p>
<ul>
  <li><strong>Expressive Hierarchy:</strong> Pair a distinct display heading font with an effortless reading face.</li>
  <li><strong>Responsive Grids &amp; Tables:</strong> All images, tables, and callouts reflow automatically on tablets and phones.</li>
  <li><strong>Zero Runtime Lock-In:</strong> Exported code runs cleanly on GitHub Pages, Netlify, or any static host.</li>
</ul>
<blockquote>
  <p>"Simplicity is about subtracting the obvious and adding the meaningful—letting structure and whitespace carry the message."</p>
</blockquote>
<h2>02. Material &amp; Specification Matrix</h2>
<div class="table-scroll">
  <table>
    <thead>
      <tr>
        <th>Element</th>
        <th>Primary Material</th>
        <th>Finish</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Worksurface</td>
        <td>White Oak</td>
        <td>Matte Oil</td>
        <td>32mm solid lamination</td>
      </tr>
      <tr>
        <td>Drafting Instrument</td>
        <td>Machined Brass</td>
        <td>Unlacquered</td>
        <td>Develops natural patina</td>
      </tr>
      <tr>
        <td>Notebook Binding</td>
        <td>Belgian Linen</td>
        <td>Lay-flat Smyth Sewn</td>
        <td>120gsm archival cream stock</td>
      </tr>
    </tbody>
  </table>
</div>
<h3>Sample Export Snippet</h3>
<pre><code>&lt;article class="blog-post"&gt;
  &lt;h1&gt;Clean Semantic Markup&lt;/h1&gt;
  &lt;p&gt;Preserves your exact typography, spacing, and palette.&lt;/p&gt;
&lt;/article&gt;</code></pre>
<p><a href="#top" data-cta-button="true">Explore Live Design Presets</a></p>`,
    createdAt: now,
    updatedAt: now,
  };

  const secondDoc: NotepadDocument = {
    id: 'doc-product-brief',
    title: 'Q4 Product Launch Brief',
    seo: {
      pageTitle: 'Q4 Product Launch Brief — Release Overview',
      metaDescription: 'Executive launch brief outlining milestones, release scope, and key deliverables.',
      author: 'Product Team',
      keywords: 'product launch, roadmap, release brief',
      language: 'en',
    },
    design: applyThemePreset(DEFAULT_DESIGN_SETTINGS, 'professional'),
    contentHtml: `<h1>Q4 Product Launch Brief</h1>
<p>This briefing summarizes the core milestones, engineering readiness checks, and communication plan for our upcoming release.</p>
<h2>Release Objectives</h2>
<ol>
  <li>Deliver sub-second page loads across desktop and mobile devices.</li>
  <li>Publish complete interactive documentation for new team members.</li>
  <li>Validate accessibility compliance across primary navigation flows.</li>
</ol>
<p>Switch between documents anytime from the <strong>Documents</strong> panel on the left, or duplicate this brief to start a new template.</p>`,
    createdAt: now,
    updatedAt: now,
  };

  return [starterDoc, secondDoc];
}

export function createBlankDocument(title = 'Untitled Document'): NotepadDocument {
  const now = new Date().toISOString();
  const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    title,
    contentHtml: `<h1>${title}</h1><p>Start writing your document here...</p>`,
    design: { ...DEFAULT_DESIGN_SETTINGS },
    seo: {
      pageTitle: title,
      metaDescription: '',
      author: '',
      keywords: '',
      language: 'en',
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateDocumentRecord(source: NotepadDocument): NotepadDocument {
  const now = new Date().toISOString();
  const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    ...source,
    id,
    title: `${source.title} (Copy)`,
    design: { ...source.design },
    seo: {
      ...source.seo,
      pageTitle: `${source.seo.pageTitle || source.title} (Copy)`,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function loadDocumentsFromStorage(): NotepadDocument[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_DOCS_KEY);
    if (!raw) return createSeedDocuments();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return createSeedDocuments();
    }
    const valid = parsed
      .filter((doc): doc is Record<string, unknown> => Boolean(doc && typeof doc === 'object'))
      .map((doc, idx) => {
        const title =
          typeof doc.title === 'string' && doc.title.trim()
            ? doc.title
            : `Document ${idx + 1}`;
        const contentHtml =
          typeof doc.contentHtml === 'string' ? doc.contentHtml : '<p></p>';
        const designObj =
          doc.design && typeof doc.design === 'object'
            ? (doc.design as Partial<NotepadDocument['design']>)
            : {};
        const seoObj =
          doc.seo && typeof doc.seo === 'object'
            ? (doc.seo as Partial<NotepadDocument['seo']>)
            : {};

        return {
          id: typeof doc.id === 'string' && doc.id ? doc.id : `doc-restored-${idx}`,
          title,
          contentHtml,
          design: { ...DEFAULT_DESIGN_SETTINGS, ...designObj },
          seo: {
            pageTitle: typeof seoObj.pageTitle === 'string' ? seoObj.pageTitle : title,
            metaDescription: typeof seoObj.metaDescription === 'string' ? seoObj.metaDescription : '',
            author: typeof seoObj.author === 'string' ? seoObj.author : '',
            keywords: typeof seoObj.keywords === 'string' ? seoObj.keywords : '',
            language: typeof seoObj.language === 'string' && seoObj.language ? seoObj.language : 'en',
          },
          createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString(),
          updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date().toISOString(),
        };
      });

    return valid.length > 0 ? valid : createSeedDocuments();
  } catch {
    return createSeedDocuments();
  }
}

export function saveDocumentsToStorage(docs: NotepadDocument[]): void {
  try {
    window.localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(docs));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadActiveDocumentId(docs: NotepadDocument[]): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
    if (saved && docs.some((d) => d.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore
  }
  return docs[0]?.id ?? '';
}

export function saveActiveDocumentId(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
  } catch {
    // Ignore
  }
}

export function loadAppTheme(): 'light' | 'dark' {
  try {
    const saved = window.localStorage.getItem(STORAGE_APP_THEME_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveAppTheme(theme: 'light' | 'dark'): void {
  try {
    window.localStorage.setItem(STORAGE_APP_THEME_KEY, theme);
  } catch {
    // Ignore
  }
}

export function serializeDocumentToJson(doc: NotepadDocument): string {
  const bundle: ProjectExportBundle = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    document: doc,
  };
  return JSON.stringify(bundle, null, 2);
}

export function parseDocumentFromJson(jsonString: string): NotepadDocument {
  const parsed = JSON.parse(jsonString) as Partial<ProjectExportBundle> | Partial<NotepadDocument>;
  const candidate =
    'document' in parsed && parsed.document ? parsed.document : (parsed as Partial<NotepadDocument>);

  if (!candidate || typeof candidate.contentHtml !== 'string') {
    throw new Error('Invalid JSON project file.');
  }

  const now = new Date().toISOString();
  const title = typeof candidate.title === 'string' && candidate.title.trim()
    ? candidate.title.trim()
    : 'Imported Project';

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    contentHtml: sanitizeRichHtml(candidate.contentHtml),
    design: { ...DEFAULT_DESIGN_SETTINGS, ...(candidate.design || {}) },
    seo: {
      pageTitle: candidate.seo?.pageTitle ?? title,
      metaDescription: candidate.seo?.metaDescription ?? '',
      author: candidate.seo?.author ?? '',
      keywords: candidate.seo?.keywords ?? '',
      language: candidate.seo?.language ?? 'en',
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function parseDocumentFromHtmlFile(htmlString: string, fallbackTitle = 'Imported HTML Page'): NotepadDocument {
  const titleMatch = htmlString.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = htmlString.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const articleMatch = htmlString.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  const rawContent = articleMatch?.[1] ?? bodyMatch?.[1] ?? htmlString;
  const cleanHtml = sanitizeRichHtml(rawContent);
  const title = titleMatch?.[1]?.trim() || fallbackTitle;
  const now = new Date().toISOString();

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    contentHtml: cleanHtml || `<h1>${title}</h1><p></p>`,
    design: { ...DEFAULT_DESIGN_SETTINGS },
    seo: {
      pageTitle: title,
      metaDescription: descMatch?.[1]?.trim() ?? '',
      author: '',
      keywords: '',
      language: 'en',
    },
    createdAt: now,
    updatedAt: now,
  };
}
