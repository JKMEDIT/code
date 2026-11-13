import React, { useState } from 'react';
import type {
  DesignSettings,
  ImageAlign,
  LayoutMode,
  SeoMetadata,
  ShadowStyle,
  ThemePresetId,
} from '../types/document';
import { applyThemePreset, GOOGLE_FONTS, THEME_PRESETS } from '../lib/themes';

interface RightDesignSidebarProps {
  design: DesignSettings;
  seo: SeoMetadata;
  onChangeDesign: (next: DesignSettings) => void;
  onChangeSeo: (next: SeoMetadata) => void;
}

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const ColorField: React.FC<ColorFieldProps> = ({ id, label, value, onChange }) => (
  <div className="flex items-center justify-between gap-2">
    <label htmlFor={id} className="text-xs text-slate-600 dark:text-slate-400">
      {label}
    </label>
    <div className="flex items-center gap-1.5">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5 dark:border-slate-700"
      />
      <input
        type="text"
        aria-label={`${label} hex`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      />
    </div>
  </div>
);

export const RightDesignSidebar: React.FC<RightDesignSidebarProps> = ({
  design,
  seo,
  onChangeDesign,
  onChangeSeo,
}) => {
  const [section, setSection] = useState<'themes' | 'type' | 'colors' | 'layout'>('themes');

  const updateToken = <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => {
    onChangeDesign({
      ...design,
      [key]: value,
      themePreset: 'custom',
    });
  };

  const handlePresetClick = (presetId: ThemePresetId) => {
    onChangeDesign(applyThemePreset(design, presetId));
  };

  return (
    <aside
      aria-label="Theme and design customization"
      className="flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Section Tabs */}
      <div className="border-b border-slate-200 p-2 dark:border-slate-800">
        <div className="grid grid-cols-4 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800" role="tablist">
          {(
            [
              ['themes', 'Themes'],
              ['type', 'Type'],
              ['colors', 'Colors'],
              ['layout', 'Layout'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={section === id}
              onClick={() => setSection(id)}
              className={`rounded-md py-1.5 text-[11px] font-medium transition-colors ${
                section === id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="studio-scroll flex-1 overflow-y-auto p-3.5">
        {section === 'themes' && (
          <div className="space-y-2">
            <p className="mb-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Theme Presets
            </p>
            {THEME_PRESETS.map((preset) => {
              const active = design.themePreset === preset.id;
              const bg = preset.tokens.mainBgColor ?? design.mainBgColor;
              const surface = preset.tokens.contentBgColor ?? design.contentBgColor;
              const accent = preset.tokens.accentColor ?? design.accentColor;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset.id)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                    active
                      ? 'border-blue-500 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/30'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: bg }}
                  >
                    <div
                      className="h-4 w-4 rounded-xs border"
                      style={{ backgroundColor: surface, borderColor: accent }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {preset.label}
                    </div>
                    <div className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                      {preset.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {section === 'type' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="fd-heading-font" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Heading Font (Google Fonts)
              </label>
              <select
                id="fd-heading-font"
                value={design.headingFont}
                onChange={(e) => updateToken('headingFont', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {GOOGLE_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fd-body-font" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Paragraph Font (Google Fonts)
              </label>
              <select
                id="fd-body-font"
                value={design.bodyFont}
                onChange={(e) => updateToken('bodyFont', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {GOOGLE_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fd-h1-size" className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>H1 Size</span>
                  <span className="font-mono tabular-nums">{design.h1SizePx}px</span>
                </label>
                <input
                  id="fd-h1-size"
                  type="range"
                  min={24}
                  max={64}
                  value={design.h1SizePx}
                  onChange={(e) => updateToken('h1SizePx', Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label htmlFor="fd-h2-size" className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>H2 Size</span>
                  <span className="font-mono tabular-nums">{design.h2SizePx}px</span>
                </label>
                <input
                  id="fd-h2-size"
                  type="range"
                  min={18}
                  max={44}
                  value={design.h2SizePx}
                  onChange={(e) => updateToken('h2SizePx', Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label htmlFor="fd-h3-size" className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>H3 Size</span>
                  <span className="font-mono tabular-nums">{design.h3SizePx}px</span>
                </label>
                <input
                  id="fd-h3-size"
                  type="range"
                  min={16}
                  max={32}
                  value={design.h3SizePx}
                  onChange={(e) => updateToken('h3SizePx', Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label htmlFor="fd-body-size" className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Body Size</span>
                  <span className="font-mono tabular-nums">{design.bodySizePx}px</span>
                </label>
                <input
                  id="fd-body-size"
                  type="range"
                  min={13}
                  max={24}
                  value={design.bodySizePx}
                  onChange={(e) => updateToken('bodySizePx', Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fd-line-height" className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Line Height</span>
                <span className="font-mono tabular-nums">{design.lineHeight.toFixed(2)}</span>
              </label>
              <input
                id="fd-line-height"
                type="range"
                min={1.2}
                max={2.2}
                step={0.05}
                value={design.lineHeight}
                onChange={(e) => updateToken('lineHeight', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label htmlFor="fd-letter-spacing" className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Letter Spacing</span>
                <span className="font-mono tabular-nums">{design.letterSpacingEm.toFixed(2)}em</span>
              </label>
              <input
                id="fd-letter-spacing"
                type="range"
                min={-0.03}
                max={0.1}
                step={0.01}
                value={design.letterSpacingEm}
                onChange={(e) => updateToken('letterSpacingEm', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fd-heading-weight" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  Heading Weight
                </label>
                <select
                  id="fd-heading-weight"
                  value={design.headingWeight}
                  onChange={(e) => updateToken('headingWeight', Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value={500}>500 Medium</option>
                  <option value={600}>600 SemiBold</option>
                  <option value={700}>700 Bold</option>
                </select>
              </div>
              <div>
                <label htmlFor="fd-body-weight" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  Body Weight
                </label>
                <select
                  id="fd-body-weight"
                  value={design.bodyWeight}
                  onChange={(e) => updateToken('bodyWeight', Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value={400}>400 Regular</option>
                  <option value={500}>500 Medium</option>
                </select>
              </div>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:text-slate-300">
              <span>Auto-Number Headings (H2/H3)</span>
              <input
                type="checkbox"
                checked={design.numberedHeadings}
                onChange={(e) => updateToken('numberedHeadings', e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
            </label>
          </div>
        )}

        {section === 'colors' && (
          <div className="space-y-3.5">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Custom Palette
            </p>
            <ColorField
              id="fd-color-mainbg"
              label="Main Background"
              value={design.mainBgColor}
              onChange={(v) => updateToken('mainBgColor', v)}
            />
            <ColorField
              id="fd-color-contentbg"
              label="Content Surface"
              value={design.contentBgColor}
              onChange={(v) => updateToken('contentBgColor', v)}
            />
            <ColorField
              id="fd-color-heading"
              label="Heading Color"
              value={design.headingColor}
              onChange={(v) => updateToken('headingColor', v)}
            />
            <ColorField
              id="fd-color-body"
              label="Paragraph Color"
              value={design.bodyColor}
              onChange={(v) => updateToken('bodyColor', v)}
            />
            <ColorField
              id="fd-color-link"
              label="Link Color"
              value={design.linkColor}
              onChange={(v) => updateToken('linkColor', v)}
            />
            <ColorField
              id="fd-color-border"
              label="Border Color"
              value={design.borderColor}
              onChange={(v) => updateToken('borderColor', v)}
            />
            <ColorField
              id="fd-color-accent"
              label="Accent Color"
              value={design.accentColor}
              onChange={(v) => updateToken('accentColor', v)}
            />
          </div>
        )}

        {section === 'layout' && (
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Page Layout Mode
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['full', 'Full'],
                    ['boxed', 'Boxed'],
                    ['narrow', 'Narrow'],
                  ] as [LayoutMode, string][]
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateToken('layoutMode', mode)}
                    className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                      design.layoutMode === mode
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="fd-content-width" className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Content Width</span>
                <span className="font-mono tabular-nums">{design.contentWidthPx}px</span>
              </label>
              <input
                id="fd-content-width"
                type="range"
                min={600}
                max={1280}
                step={20}
                value={design.contentWidthPx}
                onChange={(e) => updateToken('contentWidthPx', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label htmlFor="fd-section-spacing" className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Section Spacing</span>
                <span className="font-mono tabular-nums">{design.sectionSpacingPx}px</span>
              </label>
              <input
                id="fd-section-spacing"
                type="range"
                min={10}
                max={40}
                step={2}
                value={design.sectionSpacingPx}
                onChange={(e) => updateToken('sectionSpacingPx', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label htmlFor="fd-content-pad" className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Inner Padding</span>
                <span className="font-mono tabular-nums">{design.contentPaddingPx}px</span>
              </label>
              <input
                id="fd-content-pad"
                type="range"
                min={16}
                max={80}
                step={4}
                value={design.contentPaddingPx}
                onChange={(e) => updateToken('contentPaddingPx', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label htmlFor="fd-radius" className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Border Radius</span>
                <span className="font-mono tabular-nums">{design.borderRadiusPx}px</span>
              </label>
              <input
                id="fd-radius"
                type="range"
                min={0}
                max={28}
                step={2}
                value={design.borderRadiusPx}
                onChange={(e) => updateToken('borderRadiusPx', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fd-shadow" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  Shadow Effect
                </label>
                <select
                  id="fd-shadow"
                  value={design.shadowStyle}
                  onChange={(e) => updateToken('shadowStyle', e.target.value as ShadowStyle)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="none">None</option>
                  <option value="subtle">Subtle</option>
                  <option value="elevated">Elevated</option>
                  <option value="border">Crisp Border</option>
                </select>
              </div>
              <div>
                <label htmlFor="fd-default-img-align" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  Image Alignment
                </label>
                <select
                  id="fd-default-img-align"
                  value={design.defaultImageAlign}
                  onChange={(e) => updateToken('defaultImageAlign', e.target.value as ImageAlign)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="center">Center</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="full">Full Width</option>
                </select>
              </div>
            </div>

            {/* SEO Metadata */}
            <div className="space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                SEO &amp; Export Metadata
              </p>
              <div>
                <label htmlFor="fd-seo-title" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  HTML Page Title
                </label>
                <input
                  id="fd-seo-title"
                  type="text"
                  value={seo.pageTitle}
                  onChange={(e) => onChangeSeo({ ...seo, pageTitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="fd-seo-desc" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  Meta Description
                </label>
                <textarea
                  id="fd-seo-desc"
                  rows={2}
                  value={seo.metaDescription}
                  onChange={(e) => onChangeSeo({ ...seo, metaDescription: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="fd-seo-author" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                    Author
                  </label>
                  <input
                    id="fd-seo-author"
                    type="text"
                    value={seo.author}
                    onChange={(e) => onChangeSeo({ ...seo, author: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="fd-seo-lang" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                    Language
                  </label>
                  <input
                    id="fd-seo-lang"
                    type="text"
                    value={seo.language}
                    onChange={(e) => onChangeSeo({ ...seo, language: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* JS Enhancements */}
            <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Exported JavaScript Features
              </p>
              {(
                [
                  ['enableSmoothScroll', 'Smooth anchor scroll'],
                  ['enableCodeCopy', 'Code block copy button'],
                  ['enableImageLightbox', 'Click-to-zoom image lightbox'],
                  ['enableBackToTop', 'Floating back-to-top button'],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={design[key]}
                    onChange={(e) => updateToken(key, e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
