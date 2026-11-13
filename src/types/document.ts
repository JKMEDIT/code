export type ThemePresetId =
  | 'light'
  | 'dark'
  | 'minimal'
  | 'professional'
  | 'corporate'
  | 'modern-blog'
  | 'newspaper'
  | 'magazine'
  | 'educational'
  | 'custom';

export type LayoutMode = 'full' | 'boxed' | 'narrow';
export type ShadowStyle = 'none' | 'subtle' | 'elevated' | 'border';
export type ImageAlign = 'left' | 'center' | 'right' | 'full';
export type DeviceViewport = 'desktop' | 'laptop' | 'tablet' | 'mobile';
export type WorkspaceViewMode = 'split' | 'editor' | 'preview';

export interface DesignSettings {
  themePreset: ThemePresetId;
  // Typography
  headingFont: string;
  bodyFont: string;
  h1SizePx: number;
  h2SizePx: number;
  h3SizePx: number;
  bodySizePx: number;
  lineHeight: number;
  letterSpacingEm: number;
  headingWeight: number;
  bodyWeight: number;
  numberedHeadings: boolean;
  // Colors
  mainBgColor: string;
  contentBgColor: string;
  headingColor: string;
  bodyColor: string;
  linkColor: string;
  borderColor: string;
  accentColor: string;
  // Layout
  layoutMode: LayoutMode;
  contentWidthPx: number;
  sectionSpacingPx: number;
  contentPaddingPx: number;
  borderRadiusPx: number;
  shadowStyle: ShadowStyle;
  defaultImageAlign: ImageAlign;
  // JS enhancements in generated website
  enableSmoothScroll: boolean;
  enableCodeCopy: boolean;
  enableImageLightbox: boolean;
  enableBackToTop: boolean;
}

export interface SeoMetadata {
  pageTitle: string;
  metaDescription: string;
  author: string;
  keywords: string;
  language: string;
}

export interface NotepadDocument {
  id: string;
  title: string;
  contentHtml: string;
  design: DesignSettings;
  seo: SeoMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectExportBundle {
  schemaVersion: 1;
  exportedAt: string;
  document: NotepadDocument;
}

export interface ExtractedAsset {
  filename: string;
  path: string;
  mimeType: string;
  base64Data: string;
}

export interface GeneratedWebsiteCode {
  indexHtml: string;
  css: string;
  js: string;
  standaloneHtml: string;
  readmeMd: string;
  assets: ExtractedAsset[];
  zipIndexHtml: string;
}
