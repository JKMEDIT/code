# FolioDraft — Free-Style Notepad & HTML Website Generator

FolioDraft is a browser-based rich-text writing studio and static website code generator. Write and format documents freely, customize typography, color palettes, and responsive layouts in real time, and export clean, dependency-free HTML5, CSS3, and vanilla JavaScript ready for GitHub Pages or any static web host.

## Features

- **Rich-Text Notepad Editor**: Headings (`H1`–`H3`), paragraphs, bold/italic/underline/strikethrough, text & highlight colors, alignments, ordered/unordered lists, indentation, line spacing, blockquotes, code blocks, tables, horizontal dividers, hyperlinks, clickable CTA buttons, and drag-and-drop or URL images with inline resizing, alignment, alt text, and captions.
- **10 Built-in Design Themes**: Light, Dark, Minimal, Professional, Corporate, Modern Blog, Newspaper, Magazine, Educational, and Custom Theme.
- **Full Design Customization**: Google Fonts pairing (heading & body), font sizes, weights, line height, letter spacing, custom color pickers, layout widths (`Full`, `Boxed`, `Narrow`), border radius, shadows, and SEO metadata.
- **Live Responsive Preview**: Split-screen, Editor-only, and Preview-only modes with Desktop, Laptop (`1280px`), Tablet (`768px`), and Mobile (`390px`) device frames.
- **One-Click Website Code Generator**:
  - Generates clean `index.html`, `style.css`, `script.js`, and a self-contained `Standalone HTML` file.
  - Copies HTML, CSS, or JS directly to clipboard.
  - Downloads standalone `.html` or a complete `.zip` bundle (`index.html`, `style.css`, `script.js`, `README.md`, and extracted `assets/` images).
- **Local Document Management**: Auto-saves to `localStorage`, supports creating, renaming, duplicating, deleting documents, importing existing `.html` files, and exporting/importing `.json` project bundles.

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Running Unit Tests

```bash
npx --yes tsx --test src/lib/codeGenerator.test.ts
```

## Building for Production

```bash
npm run build
```
